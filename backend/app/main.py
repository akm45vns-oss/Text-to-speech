import os
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import router
from app.database.session import create_db_and_tables

# Ensure the audio directory exists before StaticFiles tries to mount it.
Path("audio").mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    create_db_and_tables()
    yield


app = FastAPI(title="ReadLingo AI API", version="0.1.0", lifespan=lifespan)

# Read dynamic CORS origins from environment variable in production
origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
env_origins = os.getenv("CORS_ORIGINS")
if env_origins:
    origins.extend([origin.strip() for origin in env_origins.split(",")])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/audio", StaticFiles(directory="audio"), name="audio")
app.include_router(router, prefix="/api")

# Serve built frontend static assets if they exist (for single-port deployments)
# We mount this last so it doesn't shadow /api or /audio routes.
# It checks both a sibling directory or a local 'static' folder.
frontend_paths = [
    Path("static"),
    Path("../frontend/dist"),
    Path("frontend/dist")
]
for path in frontend_paths:
    if path.exists() and path.is_dir():
        app.mount("/", StaticFiles(directory=str(path), html=True), name="frontend")
        break
