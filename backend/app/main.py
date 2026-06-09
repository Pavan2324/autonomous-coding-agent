import time
import uuid
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.logging import get_logger, setup_logging

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    settings = get_settings()
    setup_logging()
    logger.info("app_starting", app=settings.app_name, environment=settings.environment)

    from app.core.database import create_tables
    from app.models import run  # noqa: F401
    await create_tables()

    yield
    logger.info("app_shutting_down")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        lifespan=lifespan,
    )

    app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    )

    @app.middleware("http")
    async def request_logger(request: Request, call_next) -> Response:
        run_id = str(uuid.uuid4())
        start = time.perf_counter()
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(run_id=run_id)
        logger.info("request_started", method=request.method, path=request.url.path)
        response: Response = await call_next(request)
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.info("request_finished", status_code=response.status_code, elapsed_ms=elapsed_ms)
        response.headers["X-Run-ID"] = run_id
        return response

    from app.api.health import router as health_router
    from app.api.runs import router as runs_router
    app.include_router(health_router, prefix="/api/v1")
    app.include_router(runs_router, prefix="/api/v1")

    return app