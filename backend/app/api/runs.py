import asyncio
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db, AsyncSessionLocal
from app.core.logging import get_logger
from app.models.run import Run

router = APIRouter(prefix="/runs", tags=["runs"])
logger = get_logger(__name__)


class CreateRunRequest(BaseModel):
    repo_url: str
    branch: str = "main"
    task: str = "find and fix bugs"
    # User provided keys — never stored
    api_key: str
    github_token: str
    model: str = "gpt-4o"
    provider: str = "openai"


class RunResponse(BaseModel):
    run_id: str
    status: str
    repo_url: str
    branch: str
    task: str
    provider: str
    model: str
    steps_completed: int
    current_agent: str | None
    result_summary: str | None
    pr_url: str | None
    error_message: str | None


async def launch_agent(
    run_id: str,
    repo_url: str,
    branch: str,
    task: str,
    api_key: str,
    github_token: str,
    model: str,
    provider: str,
) -> None:
    from app.services.agent_runner import run_agent
    async with AsyncSessionLocal() as db:
        await run_agent(
            run_id, repo_url, branch, task,
            api_key, github_token, model, provider, db
        )


def run_agent_background(
    run_id: str,
    repo_url: str,
    branch: str,
    task: str,
    api_key: str,
    github_token: str,
    model: str,
    provider: str,
) -> None:
    import traceback
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(
            launch_agent(
                run_id, repo_url, branch, task,
                api_key, github_token, model, provider
            )
        )
    except Exception as e:
        print(f"BACKGROUND TASK FAILED: {e}")
        traceback.print_exc()
    finally:
        loop.close()

@router.post("", response_model=RunResponse, status_code=202)
async def create_run(
    body: CreateRunRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> RunResponse:
    run = Run(
        repo_url=body.repo_url,
        branch=body.branch,
        task=body.task,
        status="pending",
        provider=body.provider,
        model=body.model,
        # keys NOT saved to database!
    )
    db.add(run)
    await db.flush()
    await db.commit()

    logger.info("run_created", run_id=run.id, repo_url=run.repo_url, provider=body.provider)

    background_tasks.add_task(
        run_agent_background,
        run.id,
        run.repo_url,
        run.branch,
        run.task,
        body.api_key,       # passed to agent, never stored
        body.github_token,  # passed to agent, never stored
        body.model,
        body.provider,
    )

    return _to_response(run)


@router.get("/{run_id}", response_model=RunResponse)
async def get_run(run_id: str, db: AsyncSession = Depends(get_db)) -> RunResponse:
    run = await db.get(Run, run_id)
    if run is None:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
    return _to_response(run)


@router.get("", response_model=list[RunResponse])
async def list_runs(db: AsyncSession = Depends(get_db), limit: int = 20) -> list[RunResponse]:
    result = await db.execute(select(Run).order_by(Run.created_at.desc()).limit(limit))
    return [_to_response(r) for r in result.scalars().all()]


def _to_response(run: Run) -> RunResponse:
    return RunResponse(
        run_id=run.id,
        status=run.status,
        repo_url=run.repo_url,
        branch=run.branch,
        task=run.task,
        provider=run.provider or "openai",
        model=run.model or "gpt-4o",
        steps_completed=run.steps_completed,
        current_agent=run.current_agent,
        result_summary=run.result_summary,
        pr_url=run.pr_url,
        error_message=run.error_message,
    )