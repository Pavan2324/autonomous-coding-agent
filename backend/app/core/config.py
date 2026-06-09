from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Autonomous Coding Agent"
    app_version: str = "0.1.0"
    environment: str = Field(default="development")
    debug: bool = Field(default=False)

    openai_api_key: str = Field(default="")
    openai_model: str = Field(default="gpt-4o")
    github_token: str = Field(default="")
    tavily_api_key: str = Field(default="")

    database_url: str = Field(default="sqlite+aiosqlite:///./agent.db")

    langchain_tracing_v2: bool = Field(default=False)
    langchain_api_key: str = Field(default="")
    langchain_project: str = Field(default="autonomous-coding-agent")

    cors_origins: list[str] = Field(default=["http://localhost:3000", "http://localhost:5173"])

    max_agent_iterations: int = Field(default=10)
    agent_timeout_seconds: int = Field(default=300)


@lru_cache
def get_settings() -> Settings:
    return Settings()