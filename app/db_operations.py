from sqlalchemy.orm import Session, selectinload
from typing import List, Optional

from app.models import DevicesDB, DeviceOperationsDB, BottlesDB, BottleOperationsDB
from app.schemas import (
    DeviceCreate,
    DeviceOperationCreate,
    DeviceUpdate,  # Added DeviceUpdate
    BottleCreate,
    BottleOperationCreate,
    BottleUpdate,
)

# --- Device Operations ---


def get_device(db: Session, device_id: int) -> Optional[DevicesDB]:
    """
    Retrieves a single device by its ID.
    """
    # Eagerly load operations for a single device as well
    return (
        db.query(DevicesDB)
        .options(selectinload(DevicesDB.operations))
        .filter(DevicesDB.id == device_id)
        .first()
    )


def get_devices(db: Session, skip: int = 0, limit: int = 100) -> List[DevicesDB]:
    """
    Retrieves a list of devices.
    """
    # Eagerly load operations for all devices
    return (
        db.query(DevicesDB)
        .options(selectinload(DevicesDB.operations))
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_device(db: Session, device: DeviceCreate) -> DevicesDB:
    """
    Creates a new device in the database.
    """
    db_device = DevicesDB(**device.model_dump())
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device


def update_device(db: Session, db_device: DevicesDB, device: DeviceUpdate) -> DevicesDB:
    """
    Updates an existing device in the database.
    """
    for field, value in device.model_dump(exclude_unset=True).items():
        setattr(db_device, field, value)
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device


def delete_device(db: Session, device_id: int) -> Optional[DevicesDB]:
    """
    Deletes a device from the database.
    """
    db_device = db.query(DevicesDB).filter(DevicesDB.id == device_id).first()
    if db_device:
        db.delete(db_device)
        db.commit()
    return db_device


# --- Device Operation Operations ---


def get_device_operation(
    db: Session, operation_id: int
) -> Optional[DeviceOperationsDB]:
    """
    Retrieves a single device operation by its ID.
    """
    return (
        db.query(DeviceOperationsDB)
        .filter(DeviceOperationsDB.id == operation_id)
        .first()
    )


def get_device_operations(
    db: Session, device_id: int, skip: int = 0, limit: int = 100
) -> List[DeviceOperationsDB]:
    """
    Retrieves a list of operations for a specific device.
    """
    return (
        db.query(DeviceOperationsDB)
        .filter(DeviceOperationsDB.device_id == device_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_device_operation(
    db: Session, operation: DeviceOperationCreate
) -> DeviceOperationsDB:
    """
    Creates a new device operation in the database.
    """
    db_operation = DeviceOperationsDB(**operation.model_dump())
    db.add(db_operation)
    db.commit()
    db.refresh(db_operation)
    return db_operation


def delete_device_operation(
    db: Session, operation_id: int
) -> Optional[DeviceOperationsDB]:
    """
    Deletes a device operation from the database.
    """
    db_operation = (
        db.query(DeviceOperationsDB)
        .filter(DeviceOperationsDB.id == operation_id)
        .first()
    )
    if db_operation:
        db.delete(db_operation)
        db.commit()
    return db_operation


# --- Bottle Operations ---


def get_bottle(db: Session, bottle_id: int) -> Optional[BottlesDB]:
    """
    Retrieves a single bottle by its ID.
    """
    # Eagerly load operations for a single bottle as well
    return (
        db.query(BottlesDB)
        .options(selectinload(BottlesDB.operations))
        .filter(BottlesDB.id == bottle_id)
        .first()
    )


def get_bottles(db: Session, skip: int = 0, limit: int = 100) -> List[BottlesDB]:
    """
    Retrieves a list of bottles.
    """
    # Eagerly load operations for all bottles
    return (
        db.query(BottlesDB)
        .options(selectinload(BottlesDB.operations))
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_bottle(db: Session, bottle: BottleCreate) -> BottlesDB:
    """
    Creates a new bottle in the database.
    """
    db_bottle = BottlesDB(**bottle.model_dump())
    db.add(db_bottle)
    db.commit()
    db.refresh(db_bottle)
    return db_bottle


def update_bottle(db: Session, db_bottle: BottlesDB, bottle: BottleUpdate) -> BottlesDB:
    """
    Updates an existing bottle in the database.
    """
    for field, value in bottle.model_dump(exclude_unset=True).items():
        setattr(db_bottle, field, value)
    db.add(db_bottle)
    db.commit()
    db.refresh(db_bottle)
    return db_bottle


def delete_bottle(db: Session, bottle_id: int) -> Optional[BottlesDB]:
    """
    Deletes a bottle from the database.
    """
    db_bottle = db.query(BottlesDB).filter(BottlesDB.id == bottle_id).first()
    if db_bottle:
        db.delete(db_bottle)
        db.commit()
    return db_bottle


# --- Bottle Operation Operations ---


def get_bottle_operation(
    db: Session, operation_id: int
) -> Optional[BottleOperationsDB]:
    """
    Retrieves a single bottle operation by its ID.
    """
    return (
        db.query(BottleOperationsDB)
        .filter(BottleOperationsDB.id == operation_id)
        .first()
    )


def get_bottle_operations(
    db: Session, bottle_id: int, skip: int = 0, limit: int = 100
) -> List[BottleOperationsDB]:
    """
    Retrieves a list of operations for a specific bottle.
    """
    return (
        db.query(BottleOperationsDB)
        .filter(BottleOperationsDB.bottle_id == bottle_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_bottle_operation(
    db: Session, operation: BottleOperationCreate
) -> BottleOperationsDB:
    """
    Creates a new bottle operation in the database.
    """
    db_operation = BottleOperationsDB(**operation.model_dump())
    db.add(db_operation)
    db.commit()
    db.refresh(db_operation)
    return db_operation


def delete_bottle_operation(
    db: Session, operation_id: int
) -> Optional[BottleOperationsDB]:
    """
    Deletes a bottle operation from the database.
    """
    db_operation = (
        db.query(BottleOperationsDB)
        .filter(BottleOperationsDB.id == operation_id)
        .first()
    )
    if db_operation:
        db.delete(db_operation)
        db.commit()
    return db_operation
