from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import BaseDevices, BaseDevices

DEVICES_DATABASE_URL = "sqlite:///./devices.db"
BOTTLES_DATABASE_URL = "sqlite:///./bottles.db"

engine_devices = create_engine(
    DEVICES_DATABASE_URL, connect_args={"check_same_thread": False}
)
engine_bottles = create_engine(
    BOTTLES_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocalDevices = sessionmaker(
    autocommit=False, autoflush=False, bind=engine_devices
)
SessionLocalBottles = sessionmaker(
    autocommit=False, autoflush=False, bind=engine_bottles
)


def init_db():
    BaseDevices.metadata.create_all(bind=engine_devices)
    BaseDevices.metadata.create_all(bind=engine_bottles)


def get_db_devices():
    db = SessionLocalDevices()
    try:
        yield db
    finally:
        db.close()


def get_db_bottles():
    db = SessionLocalBottles()
    try:
        yield db
    finally:
        db.close()
