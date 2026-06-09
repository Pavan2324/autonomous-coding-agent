"""
Agent runner service.
Runs the LangGraph graph and updates the DB with progress.
"""

import json
from sqlalchemy.ext.asyncio import AsyncSession
from app.agents.graph import build_graph
from app.agents.state import AgentState
from app.core.logging import get_logger
from app.models.run import Run

logger = get_logger(__name__)


async def run_agent(
    run_id: str,
    repo_url: str,
    branch: str,
    task: str,
    api_key: str,
    github_token: str,
    model: str,
    provider: str,
    db: AsyncSession,
) -> None:
    logger.info("agent_run_started", run_id=run_id, provider=provider, model=model)

    # Initialize outside try so always has a value
    node_output = {}

    try:
        # Mark as running
        run = await db.get(Run, run_id)
        run.status = "running"
        run.current_agent = "explorer"
        await db.commit()

        # Build initial state with user keys
        initial_state: AgentState = {
            "repo_url": repo_url,
            "branch": branch,
            "task": task,
            "api_key": api_key,
            "github_token": github_token,
            "model": model,
            "provider": provider,
            "repo_structure": "",
            "bugs_found": "",
            "fix_code": "",
            "review_result": "",
            "review_feedback": "",
            "loop_count": 0,
            "max_loops": 3,
            "pr_url": "",
            "error": "",
        }

        # Build fresh graph for this run
        coding_agent = build_graph()

        # Stream node updates
        async for update in coding_agent.astream(
            initial_state,
            stream_mode="updates"
        ):
            node_name = list(update.keys())[0]
            node_output = update[node_name]

            logger.info("agent_node_completed", run_id=run_id, node=node_name)

            run = await db.get(Run, run_id)
            run.current_agent = node_name
            run.steps_completed += 1

            current_log = json.loads(run.agent_log or "[]")
            current_log.append({"node": node_name})
            run.agent_log = json.dumps(current_log)
            await db.commit()

        # Mark completed
        run = await db.get(Run, run_id)
        run.status = "completed"
        run.current_agent = None

        # Set result summary based on what happened
        if node_output.get("pr_url"):
            run.pr_url = node_output["pr_url"]
            run.result_summary = f"PR opened: {node_output['pr_url']}"
        elif node_output.get("error") == "NO_BUGS_FOUND":
            run.result_summary = "✅ Code is clean! No bugs found — no PR needed."
        elif node_output.get("error"):
            run.result_summary = f"Completed with issue: {node_output['error']}"
        else:
            run.result_summary = "Completed"

        await db.commit()
        logger.info("agent_run_completed", run_id=run_id)

    except Exception as e:
        logger.error("agent_run_failed", run_id=run_id, error=str(e))
        try:
            run = await db.get(Run, run_id)
            run.status = "failed"
            run.error_message = str(e)
            run.current_agent = None
            await db.commit()
        except Exception:
            pass