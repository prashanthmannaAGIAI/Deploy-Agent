"""FastAPI application entry point."""

from importlib.metadata import version

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from runway_api.config import get_settings


class Health(BaseModel):
    status: str
    version: str
    environment: str


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Runway API", version=version("runway-api"))
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.api_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/healthz", tags=["meta"])
    def healthz() -> Health:
        return Health(status="ok", version=app.version, environment=settings.runway_env)

    return app


app = create_app()
