import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import ShardBase


class Review(ShardBase):
    """Отзыв клиента по записи. Создаётся по одноразовому review_token записи.

    client_id / master_id ссылаются на Master DB; имена — снапшот на момент
    создания, чтобы вкладка «Отзывы» читалась без cross-DB JOIN.
    """

    __tablename__ = "reviews"
    __table_args__ = (CheckConstraint("rating BETWEEN 1 AND 5", name="rating_range"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    record_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("records.id"), unique=True)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, index=True)
    master_id: Mapped[uuid.UUID] = mapped_column(Uuid, index=True)

    client_name: Mapped[str] = mapped_column(String(255))
    master_name: Mapped[str] = mapped_column(String(255))

    rating: Mapped[int]
    text: Mapped[str | None] = mapped_column(String(4000))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
