import logging
import sys
from typing import Any
import structlog
from structlog.types import EventDict, Processor
from app.core.config import get_settings


def _add_environment(logger: Any, method: str, event_dict: EventDict) -> EventDict:
    event_dict["environment"] = get_settings().environment
    return event_dict


def setup_logging() -> None:
    settings = get_settings()
    is_production = settings.environment == "production"

    shared_processors: list[Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        _add_environment,
        structlog.processors.StackInfoRenderer(),
    ]

    if is_production:
        processors: list[Processor] = shared_processors + [structlog.processors.JSONRenderer()]
    else:
        processors = shared_processors + [structlog.dev.ConsoleRenderer(colors=True)]

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(logging.DEBUG),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(sys.stdout),
        cache_logger_on_first_use=True,
    )

    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.DEBUG if settings.debug else logging.INFO,
    )


def get_logger(name: str) -> structlog.BoundLogger:
    return structlog.get_logger(name)