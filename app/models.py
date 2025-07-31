from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import Integer, ForeignKey
from datetime import date as date_


class Base(DeclarativeBase):
    pass


class BaseModelMixin:
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)


class DevicesDB(Base, BaseModelMixin):
    __tablename__ = "devices"

    name: Mapped[str] = mapped_column(nullable=False)

    operations: Mapped[list["DeviceOperationsDB"]] = relationship(
        back_populates="device",
        cascade="all, delete-orphan",
        order_by="DeviceOperationsDB.date.desc()",
    )


class DeviceOperationsDB(Base, BaseModelMixin):
    __tablename__ = "device_operations"

    device_id: Mapped[int] = mapped_column(ForeignKey("devices.id"), nullable=False)
    date: Mapped[date_] = mapped_column(nullable=False)
    duration: Mapped[int] = mapped_column(nullable=False)
    note: Mapped[str | None] = mapped_column(nullable=True)

    device: Mapped["DevicesDB"] = relationship(back_populates="operations")


class BottlesDB(Base, BaseModelMixin):
    __tablename__ = "bottles"

    purchase_date: Mapped[date_] = mapped_column(nullable=False)
    purchpase_price: Mapped[float] = mapped_column(nullable=False)
    initial_weight: Mapped[float] = mapped_column(nullable=False)
    filling_weight: Mapped[float] = mapped_column(nullable=False)
    active: Mapped[bool] = mapped_column(default=True, nullable=False)

    operations: Mapped[list["BottleOperationsDB"]] = relationship(
        back_populates="bottle",
        cascade="all, delete-orphan",
        order_by="GasOperationsDB.date.desc()",
    )


class BottleOperationsDB(Base, BaseModelMixin):
    __tablename__ = "gas_operations"

    bottle_id: Mapped[int] = mapped_column(ForeignKey("bottles.id"), nullable=False)
    date: Mapped[date_] = mapped_column(nullable=False)
    weight: Mapped[float] = mapped_column(nullable=False)

    bottle: Mapped["BottlesDB"] = relationship(back_populates="operations")
