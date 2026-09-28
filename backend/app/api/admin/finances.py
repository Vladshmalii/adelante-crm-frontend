"""Финансы: дашборд, операции, документы, чеки, способы оплаты, кассы.

Раздел целиком — только суперюзер (ACCESS.md). Оплату визита любой
администратор проводит через POST /records/{id}/payment.
"""

import io
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from pydantic import Field
from sqlalchemy import Select, case, func, select

from app.api.admin.deps import CurrentAuthor
from app.api.schemas import ApiModel, Envelope, PersonRef, page_meta
from app.api.security import require_superuser
from app.models.shard import (
    AuditAction,
    CashRegister,
    CommissionPayer,
    CommissionType,
    DocumentContentType,
    DocumentStatus,
    DocumentType,
    FinanceDocument,
    FinanceOperation,
    OperationStatus,
    OperationType,
    PaymentMethod,
    PaymentMethodType,
    Receipt,
    ReceiptSource,
    ReceiptStatus,
    Record,
    RecordService,
    RecordStatus,
)
from app.services import visits as visits_service
from app.services.audit import diff_fields, write_audit
from app.tenancy.deps import SalonId, TenantSession
from app.timeutils import SALON_TZ_NAME, LocalDatetime, to_local

# Фильтры «по співробітнику» (мастер записи) и «по локації» (локация кассы).
# Операции и чеки без записи под фильтр по мастеру не попадают.
MasterFilter = Annotated[uuid.UUID | None, Query(alias="masterId")]
LocationFilter = Annotated[str | None, Query()]


def _master_records(master_id: uuid.UUID) -> Select[uuid.UUID]:
    return select(Record.id).where(Record.master_id == master_id)


def _location_registers(location: str) -> Select[uuid.UUID]:
    return select(CashRegister.id).where(CashRegister.location == location)


OPERATION_TYPE_NAMES = {
    OperationType.INCOME: "Прихід",
    OperationType.EXPENSE: "Видаток",
    OperationType.TRANSFER: "Переказ",
}


def _operation_title(op: FinanceOperation) -> str:
    return f"Операція: {OPERATION_TYPE_NAMES.get(op.type, op.type.value)} {op.amount} ₴"


router = APIRouter(prefix="/finances", tags=["finances"], dependencies=[Depends(require_superuser)])


# --- Дашборд ----------------------------------------------------------------


class DayAmount(ApiModel):
    date: str
    amount: Decimal


class CategoryAmount(ApiModel):
    category: str
    amount: Decimal


class PaymentSplitItem(ApiModel):
    method_type: PaymentMethodType
    amount: Decimal
    share: float


class TopService(ApiModel):
    name: str
    revenue: Decimal
    count: int


class DashboardOut(ApiModel):
    total_revenue: Decimal
    total_expenses: Decimal
    net_income: Decimal
    revenue_by_day: list[DayAmount]
    expenses_by_category: list[CategoryAmount]
    payment_split: list[PaymentSplitItem]
    top_services: list[TopService]


