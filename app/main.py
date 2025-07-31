from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from app.database import init_db
from app.router import router_devices, router_bottles

init_db()

app = FastAPI(
    title="GartenTrack",
)


app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/", response_class=FileResponse)
async def read_root_frontend():
    return FileResponse(os.path.join("static", "index.html"))


app.include_router(router_devices)
app.include_router(router_bottles)
