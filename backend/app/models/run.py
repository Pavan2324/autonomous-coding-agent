import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


class Run(Base):
    __tablename__ = "runs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)
    repo_url: Mapped[str] = mapped_column(String, nullable=False)
    branch: Mapped[str] = mapped_column(String, default="main")
    task: Mapped[str] = mapped_column(Text, default="find and fix bugs")
    provider: Mapped[str] = mapped_column(String, default="openai")  # new
    model: Mapped[str] = mapped_column(String, default="gpt-4o")     # new
    status: Mapped[str] = mapped_column(String, default="pending")
    current_agent: Mapped[str | None] = mapped_column(String, nullable=True)
    steps_completed: Mapped[int] = mapped_column(Integer, default=0)
    result_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    pr_url: Mapped[str | None] = mapped_column(String, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    agent_log: Mapped[str | None] = mapped_column(Text, nullable=True)