from pydantic import BaseModel, Field
from datetime import date as date_
from typing import List, Optional


# Base Schema for common fields
class BaseModelSchema(BaseModel):
    id: int = Field(..., description="Unique identifier for the record.")

    class Config:
        from_attributes = True


# --- Device Schemas ---
class DeviceOperationBase(BaseModel):
    date: date_ = Field(..., description="Date of the device operation.")
    duration: int = Field(..., description="Duration of the operation in minutes.")
    note: Optional[str] = Field(None, description="Optional notes about the operation.")


class DeviceOperationCreate(DeviceOperationBase):
    device_id: int = Field(
        ..., description="ID of the device associated with this operation."
    )


class DeviceOperationRead(DeviceOperationBase, BaseModelSchema):
    # No additional fields needed for read, as device_id is part of create
    # and the device object will be nested in DeviceRead
    pass


class DeviceBase(BaseModel):
    name: str = Field(..., description="Name of the device.")


class DeviceCreate(DeviceBase):
    pass


class DeviceRead(DeviceBase, BaseModelSchema):
    operations: List[DeviceOperationRead] = Field(
        [], description="List of operations performed on this device."
    )


# --- Bottle Schemas ---
class BottleOperationBase(BaseModel):
    date: date_ = Field(..., description="Date of the gas bottle operation.")
    weight: float = Field(
        ..., description="Weight of the gas bottle after the operation."
    )


class BottleOperationCreate(BottleOperationBase):
    bottle_id: int = Field(
        ..., description="ID of the gas bottle associated with this operation."
    )


class BottleOperationRead(BottleOperationBase, BaseModelSchema):
    # No additional fields needed for read, as bottle_id is part of create
    # and the bottle object will be nested in BottleRead
    pass


class BottleBase(BaseModel):
    purchase_date: date_ = Field(..., description="Date the gas bottle was purchased.")
    purchpase_price: float = Field(..., description="Purchase price of the gas bottle.")
    initial_weight: float = Field(
        ..., description="Initial weight of the complete gas bottle when purchased."
    )
    filling_weight: float = Field(
        ..., description="Weight of the usable gas of the gas bottle."
    )
    active: bool = Field(
        True, description="Indicates if the gas bottle is currently active."
    )


class BottleCreate(BottleBase):
    pass


class BottleRead(BottleBase, BaseModelSchema):
    operations: List[BottleOperationRead] = Field(
        [], description="List of operations (weight measurements) for this gas bottle."
    )