@router.get("/dashboard", response_model=Envelope[DashboardOut])
async def dashboard(
    tenant_session: TenantSession,
    date_from: Annotated[LocalDatetime, Query(alias="dateFrom")],
    date_to: Annotated[LocalDatetime, Query(alias="dateTo")],
    master_id: MasterFilter = None,
    location: LocationFilter = None,
) -> Envelope[DashboardOut]:
    ops_query = select(FinanceOperation).where(
        FinanceOperation.status == OperationStatus.COMPLETED,
        FinanceOperation.date >= date_from,
        FinanceOperation.date < date_to,
    )
    receipt_filters = [
        Receipt.status != ReceiptStatus.CANCELLED,
        Receipt.date >= date_from,
        Receipt.date < date_to,
    ]
    if master_id is not None:
        ops_query = ops_query.where(FinanceOperation.record_id.in_(_master_records(master_id)))
        receipt_filters.append(Receipt.record_id.in_(_master_records(master_id)))
    if location:
        ops_query = ops_query.where(
            FinanceOperation.cash_register_id.in_(_location_registers(location))
        )
        receipt_filters.append(Receipt.cash_register_id.in_(_location_registers(location)))
    completed_ops = ops_query.subquery()
    revenue, expenses = (
        await tenant_session.execute(
            select(
                func.coalesce(
                    func.sum(
                        case(
                            (completed_ops.c.type == OperationType.INCOME, completed_ops.c.amount),
                            else_=0,
                        )
                    ),
                    0,
                ),
                func.coalesce(
                    func.sum(
                        case(
                            (completed_ops.c.type == OperationType.EXPENSE, completed_ops.c.amount),
                            else_=0,
                        )
                    ),
                    0,
                ),
            )
        )
    ).one()

    day_expr = func.date_trunc("day", func.timezone(SALON_TZ_NAME, completed_ops.c.date)).label(
        "day"
    )
    by_day = await tenant_session.execute(
        select(day_expr, func.sum(completed_ops.c.amount))
        .where(completed_ops.c.type == OperationType.INCOME)
        .group_by(day_expr)
        .order_by(day_expr)
    )
    by_category = await tenant_session.execute(
        select(
            func.coalesce(completed_ops.c.category, "прочее"),
            func.sum(completed_ops.c.amount),
        )
        .where(completed_ops.c.type == OperationType.EXPENSE)
        .group_by(completed_ops.c.category)
        .order_by(func.sum(completed_ops.c.amount).desc())
    )

    # Разбивка по типам оплат — из чеков (актуальные, не отменённые)
    from app.models.shard import ReceiptPayment

    split_rows = (
        await tenant_session.execute(
            select(PaymentMethod.type, func.sum(ReceiptPayment.amount))
            .join(ReceiptPayment, ReceiptPayment.payment_method_id == PaymentMethod.id)
            .join(Receipt, Receipt.id == ReceiptPayment.receipt_id)
            .where(*receipt_filters)
            .group_by(PaymentMethod.type)
        )
    ).all()
    split_total = sum((amount for _, amount in split_rows), Decimal(0))

    top_query = (
        select(RecordService.name, func.sum(RecordService.price), func.count())
        .join(Record, Record.id == RecordService.record_id)
        .where(
            Record.status == RecordStatus.COMPLETED,
            Record.start_at >= date_from,
            Record.start_at < date_to,
        )
    )
    if master_id is not None:
        top_query = top_query.where(Record.master_id == master_id)
    if location:
        # У записи нет кассы — берём записи, оплаченные через кассы этой локации
        top_query = top_query.where(
            Record.id.in_(
                select(Receipt.record_id).where(
                    Receipt.status != ReceiptStatus.CANCELLED,
                    Receipt.cash_register_id.in_(_location_registers(location)),
                )
            )
        )
    top = await tenant_session.execute(
        top_query.group_by(RecordService.name)
        .order_by(func.sum(RecordService.price).desc())
        .limit(10)
    )

    return Envelope(
        data=DashboardOut(
            total_revenue=revenue,
            total_expenses=expenses,
            net_income=revenue - expenses,
            revenue_by_day=[DayAmount(date=d.strftime("%Y-%m-%d"), amount=a) for d, a in by_day],
            expenses_by_category=[CategoryAmount(category=c, amount=a) for c, a in by_category],
            payment_split=[
                PaymentSplitItem(
                    method_type=t,
                    amount=a,
                    share=round(float(a / split_total), 4) if split_total else 0.0,
                )
                for t, a in split_rows
            ],
            top_services=[TopService(name=n, revenue=r, count=c) for n, r, c in top],
        )
    )


# --- Операции ---------------------------------------------------------------


class OperationOut(ApiModel):
    id: uuid.UUID
    type: OperationType
    amount: Decimal
    category: str | None
    description: str | None
    date: datetime
    status: OperationStatus
    payment_method: PersonRef | None
    cash_register: PersonRef | None
    client_id: uuid.UUID | None
    record_id: uuid.UUID | None
    receipt_id: uuid.UUID | None
    document_id: uuid.UUID | None
    author: PersonRef
    created_at: datetime


async def _refs(
    tenant_session, operations: list[FinanceOperation]
) -> tuple[dict[uuid.UUID, str], dict[uuid.UUID, str]]:
    method_ids = {o.payment_method_id for o in operations if o.payment_method_id}
    register_ids = {o.cash_register_id for o in operations if o.cash_register_id}
    methods, registers = {}, {}
    if method_ids:
        for m in await tenant_session.scalars(
            select(PaymentMethod).where(PaymentMethod.id.in_(method_ids))
        ):
            methods[m.id] = m.name
    if register_ids:
        for r in await tenant_session.scalars(
            select(CashRegister).where(CashRegister.id.in_(register_ids))
        ):
            registers[r.id] = r.name
    return methods, registers


