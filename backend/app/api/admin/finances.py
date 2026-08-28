"""Финансы: дашборд, операции, документы, чеки, способы оплаты, кассы."""

import io
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from pydantic import Field
from sqlalchemy import case, func, select

from app.api.admin.deps import CurrentAuthor
from app.api.schemas import ApiModel, Envelope, PersonRef, page_meta
from app.api.security import require_salon_access
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
    RecordStatus,
    Service,
)
from app.services.audit import diff_fields, write_audit
from app.tenancy.deps import TenantSession

router = APIRouter(
    prefix="/finances", tags=["finances"], dependencies=[Depends(require_salon_access)]
)


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
    date_from: Annotated[datetime, Query(alias="dateFrom")],
    date_to: Annotated[datetime, Query(alias="dateTo")],
) -> Envelope[DashboardOut]:
    completed_ops = (
        select(FinanceOperation)
        .where(
            FinanceOperation.status == OperationStatus.COMPLETED,
            FinanceOperation.date >= date_from,
            FinanceOperation.date < date_to,
        )
        .subquery()
    )
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

    day_expr = func.date_trunc("day", completed_ops.c.date).label("day")
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
            .where(
                Receipt.status != ReceiptStatus.CANCELLED,
                Receipt.date >= date_from,
                Receipt.date < date_to,
            )
            .group_by(PaymentMethod.type)
        )
    ).all()
    split_total = sum((amount for _, amount in split_rows), Decimal(0))

    top = await tenant_session.execute(
        select(Service.name, func.sum(Record.total_amount), func.count())
        .join(Service, Service.id == Record.service_id)
        .where(
            Record.status == RecordStatus.COMPLETED,
            Record.start_at >= date_from,
            Record.start_at < date_to,
        )
        .group_by(Service.name)
        .order_by(func.sum(Record.total_amount).desc())
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
    date_from: Annotated[datetime | None, Query(alias="dateFrom")] = None,
    date_to: Annotated[datetime | None, Query(alias="dateTo")] = None,
    page: int = 1,
    per_page: Annotated[int, Query(alias="perPage", le=200)] = 50,
) -> Envelope[list[OperationOut]]:
    query = select(FinanceOperation)
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
    date: datetime
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
        entity_name=f"Операция {op.type.value} {op.amount}",
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
    date: datetime | None = None
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
        raise HTTPException(404, "Операция не найдена")
    updates = body.model_dump(exclude_unset=True, by_alias=False)
    changes = diff_fields(op, updates)
    for field, value in updates.items():
        setattr(op, field, value)
    if changes:
        write_audit(
            tenant_session,
            entity="finance",
            entity_id=op.id,
            entity_name=f"Операция {op.type.value} {op.amount}",
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
    date_from: Annotated[datetime | None, Query(alias="dateFrom")] = None,
    date_to: Annotated[datetime | None, Query(alias="dateTo")] = None,
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
    date: datetime
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
        raise HTTPException(409, "Документ с таким номером уже есть")
    doc = FinanceDocument(
        **body.model_dump(by_alias=False), author_id=author.id, author_name=author.name
    )
    tenant_session.add(doc)
    await tenant_session.flush()
    write_audit(
        tenant_session,
        entity="finance",
        entity_id=doc.id,
        entity_name=f"Документ {doc.number}",
        action=AuditAction.CREATED,
        author_id=author.id,
        author_name=author.name,
    )
    return Envelope(data=_document_out(doc))


class DocumentPatchIn(ApiModel):
    date: datetime | None = None
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
        raise HTTPException(404, "Документ не найден")
    if doc.status == DocumentStatus.CANCELLED:
        raise HTTPException(409, "Отменённый документ нельзя менять")
    updates = body.model_dump(exclude_unset=True, by_alias=False)
    changes = diff_fields(doc, updates)
    for field, value in updates.items():
        setattr(doc, field, value)
    if changes:
        write_audit(
            tenant_session,
            entity="finance",
            entity_id=doc.id,
            entity_name=f"Документ {doc.number}",
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
    date_from: Annotated[datetime | None, Query(alias="dateFrom")] = None,
    date_to: Annotated[datetime | None, Query(alias="dateTo")] = None,
    page: int = 1,
    per_page: Annotated[int, Query(alias="perPage", le=200)] = 50,
) -> Envelope[list[ReceiptOut]]:
    query = select(Receipt)
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
    payments: list[ReceiptPaymentIn] = Field(min_length=1)
    source: ReceiptSource = ReceiptSource.WEB
    date: datetime | None = None


@router.post("/receipts", response_model=Envelope[ReceiptOut], status_code=status.HTTP_201_CREATED)
async def create_receipt(
    body: ReceiptCreateIn,
    author: CurrentAuthor,
    tenant_session: TenantSession,
) -> Envelope[ReceiptOut]:
    """Ручной чек (продажа без записи) — операции создаются на каждую оплату."""
    from app.models.shard import ReceiptPayment
    from app.services.visits import _receipt_number

    method_ids = [p.payment_method_id for p in body.payments]
    methods = {
        m.id: m
        for m in await tenant_session.scalars(
            select(PaymentMethod).where(PaymentMethod.id.in_(method_ids))
        )
    }
    if set(method_ids) - set(methods):
        raise HTTPException(422, "Неизвестный способ оплаты")
    cash_register_id = next(
        (m.cash_register_id for m in methods.values() if m.cash_register_id), None
    )
    if cash_register_id is None:
        raise HTTPException(422, "У способа оплаты не настроена касса")

    when = body.date or datetime.now().astimezone()
    total_amount = sum((p.amount for p in body.payments), Decimal(0))
    receipt = Receipt(
        number=_receipt_number(),
        date=when,
        cash_register_id=cash_register_id,
        client_id=body.client_id,
        client_name=body.client_name,
        amount=total_amount,
        status=ReceiptStatus.PAID,
        source=body.source,
        author_id=author.id,
        author_name=author.name,
    )
    tenant_session.add(receipt)
    await tenant_session.flush()
    for part in body.payments:
        method = methods[part.payment_method_id]
        tenant_session.add(
            ReceiptPayment(
                receipt_id=receipt.id,
                payment_method_id=method.id,
                amount=part.amount,
            )
        )
        tenant_session.add(
            FinanceOperation(
                type=OperationType.INCOME,
                amount=part.amount,
                category="sales",
                description=f"Чек {receipt.number}",
                date=when,
                payment_method_id=method.id,
                cash_register_id=method.cash_register_id or cash_register_id,
                client_id=body.client_id,
                receipt_id=receipt.id,
                author_id=author.id,
                author_name=author.name,
            )
        )
    write_audit(
        tenant_session,
        entity="finance",
        entity_id=receipt.id,
        entity_name=f"Чек {receipt.number}",
        action=AuditAction.CREATED,
        author_id=author.id,
        author_name=author.name,
    )
    await tenant_session.flush()
    # receipt.payments — lazy="selectin"; на щойно сконструйованому об'єкті
    # колекція ще не завантажена, і синхронне звернення до неї в _receipt_out
    # під AsyncSession падає з MissingGreenlet. Явно перезавантажуємо перед тим.
    await tenant_session.refresh(receipt, attribute_names=["payments"])
    return Envelope(data=await _receipt_out(tenant_session, receipt))


@router.post("/receipts/{receipt_id}/cancel", response_model=Envelope[ReceiptOut])
async def cancel_receipt(
    receipt_id: uuid.UUID,
    author: CurrentAuthor,
    tenant_session: TenantSession,
) -> Envelope[ReceiptOut]:
    """Отмена чека: сам чек и связанные операции переводятся в cancelled."""
    receipt = await tenant_session.get(Receipt, receipt_id)
    if receipt is None:
        raise HTTPException(404, "Чек не найден")
    if receipt.status == ReceiptStatus.CANCELLED:
        raise HTTPException(409, "Чек уже отменён")

    receipt.status = ReceiptStatus.CANCELLED
    operations = await tenant_session.scalars(
        select(FinanceOperation).where(FinanceOperation.receipt_id == receipt_id)
    )
    for op in operations:
        op.status = OperationStatus.CANCELLED

    write_audit(
        tenant_session,
        entity="finance",
        entity_id=receipt.id,
        entity_name=f"Чек {receipt.number}",
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
        register = await tenant_session.get(CashRegister, body.cash_register_id)
        if register is None:
            raise HTTPException(422, "Касса не найдена")
    method = PaymentMethod(**body.model_dump(by_alias=False))
    tenant_session.add(method)
    await tenant_session.flush()
    write_audit(
        tenant_session,
        entity="finance",
        entity_id=method.id,
        entity_name=f"Способ оплаты {method.name}",
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
        raise HTTPException(404, "Способ оплаты не найден")
    updates = body.model_dump(exclude_unset=True, by_alias=False)
    changes = diff_fields(method, updates)
    for field, value in updates.items():
        setattr(method, field, value)
    if changes:
        write_audit(
            tenant_session,
            entity="finance",
            entity_id=method.id,
            entity_name=f"Способ оплаты {method.name}",
            action=AuditAction.UPDATED,
            author_id=author.id,
            author_name=author.name,
            details=changes,
        )
    return Envelope(data=PaymentMethodOut.model_validate(method))


# --- Кассы ------------------------------------------------------------------


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
        entity_name=f"Касса {register.name}",
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


# --- Экспорт ----------------------------------------------------------------


@router.get("/export")
async def export_operations(
    tenant_session: TenantSession,
    date_from: Annotated[datetime, Query(alias="dateFrom")],
    date_to: Annotated[datetime, Query(alias="dateTo")],
) -> StreamingResponse:
    """Excel-отчёт по операциям за период."""
    from openpyxl import Workbook

    operations = list(
        await tenant_session.scalars(
            select(FinanceOperation)
            .where(FinanceOperation.date >= date_from, FinanceOperation.date < date_to)
            .order_by(FinanceOperation.date)
        )
    )
    methods, registers = await _refs(tenant_session, operations)

    wb = Workbook()
    ws = wb.active
    ws.title = "Операции"
    ws.append(
        [
            "Дата",
            "Тип",
            "Сумма",
            "Категория",
            "Описание",
            "Способ оплаты",
            "Касса",
            "Статус",
            "Автор",
        ]
    )
    for op in operations:
        ws.append(
            [
                op.date.strftime("%Y-%m-%d %H:%M"),
                op.type.value,
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
