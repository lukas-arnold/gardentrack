from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import db_operations, schemas
from app.database import get_db_devices, get_db_bottles

# Routers for different parts of the application
router_devices = APIRouter(
    prefix="/devices",
    tags=["devices"],
    responses={404: {"description": "Not found"}},
)

router_bottles = APIRouter(
    prefix="/bottles",
    tags=["bottles"],
    responses={404: {"description": "Not found"}},
)

# --- Device Endpoints ---


@router_devices.post(
    "/", response_model=schemas.DeviceRead, status_code=status.HTTP_201_CREATED
)
def create_device(device: schemas.DeviceCreate, db: Session = Depends(get_db_devices)):
    """
    Create a new device.
    """
    return db_operations.create_device(db=db, device=device)


@router_devices.get("/", response_model=List[schemas.DeviceRead])
def read_devices(
    skip: int = 0, limit: int = 100, db: Session = Depends(get_db_devices)
):
    """
    Retrieve a list of all devices.
    """
    devices = db_operations.get_devices(db, skip=skip, limit=limit)
    return devices


@router_devices.get("/{device_id}", response_model=schemas.DeviceRead)
def read_device(device_id: int, db: Session = Depends(get_db_devices)):
    """
    Retrieve a single device by its ID.
    """
    db_device = db_operations.get_device(db, device_id=device_id)
    if db_device is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Device not found"
        )
    return db_device


@router_devices.put("/{device_id}", response_model=schemas.DeviceRead)
def update_device(
    device_id: int, device: schemas.DeviceUpdate, db: Session = Depends(get_db_devices)
):
    """
    Update an existing device by its ID.
    """
    db_device = db_operations.get_device(db, device_id=device_id)
    if db_device is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Device not found"
        )
    return db_operations.update_device(db=db, db_device=db_device, device=device)


@router_devices.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_device(device_id: int, db: Session = Depends(get_db_devices)):
    """
    Delete a device by its ID.
    """
    db_device = db_operations.delete_device(db, device_id=device_id)
    if db_device is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Device not found"
        )
    return {"message": "Device deleted successfully"}


# --- Device Operation Endpoints ---


@router_devices.post(
    "/{device_id}/operations/",
    response_model=schemas.DeviceOperationRead,
    status_code=status.HTTP_201_CREATED,
)
def create_device_operation_for_device(
    device_id: int,
    operation: schemas.DeviceOperationCreate,
    db: Session = Depends(get_db_devices),
):
    """
    Create a new operation for a specific device.
    """
    db_device = db_operations.get_device(db, device_id=device_id)
    if db_device is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Device not found"
        )
    # Ensure the operation's device_id matches the path parameter
    operation.device_id = device_id
    return db_operations.create_device_operation(db=db, operation=operation)


@router_devices.get(
    "/{device_id}/operations/", response_model=List[schemas.DeviceOperationRead]
)
def read_device_operations_for_device(
    device_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_devices),
):
    """
    Retrieve a list of operations for a specific device.
    """
    db_device = db_operations.get_device(db, device_id=device_id)
    if db_device is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Device not found"
        )
    operations = db_operations.get_device_operations(
        db, device_id=device_id, skip=skip, limit=limit
    )
    return operations


@router_devices.get(
    "/operations/{operation_id}", response_model=schemas.DeviceOperationRead
)
def read_device_operation(operation_id: int, db: Session = Depends(get_db_devices)):
    """
    Retrieve a single device operation by its ID.
    """
    db_operation = db_operations.get_device_operation(db, operation_id=operation_id)
    if db_operation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Device operation not found"
        )
    return db_operation


@router_devices.delete(
    "/operations/{operation_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_device_operation(operation_id: int, db: Session = Depends(get_db_devices)):
    """
    Delete a device operation by its ID.
    """
    db_operation = db_operations.delete_device_operation(db, operation_id=operation_id)
    if db_operation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Device operation not found"
        )
    return {"message": "Device operation deleted successfully"}


