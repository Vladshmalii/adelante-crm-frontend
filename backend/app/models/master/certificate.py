"""Подарочные сертификаты (backend/docs/certificates.md, раздел 3.1).

Уровень сети: шаблоны создаёт суперюзер один раз на сеть, сертификат действует
во всех салонах. Остаток сертификата — не поле, а счёт `client_accounts` вида
`certificate` с журналом `account_transactions` (app.services.ledger): выпуск —
topup, погашение — payment, отмена погашения — reversal, сгорание — burn.

Сертификат хранит снимок шаблона на момент продажи (название, номинал, область,
услуги): правка шаблона не меняет проданные сертификаты.
"""

import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Index, Numeric, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import MasterBase, str_enum


class CertificateScope(enum.StrEnum):
    ANY = "any"  # на всё: услуги и товары
    SERVICES = "services"  # только на услуги шаблона — пары (салон, услуга)


class CertificateStatus(enum.StrEnum):
    ISSUED = "issued"  # выпущен, владельца нет — «на предъявителя»
    ACTIVE = "active"  # активирован на клиента
    SPENT = "spent"  # остаток 0
    EXPIRED = "expired"  # срок истёк, остаток сгорел
    CANCELLED = "cancelled"  # аннулирован или отменён чек покупки


class CertificateTemplate(MasterBase):
    """Шаблон сертификата — позиция «Сертифікати Мережа Adelante». Номинал = цена."""

    __tablename__ = "certificate_templates"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255))
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    scope: Mapped[CertificateScope] = mapped_column(str_enum(CertificateScope, 16))
    # null — бессрочный
    valid_days: Mapped[int | None]
    # is_active=false — шаблон скрыт: новые сертификаты не продаются
    is_active: Mapped[bool] = mapped_column(default=True, server_default="true")
    sort_order: Mapped[int] = mapped_column(default=0, server_default="0")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    services: Mapped[list["CertificateTemplateService"]] = relationship(
        cascade="all, delete-orphan", lazy="selectin"
    )


class CertificateTemplateService(MasterBase):
    """Услуга шаблона «на послуги»: у каждого салона свой каталог — пары (salon_id, service_id)."""

    __tablename__ = "certificate_template_services"

    template_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("certificate_templates.id", ondelete="CASCADE"), primary_key=True
    )
    salon_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("salons.id"), primary_key=True)
    # Ссылка на services шарда салона — без FK, EXISTS-проверка при сохранении шаблона
    service_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)


class Certificate(MasterBase):
    """Выпущенный сертификат. Остаток — на счёте client_accounts(kind=certificate)."""

    __tablename__ = "certificates"
    __table_args__ = (
        Index("ix_certificates_owner_client_id", "owner_client_id"),
        Index("ix_certificates_buyer_client_id", "buyer_client_id"),
        Index("ix_certificates_sold_receipt", "sold_salon_id", "sold_receipt_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    # Персональный код: ADL-XXXX-XXXX, unique (формат и генерация — app.services.certificates)
    code: Mapped[str] = mapped_column(String(32), unique=True)

    # Снимок шаблона на момент покупки
    template_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("certificate_templates.id"))
    name: Mapped[str] = mapped_column(String(255))
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    scope: Mapped[CertificateScope] = mapped_column(str_enum(CertificateScope, 16))

    # null — бессрочный
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[CertificateStatus] = mapped_column(
        str_enum(CertificateStatus, 16), default=CertificateStatus.ISSUED
    )

    # Продажа: салон и чек шарда (без FK), покупатель — если он в базе
    sold_salon_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("salons.id"))
    sold_receipt_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    buyer_client_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("clients.id"))
    # Ключ выпуска cert:{salon}:{receipt}:{line}:{n} — повтор оплаты не выпускает второй
    issue_key: Mapped[str] = mapped_column(String(200), unique=True)

    # Владелец — после активации; активированный сертификат передать нельзя
    owner_client_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("clients.id"))
    activated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Аннулирование суперюзером или отмена чека покупки
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancelled_by: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    cancelled_by_name: Mapped[str | None] = mapped_column(String(255))
    cancel_reason: Mapped[str | None] = mapped_column(String(2000))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    services: Mapped[list["CertificateService"]] = relationship(
        cascade="all, delete-orphan", lazy="selectin"
    )

    def covers(self, salon_id: uuid.UUID, service_id: uuid.UUID) -> bool:
        """Входит ли услуга салона в область сертификата."""
        if self.scope == CertificateScope.ANY:
            return True
        return any(s.salon_id == salon_id and s.service_id == service_id for s in self.services)


class CertificateService(MasterBase):
    """Снимок услуг шаблона на момент продажи (для scope = services)."""

    __tablename__ = "certificate_services"

    certificate_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("certificates.id", ondelete="CASCADE"), primary_key=True
    )
    salon_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("salons.id"), primary_key=True)
    service_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