def _operation_out(op: FinanceOperation, methods: dict, registers: dict) -> OperationOut:
    return OperationOut(
        id=op.id,
        type=op.type,
        amount=op.amount,
        category=op.category,
        description=op.description,
        date=op.date,
        status=op.status,
        payment_method=(
            PersonRef(id=str(op.payment_method_id), name=methods.get(op.payment_method_id))
            if op.payment_method_id
            else None
        ),
        cash_register=(
            PersonRef(id=str(op.cash_register_id), name=registers.get(op.cash_register_id))
            if op.cash_register_id
            else None
        ),
        client_id=op.client_id,
        record_id=op.record_id,
        receipt_id=op.receipt_id,
        document_id=op.document_id,
        author=PersonRef(id=str(op.author_id) if op.author_id else None, name=op.author_name),
        created_at=op.created_at,
    )


@router.get("/operations", response_model=Envelope[list[OperationOut]])
async def list_operations(
    tenant_session: TenantSession,
    op_type: Annotated[OperationType | None, Query(alias="type")] = None,
    category: str | None = None,
    cash_register_id: Annotated[uuid.UUID | None, Query(alias="cashRegisterId")] = None,
    payment_method_id: Annotated[uuid.UUID | None, Query(alias="paymentMethodId")] = None,
    date_from: Annotated[LocalDatetime | None, Query(alias="dateFrom")] = None,
    date_to: Annotated[LocalDatetime | None, Query(alias="dateTo")] = None,
    master_id: MasterFilter = None,
    location: LocationFilter = None,
    page: int = 1,
    per_page: Annotated[int, Query(alias="perPage", le=200)] = 50,
) -> Envelope[list[OperationOut]]:
    query = select(FinanceOperation)
    if master_id is not None:
        query = query.where(FinanceOperation.record_id.in_(_master_records(master_id)))
    if location:
        query = query.where(FinanceOperation.cash_register_id.in_(_location_registers(location)))
    if op_type is not None:
        query = query.where(FinanceOperation.type == op_type)
    if category:
        query = query.where(FinanceOperation.category == category)
    if cash_register_id is not None:
        query = query.where(FinanceOperation.cash_register_id == cash_register_id)
    if payment_method_id is not None:
        query = query.where(FinanceOperation.payment_method_id == payment_method_id)
    if date_from is not None:
        query = query.where(FinanceOperation.date >= date_from)
    if date_to is not None:
        query = query.where(FinanceOperation.date < date_to)

    total = await tenant_session.scalar(select(func.count()).select_from(query.subquery()))
    operations = list(
        await tenant_session.scalars(
            query.order_by(FinanceOperation.date.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
        )
    )
    methods, registers = await _refs(tenant_session, operations)
    return Envelope(
        data=[_operation_out(o, methods, registers) for o in operations],
        meta=page_meta(page, per_page, total or 0),
    )


class OperationCreateIn(ApiModel):
    type: OperationType
    amount: Decimal = Field(gt=0)
    category: str | None = None
    description: str | None = None
    date: LocalDatetime
    payment_method_id: uuid.UUID | None = None
    cash_register_id: uuid.UUID | None = None
    client_id: uuid.UUID | None = None


@router.post(
    "/operations", response_model=Envelope[OperationOut], status_code=status.HTTP_201_CREATED
)
async def create_operation(
    body: OperationCreateIn,
    author: CurrentAuthor,
    tenant_session: TenantSession,
) -> Envelope[OperationOut]:
    if body.cash_register_id is not None:
        await _active_register(tenant_session, body.cash_register_id)
    op = FinanceOperation(
        **body.model_dump(by_alias=False),
        author_id=author.id,
        author_name=author.name,
    )
    tenant_session.add(op)
    await tenant_session.flush()
    write_audit(
        tenant_session,
        entity="finance",
        entity_id=op.id,
        entity_name=_operation_title(op),
        action=AuditAction.CREATED,
        author_id=author.id,
        author_name=author.name,
    )
    methods, registers = await _refs(tenant_session, [op])
    return Envelope(data=_operation_out(op, methods, registers))


class OperationPatchIn(ApiModel):
    amount: Decimal | None = Field(default=None, gt=0)
    category: str | None = None
    description: str | None = None
    date: LocalDatetime | None = None
    status: OperationStatus | None = None


@router.patch("/operations/{operation_id}", response_model=Envelope[OperationOut])
async def patch_operation(
    operation_id: uuid.UUID,
    body: OperationPatchIn,
    author: CurrentAuthor,
    tenant_session: TenantSession,
) -> Envelope[OperationOut]:
    op = await tenant_session.get(FinanceOperation, operation_id)
    if op is None:
        raise HTTPException(404, "Операцію не знайдено")
    updates = body.model_dump(exclude_unset=True, by_alias=False)
    changes = diff_fields(op, updates)
    for field, value in updates.items():
        setattr(op, field, value)
    if changes:
        write_audit(
            tenant_session,
            entity="finance",
            entity_id=op.id,
            entity_name=_operation_title(op),
            action=AuditAction.UPDATED,
            author_id=author.id,
            author_name=author.name,
            details=changes,
        )
    methods, registers = await _refs(tenant_session, [op])
    return Envelope(data=_operation_out(op, methods, registers))


# --- Документы --------------------------------------------------------------


class DocumentOut(ApiModel):
    id: uuid.UUID
    type: DocumentType
    number: str
    date: datetime
    amount: Decimal
    content_type: DocumentContentType
    counterparty: str | None
    comment: str | None
    status: DocumentStatus
    author: PersonRef
    created_at: datetime


def _document_out(d: FinanceDocument) -> DocumentOut:
    return DocumentOut(
        id=d.id,
        type=d.type,
        number=d.number,
        date=d.date,
        amount=d.amount,
        content_type=d.content_type,
        counterparty=d.counterparty,
        comment=d.comment,
        status=d.status,
        author=PersonRef(id=str(d.author_id) if d.author_id else None, name=d.author_name),
        created_at=d.created_at,
    )


@router.get("/documents", response_model=Envelope[list[DocumentOut]])
async def list_documents(
    tenant_session: TenantSession,
    doc_type: Annotated[DocumentType | None, Query(alias="type")] = None,
    doc_status: Annotated[DocumentStatus | None, Query(alias="status")] = None,
    date_from: Annotated[LocalDatetime | None, Query(alias="dateFrom")] = None,
    date_to: Annotated[LocalDatetime | None, Query(alias="dateTo")] = None,
    page: int = 1,
    per_page: Annotated[int, Query(alias="perPage", le=200)] = 50,
) -> Envelope[list[DocumentOut]]:
    query = select(FinanceDocument)
    if doc_type is not None:
        query = query.where(FinanceDocument.type == doc_type)
    if doc_status is not None:
        query = query.where(FinanceDocument.status == doc_status)
    if date_from is not None:
        query = query.where(FinanceDocument.date >= date_from)
    if date_to is not None:
        query = query.where(FinanceDocument.date < date_to)

    total = await tenant_session.scalar(select(func.count()).select_from(query.subquery()))
    docs = await tenant_session.scalars(
        query.order_by(FinanceDocument.date.desc()).offset((page - 1) * per_page).limit(per_page)
    )
    return Envelope(
        data=[_document_out(d) for d in docs], meta=page_meta(page, per_page, total or 0)
    )


class DocumentCreateIn(ApiModel):
    type: DocumentType
    number: str = Field(min_length=1, max_length=64)
    date: LocalDatetime
    amount: Decimal = Field(ge=0)
    content_type: DocumentContentType = DocumentContentType.SERVICES
    counterparty: str | None = None
    comment: str | None = None
    status: DocumentStatus = DocumentStatus.DRAFT


@router.post(
    "/documents", response_model=Envelope[DocumentOut], status_code=status.HTTP_201_CREATED
)
async def create_document(
    body: DocumentCreateIn,
    author: CurrentAuthor,
    tenant_session: TenantSession,
) -> Envelope[DocumentOut]:
    exists = await tenant_session.scalar(
        select(FinanceDocument).where(FinanceDocument.number == body.number)
    )
    if exists is not None:
        raise HTTPException(409, "Документ з таким номером уже існує")
    doc = FinanceDocument(
        **body.model_dump(by_alias=False), author_id=author.id, author_name=author.name
    )
    tenant_session.add(doc)
    await tenant_session.flush()
    write_audit(
        tenant_session,
        entity="finance",
        entity_id=doc.id,
        entity_name=f"Документ № {doc.number}",
        action=AuditAction.CREATED,
        author_id=author.id,
        author_name=author.name,
    )
    return Envelope(data=_document_out(doc))


class DocumentPatchIn(ApiModel):
    date: LocalDatetime | None = None
    amount: Decimal | None = Field(default=None, ge=0)
    content_type: DocumentContentType | None = None
    counterparty: str | None = None
    comment: str | None = None
    status: DocumentStatus | None = None


@router.patch("/documents/{document_id}", response_model=Envelope[DocumentOut])
async def patch_document(
    document_id: uuid.UUID,
    body: DocumentPatchIn,
    author: CurrentAuthor,
    tenant_session: TenantSession,
) -> Envelope[DocumentOut]:
    doc = await tenant_session.get(FinanceDocument, document_id)
    if doc is None:
        raise HTTPException(404, "Документ не знайдено")
    if doc.status == DocumentStatus.CANCELLED:
        raise HTTPException(409, "Скасований документ не можна змінювати")
    updates = body.model_dump(exclude_unset=True, by_alias=False)
    changes = diff_fields(doc, updates)
    for field, value in updates.items():
        setattr(doc, field, value)
    if changes:
        write_audit(
            tenant_session,
            entity="finance",
            entity_id=doc.id,
            entity_name=f"Документ № {doc.number}",
            action=AuditAction.UPDATED,
            author_id=author.id,
            author_name=author.name,
            details=changes,
        )
    return Envelope(data=_document_out(doc))


# --- Чеки -------------------------------------------------------------------


class ReceiptPaymentOut(ApiModel):
    method: PersonRef
    method_type: PaymentMethodType | None = None
    amount: Decimal


class ReceiptOut(ApiModel):
    id: uuid.UUID
    number: str
    date: datetime
    cash_register: PersonRef
    client: PersonRef | None
    record_id: uuid.UUID | None
    amount: Decimal
    payments: list[ReceiptPaymentOut]
    status: ReceiptStatus
    source: ReceiptSource
    author: PersonRef


async def _receipt_out(tenant_session, receipt: Receipt) -> ReceiptOut:
    register = await tenant_session.get(CashRegister, receipt.cash_register_id)
    payments = []
    for p in receipt.payments:
        method = await tenant_session.get(PaymentMethod, p.payment_method_id)
        payments.append(
            ReceiptPaymentOut(
                method=PersonRef(id=str(p.payment_method_id), name=method.name if method else None),
                method_type=method.type if method else None,
                amount=p.amount,
            )
        )
    return ReceiptOut(
        id=receipt.id,
        number=receipt.number,
        date=receipt.date,
        cash_register=PersonRef(
            id=str(receipt.cash_register_id), name=register.name if register else None
        ),
        client=(
            PersonRef(
                id=str(receipt.client_id) if receipt.client_id else None,
                name=receipt.client_name,
            )
            if receipt.client_id or receipt.client_name
            else None
        ),
        record_id=receipt.record_id,
        amount=receipt.amount,
        payments=payments,
        status=receipt.status,
        source=receipt.source,
        author=PersonRef(
            id=str(receipt.author_id) if receipt.author_id else None,
            name=receipt.author_name,
        ),
    )


@router.get("/receipts", response_model=Envelope[list[ReceiptOut]])
async def list_receipts(
    tenant_session: TenantSession,
    receipt_status: Annotated[ReceiptStatus | None, Query(alias="status")] = None,
    date_from: Annotated[LocalDatetime | None, Query(alias="dateFrom")] = None,
    date_to: Annotated[LocalDatetime | None, Query(alias="dateTo")] = None,
    master_id: MasterFilter = None,
    location: LocationFilter = None,
    page: int = 1,
    per_page: Annotated[int, Query(alias="perPage", le=200)] = 50,
) -> Envelope[list[ReceiptOut]]:
    query = select(Receipt)
    if master_id is not None:
        query = query.where(Receipt.record_id.in_(_master_records(master_id)))
    if location:
        query = query.where(Receipt.cash_register_id.in_(_location_registers(location)))
    if receipt_status is not None:
        query = query.where(Receipt.status == receipt_status)
    if date_from is not None:
        query = query.where(Receipt.date >= date_from)
    if date_to is not None:
        query = query.where(Receipt.date < date_to)

    total = await tenant_session.scalar(select(func.count()).select_from(query.subquery()))
    receipts = await tenant_session.scalars(
        query.order_by(Receipt.date.desc()).offset((page - 1) * per_page).limit(per_page)
    )
    return Envelope(
        data=[await _receipt_out(tenant_session, r) for r in receipts],
        meta=page_meta(page, per_page, total or 0),
    )


class ReceiptPaymentIn(ApiModel):
    payment_method_id: uuid.UUID
    amount: Decimal = Field(gt=0)


class ReceiptCreateIn(ApiModel):
    client_id: uuid.UUID | None = None
    client_name: str | None = None
    # Чек оплаты визита: запись должна быть завершена и не оплачена, сумма
    # оплат — равна сумме записи; клиент берётся из записи
    record_id: uuid.UUID | None = None
    payments: list[ReceiptPaymentIn] = Field(min_length=1)
    source: ReceiptSource = ReceiptSource.WEB
    date: LocalDatetime | None = None


@router.post("/receipts", response_model=Envelope[ReceiptOut], status_code=status.HTTP_201_CREATED)
async def create_receipt(
    body: ReceiptCreateIn,
    author: CurrentAuthor,
    salon_id: SalonId,
    tenant_session: TenantSession,
) -> Envelope[ReceiptOut]:
    """Чек: ручная продажа или (с recordId) оплата визита. Операции — на каждую оплату."""
    payments = [
        visits_service.PaymentPart(payment_method_id=p.payment_method_id, amount=p.amount)
        for p in body.payments
    ]
    try:
        if body.record_id is not None:
            record = await tenant_session.get(Record, body.record_id)
            if record is None:
                raise HTTPException(404, "Запис не знайдено")
            receipt = await visits_service.pay_record(
                tenant_session,
                salon_id=salon_id,
                record=record,
                payments=payments,
                author_id=author.id,
                author_name=author.name,
                date=body.date,
                source=body.source,
            )
        else:
            receipt = await visits_service.create_receipt(
                tenant_session,
                payments=payments,
                source=body.source,
                date=body.date or datetime.now().astimezone(),
                author_id=author.id,
                author_name=author.name,
                client_id=body.client_id,
                client_name=body.client_name,
            )
    except visits_service.PaymentError as exc:
        raise HTTPException(409 if body.record_id else 422, str(exc))

    write_audit(
        tenant_session,
        entity="finance",
        entity_id=receipt.id,
        entity_name=f"Чек № {receipt.number}",
        action=AuditAction.CREATED,
        author_id=author.id,
        author_name=author.name,
        details={"amount": [None, str(receipt.amount)]},
    )
    return Envelope(data=await _receipt_out(tenant_session, receipt))


@router.post("/receipts/{receipt_id}/cancel", response_model=Envelope[ReceiptOut])
async def cancel_receipt(
    receipt_id: uuid.UUID,
    author: CurrentAuthor,
    salon_id: SalonId,
    tenant_session: TenantSession,
) -> Envelope[ReceiptOut]:
    """Отмена чека: чек и связанные операции — cancelled; запись чека снова не оплачена."""
    receipt = await tenant_session.get(Receipt, receipt_id)
    if receipt is None:
        raise HTTPException(404, "Чек не знайдено")
    if receipt.status == ReceiptStatus.CANCELLED:
        raise HTTPException(409, "Чек уже скасовано")

    receipt.status = ReceiptStatus.CANCELLED
    operations = await tenant_session.scalars(
        select(FinanceOperation).where(FinanceOperation.receipt_id == receipt_id)
    )
    for op in operations:
        op.status = OperationStatus.CANCELLED
    await visits_service.unpay_record_for_receipt(
        tenant_session,
        salon_id=salon_id,
        receipt=receipt,
        author_id=author.id,
        author_name=author.name,
    )

    write_audit(
        tenant_session,
        entity="finance",
        entity_id=receipt.id,
        entity_name=f"Чек № {receipt.number}",
        action=AuditAction.UPDATED,
        author_id=author.id,
        author_name=author.name,
        details={"status": ["paid", "cancelled"]},
    )
    return Envelope(data=await _receipt_out(tenant_session, receipt))


# --- Способы оплаты ---------------------------------------------------------


class PaymentMethodOut(ApiModel):
    id: uuid.UUID
    name: str
    type: PaymentMethodType
    cash_register_id: uuid.UUID | None
    commission_type: CommissionType
    commission_value: Decimal
    commission_payer: CommissionPayer
    available_online: bool
    allow_partial_payment: bool
    allow_tips: bool
    sort_order: int
    is_active: bool


@router.get("/payment-methods", response_model=Envelope[list[PaymentMethodOut]])
async def list_payment_methods(
    tenant_session: TenantSession,
) -> Envelope[list[PaymentMethodOut]]:
    methods = await tenant_session.scalars(
        select(PaymentMethod).order_by(PaymentMethod.sort_order, PaymentMethod.name)
    )
    return Envelope(data=[PaymentMethodOut.model_validate(m) for m in methods])


class PaymentMethodCreateIn(ApiModel):
    name: str = Field(min_length=1, max_length=128)
    type: PaymentMethodType
    cash_register_id: uuid.UUID | None = None
    commission_type: CommissionType = CommissionType.NONE
    commission_value: Decimal = Decimal(0)
    commission_payer: CommissionPayer = CommissionPayer.SALON
    available_online: bool = False
    allow_partial_payment: bool = True
    allow_tips: bool = False
    sort_order: int = 0
    is_active: bool = True


@router.post(
    "/payment-methods",
    response_model=Envelope[PaymentMethodOut],
    status_code=status.HTTP_201_CREATED,
)
async def create_payment_method(
    body: PaymentMethodCreateIn,
    author: CurrentAuthor,
    tenant_session: TenantSession,
) -> Envelope[PaymentMethodOut]:
    if body.cash_register_id is not None:
        await _active_register(tenant_session, body.cash_register_id)
    method = PaymentMethod(**body.model_dump(by_alias=False))
    tenant_session.add(method)
    await tenant_session.flush()
    write_audit(
        tenant_session,
        entity="finance",
        entity_id=method.id,
        entity_name=f"Спосіб оплати «{method.name}»",
        action=AuditAction.CREATED,
        author_id=author.id,
        author_name=author.name,
    )
    return Envelope(data=PaymentMethodOut.model_validate(method))


class PaymentMethodPatchIn(ApiModel):
    name: str | None = None
    type: PaymentMethodType | None = None
    cash_register_id: uuid.UUID | None = None
    commission_type: CommissionType | None = None
    commission_value: Decimal | None = None
    commission_payer: CommissionPayer | None = None
    available_online: bool | None = None
    allow_partial_payment: bool | None = None
    allow_tips: bool | None = None
    sort_order: int | None = None
    is_active: bool | None = None


@router.patch("/payment-methods/{method_id}", response_model=Envelope[PaymentMethodOut])
async def patch_payment_method(
    method_id: uuid.UUID,
    body: PaymentMethodPatchIn,
    author: CurrentAuthor,
    tenant_session: TenantSession,
) -> Envelope[PaymentMethodOut]:
    method = await tenant_session.get(PaymentMethod, method_id)
    if method is None:
        raise HTTPException(404, "Спосіб оплати не знайдено")
    updates = body.model_dump(exclude_unset=True, by_alias=False)
    if updates.get("cash_register_id") and updates["cash_register_id"] != method.cash_register_id:
        await _active_register(tenant_session, updates["cash_register_id"])
    changes = diff_fields(method, updates)
    for field, value in updates.items():
        setattr(method, field, value)
    if changes:
        write_audit(
            tenant_session,
            entity="finance",
            entity_id=method.id,
            entity_name=f"Спосіб оплати «{method.name}»",
            action=AuditAction.UPDATED,
            author_id=author.id,
            author_name=author.name,
            details=changes,
        )
    return Envelope(data=PaymentMethodOut.model_validate(method))


# --- Кассы ------------------------------------------------------------------


async def _active_register(tenant_session, register_id: uuid.UUID) -> CashRegister:
    """Касса для новой операции или способа оплаты: существует и не выключена."""
    register = await tenant_session.get(CashRegister, register_id)
    if register is None:
        raise HTTPException(422, "Касу не знайдено")
    if not register.is_active:
        raise HTTPException(422, f"Каса «{register.name}» вимкнена")
    return register


class CashRegisterOut(ApiModel):
    id: uuid.UUID
    name: str
    location: str | None
    balance: Decimal
    is_active: bool


@router.get("/cash-registers", response_model=Envelope[list[CashRegisterOut]])
async def list_cash_registers(
    tenant_session: TenantSession,
) -> Envelope[list[CashRegisterOut]]:
    balance_expr = func.coalesce(
        func.sum(
            case(
                (FinanceOperation.type == OperationType.INCOME, FinanceOperation.amount),
                (FinanceOperation.type == OperationType.EXPENSE, -FinanceOperation.amount),
                else_=0,
            )
        ).filter(FinanceOperation.status == OperationStatus.COMPLETED),
        0,
    )
    rows = await tenant_session.execute(
        select(CashRegister, balance_expr)
        .outerjoin(FinanceOperation, FinanceOperation.cash_register_id == CashRegister.id)
        .group_by(CashRegister.id)
        .order_by(CashRegister.name)
    )
    return Envelope(
        data=[
            CashRegisterOut(
                id=r.id,
                name=r.name,
                location=r.location,
                balance=balance,
                is_active=r.is_active,
            )
            for r, balance in rows
        ]
    )


class CashRegisterCreateIn(ApiModel):
    name: str = Field(min_length=1, max_length=128)
    location: str | None = None
    is_active: bool = True


@router.post(
    "/cash-registers",
    response_model=Envelope[CashRegisterOut],
    status_code=status.HTTP_201_CREATED,
)
async def create_cash_register(
    body: CashRegisterCreateIn,
    author: CurrentAuthor,
    tenant_session: TenantSession,
) -> Envelope[CashRegisterOut]:
    register = CashRegister(**body.model_dump(by_alias=False))
    tenant_session.add(register)
    await tenant_session.flush()
    write_audit(
        tenant_session,
        entity="finance",
        entity_id=register.id,
        entity_name=f"Каса «{register.name}»",
        action=AuditAction.CREATED,
        author_id=author.id,
        author_name=author.name,
    )
    return Envelope(
        data=CashRegisterOut(
            id=register.id,
            name=register.name,
            location=register.location,
            balance=Decimal(0),
            is_active=register.is_active,
        )
    )


class CashRegisterPatchIn(ApiModel):
    """Баланс не редактируется — только операциями. Удаления нет — isActive=false."""

    name: str | None = Field(default=None, min_length=1, max_length=128)
    location: str | None = Field(default=None, max_length=255)
    is_active: bool | None = None


async def _register_balance(tenant_session, register_id: uuid.UUID) -> Decimal:
    balance = await tenant_session.scalar(
        select(
            func.coalesce(
                func.sum(
                    case(
                        (FinanceOperation.type == OperationType.INCOME, FinanceOperation.amount),
                        (FinanceOperation.type == OperationType.EXPENSE, -FinanceOperation.amount),
                        else_=0,
                    )
                ),
                0,
            )
        ).where(
            FinanceOperation.cash_register_id == register_id,
            FinanceOperation.status == OperationStatus.COMPLETED,
        )
    )
    return Decimal(balance or 0)


@router.patch("/cash-registers/{register_id}", response_model=Envelope[CashRegisterOut])
async def patch_cash_register(
    register_id: uuid.UUID,
    body: CashRegisterPatchIn,
    author: CurrentAuthor,
    tenant_session: TenantSession,
) -> Envelope[CashRegisterOut]:
    register = await tenant_session.get(CashRegister, register_id)
    if register is None:
        raise HTTPException(404, "Касу не знайдено")
    updates = body.model_dump(exclude_unset=True, by_alias=False)
    for required in ("name", "is_active"):
        if required in updates and updates[required] is None:
            raise HTTPException(422, f"Поле {required} не можна очистити")
    if "location" in updates and updates["location"] is not None:
        updates["location"] = updates["location"].strip() or None
    changes = diff_fields(register, updates)
    for field, value in updates.items():
        setattr(register, field, value)
    if changes:
        write_audit(
            tenant_session,
            entity="finance",
            entity_id=register.id,
            entity_name=f"Каса «{register.name}»",
            action=AuditAction.UPDATED,
            author_id=author.id,
            author_name=author.name,
            details=changes,
        )
    return Envelope(
        data=CashRegisterOut(
            id=register.id,
            name=register.name,
            location=register.location,
            balance=await _register_balance(tenant_session, register.id),
            is_active=register.is_active,
        )
    )


@router.get("/locations", response_model=Envelope[list[str]])
async def list_locations(tenant_session: TenantSession) -> Envelope[list[str]]:
    """Локации активных касс — для фильтра «Локація»."""
    rows = await tenant_session.scalars(
        select(CashRegister.location)
        .where(
            CashRegister.is_active.is_(True),
            CashRegister.location.is_not(None),
            CashRegister.location != "",
        )
        .distinct()
        .order_by(CashRegister.location)
    )
    return Envelope(data=[r for r in rows if r])


# --- Экспорт ----------------------------------------------------------------


@router.get("/export")
async def export_operations(
    tenant_session: TenantSession,
    date_from: Annotated[LocalDatetime, Query(alias="dateFrom")],
    date_to: Annotated[LocalDatetime, Query(alias="dateTo")],
    master_id: MasterFilter = None,
    location: LocationFilter = None,
) -> StreamingResponse:
    """Excel-отчёт по операциям за период."""
    from openpyxl import Workbook

    query = select(FinanceOperation).where(
        FinanceOperation.date >= date_from, FinanceOperation.date < date_to
    )
    if master_id is not None:
        query = query.where(FinanceOperation.record_id.in_(_master_records(master_id)))
    if location:
        query = query.where(FinanceOperation.cash_register_id.in_(_location_registers(location)))
    operations = list(await tenant_session.scalars(query.order_by(FinanceOperation.date)))
    methods, registers = await _refs(tenant_session, operations)

    wb = Workbook()
    ws = wb.active
    ws.title = "Операції"
    ws.append(
        [
            "Дата",
            "Тип",
            "Сума",
            "Категорія",
            "Опис",
            "Спосіб оплати",
            "Каса",
            "Статус",
            "Автор",
        ]
    )
    for op in operations:
        ws.append(
            [
                to_local(op.date).strftime("%Y-%m-%d %H:%M"),
                OPERATION_TYPE_NAMES.get(op.type, op.type.value),
                float(op.amount),
                op.category,
                op.description,
                methods.get(op.payment_method_id) if op.payment_method_id else None,
                registers.get(op.cash_register_id) if op.cash_register_id else None,
                op.status.value,
                op.author_name,
            ]
        )

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="operations.xlsx"'},
    )