# --- Bottle Endpoints ---


@router_bottles.post(
    "/", response_model=schemas.BottleRead, status_code=status.HTTP_201_CREATED
)
def create_bottle(bottle: schemas.BottleCreate, db: Session = Depends(get_db_bottles)):
    """
    Create a new bottle.
    """
    return db_operations.create_bottle(db=db, bottle=bottle)


@router_bottles.get("/", response_model=List[schemas.BottleRead])
def read_bottles(
    skip: int = 0, limit: int = 100, db: Session = Depends(get_db_bottles)
):
    """
    Retrieve a list of all bottles.
    """
    bottles = db_operations.get_bottles(db, skip=skip, limit=limit)
    return bottles


@router_bottles.get("/{bottle_id}", response_model=schemas.BottleRead)
def read_bottle(bottle_id: int, db: Session = Depends(get_db_bottles)):
    """
    Retrieve a single bottle by its ID.
    """
    db_bottle = db_operations.get_bottle(db, bottle_id=bottle_id)
    if db_bottle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Bottle not found"
        )
    return db_bottle


@router_bottles.put("/{bottle_id}", response_model=schemas.BottleRead)
def update_bottle(
    bottle_id: int, bottle: schemas.BottleUpdate, db: Session = Depends(get_db_bottles)
):
    """
    Update an existing bottle by its ID.
    """
    db_bottle = db_operations.get_bottle(db, bottle_id=bottle_id)
    if db_bottle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Bottle not found"
        )
    return db_operations.update_bottle(db=db, db_bottle=db_bottle, bottle=bottle)


@router_bottles.delete("/{bottle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bottle(bottle_id: int, db: Session = Depends(get_db_bottles)):
    """
    Delete a bottle by its ID.
    """
    db_bottle = db_operations.delete_bottle(db, bottle_id=bottle_id)
    if db_bottle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Bottle not found"
        )
    return {"message": "Bottle deleted successfully"}


# --- Bottle Operation Endpoints ---


@router_bottles.post(
    "/{bottle_id}/operations/",
    response_model=schemas.BottleOperationRead,
    status_code=status.HTTP_201_CREATED,
)
def create_bottle_operation_for_bottle(
    bottle_id: int,
    operation: schemas.BottleOperationCreate,
    db: Session = Depends(get_db_bottles),
):
    """
    Create a new operation for a specific bottle.
    """
    db_bottle = db_operations.get_bottle(db, bottle_id=bottle_id)
    if db_bottle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Bottle not found"
        )
    # Ensure the operation's bottle_id matches the path parameter
    operation.bottle_id = bottle_id
    return db_operations.create_bottle_operation(db=db, operation=operation)


@router_bottles.get(
    "/{bottle_id}/operations/", response_model=List[schemas.BottleOperationRead]
)
def read_bottle_operations_for_bottle(
    bottle_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_bottles),
):
    """
    Retrieve a list of operations for a specific bottle.
    """
    db_bottle = db_operations.get_bottle(db, bottle_id=bottle_id)
    if db_bottle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Bottle not found"
        )
    operations = db_operations.get_bottle_operations(
        db, bottle_id=bottle_id, skip=skip, limit=limit
    )
    return operations


@router_bottles.get(
    "/operations/{operation_id}", response_model=schemas.BottleOperationRead
)
def read_bottle_operation(operation_id: int, db: Session = Depends(get_db_bottles)):
    """
    Retrieve a single bottle operation by its ID.
    """
    db_operation = db_operations.get_bottle_operation(db, operation_id=operation_id)
    if db_operation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Bottle operation not found"
        )
    return db_operation


@router_bottles.delete(
    "/operations/{operation_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_bottle_operation(operation_id: int, db: Session = Depends(get_db_bottles)):
    """
    Delete a bottle operation by its ID.
    """
    db_operation = db_operations.delete_bottle_operation(db, operation_id=operation_id)
    if db_operation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Bottle operation not found"
        )
    return {"message": "Bottle operation deleted successfully"}
