from pydantic import BaseModel, Field
from datetime import date as date_
from typing import List, Optional


# --- Common Schema ---
# This class defines a base schema for all models that have a unique ID.
# This pattern promotes code reuse and ensures consistency across different data models.
class BaseModelSchema(BaseModel):
    """
    Base schema for common fields found in all database-backed models.
    It provides a unique identifier and a configuration for attribute-based mapping.
    """

    id: int = Field(..., description="Unique identifier for the record.")

    class Config:
        """
        Pydantic configuration class.
        `from_attributes = True` allows the model to be created from attributes of an ORM object,
        which is a common pattern in FastAPI applications.
        """

        from_attributes = True


# --- Device Schemas ---
# This section defines schemas for managing devices and their operations.


class DeviceOperationBase(BaseModel):
    """
    Base schema for a device operation. This class contains the common
    attributes for a device operation, which can be extended for creation
    and reading.
    """

    date: date_ = Field(..., description="Date of the device operation.")
    duration: int = Field(..., description="Duration of the operation in minutes.")
    note: Optional[str] = Field(None, description="Optional notes about the operation.")


class DeviceOperationCreate(DeviceOperationBase):
    """
    Schema for creating a new device operation. It extends `DeviceOperationBase`
    by including the `device_id` to link the operation to a specific device.
    """

    device_id: int = Field(
        ..., description="ID of the device associated with this operation."
    )


class DeviceOperationRead(DeviceOperationBase, BaseModelSchema):
    """
    Schema for reading a device operation. It extends `DeviceOperationBase` and
    `BaseModelSchema` to include the unique ID. The `device_id` is intentionally
    omitted here because, in a read context, the full `DeviceRead` object will
    likely contain a list of `DeviceOperationRead` objects, making the
    `device_id` redundant at this level.
    """

    # No additional fields needed for read, as device_id is part of create
    # and the device object will be nested in DeviceRead
    pass


class DeviceBase(BaseModel):
    """
    Base schema for a device. Contains the fundamental attributes of a device.
    """

    name: str = Field(..., description="Name of the device.")
    active: bool = Field(
        True, description="Indicates if the device is currently active."
    )


class DeviceCreate(DeviceBase):
    """
    Schema for creating a new device. It inherits all fields from `DeviceBase`.
    In this case, no new fields are needed, but this class serves as a
    clear indicator of the schema's purpose.
    """

    pass


class DeviceUpdate(BaseModel):
    """
    Schema for updating an existing device. It's a partial schema containing
    only the fields that can be modified, which is a good practice for
    update operations (e.g., using `PATCH` requests).
    """

    active: bool = Field(
        ..., description="Indicates if the device is currently active."
    )


class DeviceRead(DeviceBase, BaseModelSchema):
    """
    Schema for reading a device, including its associated operations. It
    extends `DeviceBase` and `BaseModelSchema` and includes a list of
    `DeviceOperationRead` objects to represent the device's history.
    """

    operations: List[DeviceOperationRead] = Field(
        [], description="List of operations performed on this device."
    )


# --- Bottle Schemas ---
# This section defines schemas for managing gas bottles and their operations.


class BottleOperationBase(BaseModel):
    """
    Base schema for a gas bottle operation. This defines the common attributes
    for recording an action related to a gas bottle.
    """

    date: date_ = Field(..., description="Date of the gas bottle operation.")
    weight: float = Field(
        ..., description="Weight of the gas bottle after the operation."
    )


class BottleOperationCreate(BottleOperationBase):
    """
    Schema for creating a new gas bottle operation. It extends
    `BottleOperationBase` to link the operation to a specific gas bottle.
    """

    bottle_id: int = Field(
        ..., description="ID of the gas bottle associated with this operation."
    )


class BottleOperationRead(BottleOperationBase, BaseModelSchema):
    """
    Schema for reading a gas bottle operation. It includes the unique ID.
    Similar to `DeviceOperationRead`, the `bottle_id` is omitted as the
    operation will be nested within a `BottleRead` object.
    """

    # No additional fields needed for read, as bottle_id is part of create
    # and the bottle object will be nested in BottleRead
    pass


class BottleBase(BaseModel):
    """
    Base schema for a gas bottle. This contains all the core, unchangeable
    or initially set attributes of a gas bottle.
    """

    purchase_date: date_ = Field(..., description="Date the gas bottle was purchased.")
    purchase_price: float = Field(..., description="Purchase price of the gas bottle.")
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
    """
    Schema for creating a new gas bottle. It inherits from `BottleBase`.
    This class can be used to validate the data for a new bottle.
    """

    pass


class BottleUpdate(BaseModel):
    """
    Schema for updating an existing gas bottle. This partial schema allows
    only the 'active' status to be modified, which is a safe approach
    for update endpoints.
    """

    active: bool = Field(
        ..., description="Indicates if the gas bottle is currently active."
    )


class BottleRead(BottleBase, BaseModelSchema):
    """
    Schema for reading a gas bottle, including its history of operations.
    It combines the base bottle attributes, the unique ID, and a list of
    `BottleOperationRead` objects.
    """

    operations: List[BottleOperationRead] = Field(
        [], description="List of operations (weight measurements) for this gas bottle."
    )
