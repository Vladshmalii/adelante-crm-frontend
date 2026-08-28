import enum

from sqlalchemy import Enum as SAEnum
from sqlalchemy import MetaData, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def str_enum(enum_cls: type[enum.StrEnum], length: int = 16) -> SAEnum:
    """Enum-колонка, хранящая ЗНАЧЕНИЯ StrEnum ('scheduled'), а не имена
    ('SCHEDULED'). VARCHAR + CHECK, без нативного PG-enum — миграции проще."""
    return SAEnum(
        enum_cls,
        native_enum=False,
        length=length,
        values_callable=lambda e: [m.value for m in e],
    )


NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class MasterBase(DeclarativeBase):
    """Базовый класс моделей Master DB (реестр салонов, Client, Administrator, Master)."""

    metadata = MetaData(naming_convention=NAMING_CONVENTION)


class ShardBase(DeclarativeBase):
    """Базовый класс моделей шард-БД (схема идентична для каждого салона)."""

    metadata = MetaData(naming_convention=NAMING_CONVENTION)


class Gender(enum.StrEnum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class PersonNameMixin:
    """Раздельное ФИО (формы фронтенда) + собранное имя для снапшотов."""

    first_name: Mapped[str] = mapped_column(String(128))
    middle_name: Mapped[str | None] = mapped_column(String(128))
    last_name: Mapped[str | None] = mapped_column(String(128))

    @property
    def full_name(self) -> str:
        return " ".join(p for p in (self.first_name, self.last_name) if p)
