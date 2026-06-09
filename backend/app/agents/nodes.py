"""
Agent node functions for LangGraph.
Each function receives AgentState, does ONE job, returns partial dict.
"""

import re
import time
from langchain_openai import ChatOpenAI
from app.agents.state import AgentState
from app.core.logging import get_logger

logger = get_logger(__name__)


def get_llm(state: AgentState):
    provider = state.get("provider", "openai")
    api_key = state.get("api_key", "")
    model = state.get("model", "gpt-4o")

    if provider == "openai":
        return ChatOpenAI(
            model=model,
            api_key=api_key,
            temperature=0.2,
        )
    elif provider == "gemini":
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(
                model=model,
                google_api_key=api_key,
                temperature=0.2,
            )
        except ImportError:
            raise ValueError("Gemini not installed. Run: pip install langchain-google-genai")
    elif provider in ["grok", "deepseek"]:
        base_urls = {
            "grok": "https://api.x.ai/v1",
            "deepseek": "https://api.deepseek.com",
        }
        return ChatOpenAI(
            model=model,
            api_key=api_key,
            base_url=base_urls[provider],
            temperature=0.2,
        )
    else:
        raise ValueError(f"Unknown provider: {provider}")


# ── Node 1: Explorer ──────────────────────────────────────────────

async def explorer_node(state: AgentState) -> dict:
    """Reads REAL files from GitHub and maps repo structure."""
    logger.info("explorer_started", repo_url=state["repo_url"])

    from app.services.github_service import GitHubService

    github = GitHubService(
        token=state["github_token"],
        repo_url=state["repo_url"],
    )

    repo_structure = await github.get_repo_structure(state["branch"])

    logger.info("explorer_finished", repo_url=state["repo_url"])
    return {"repo_structure": repo_structure}


# ── Node 2: Analyzer ─────────────────────────────────────────────

async def analyzer_node(state: AgentState) -> dict:
    """Finds bugs in the real code."""
    logger.info("analyzer_started", loop=state.get("loop_count", 0))

    llm = get_llm(state)

    feedback_section = ""
    if state.get("review_feedback") and state.get("review_feedback") != "none":
        feedback_section = f"""
Previous fix was REJECTED by the Critic.
Critic feedback: {state["review_feedback"]}
Take this into account when analyzing bugs.
"""

    prompt = f"""You are an expert code analyzer.

Repository structure and code:
{state["repo_structure"]}

Task: {state["task"]}
{feedback_section}

Carefully analyze the REAL code above.

If the code is already correct and has NO bugs, respond with exactly:
NO_BUGS_FOUND: The code is clean and correct. No fixes needed.

Otherwise identify ALL bugs and for each bug provide:
1. File name and line number
2. Bug description
3. Severity (high/medium/low)
4. Exact fix needed

Be specific — reference actual code you can see."""

    response = await llm.ainvoke(prompt)
    content = response.content.strip()

    logger.info("analyzer_finished", loop=state.get("loop_count", 0))

    # Check if no bugs found
    if content.startswith("NO_BUGS_FOUND"):
        logger.info("no_bugs_found", repo_url=state["repo_url"])
        return {"bugs_found": "NO_BUGS_FOUND"}

    return {"bugs_found": content}


# ── Node 3: Coder ────────────────────────────────────────────────

async def coder_node(state: AgentState) -> dict:
    """Writes real code fixes."""
    logger.info("coder_started", loop=state.get("loop_count", 0))

    # Skip if no bugs found
    if state.get("bugs_found") == "NO_BUGS_FOUND":
        logger.info("coder_skipped_no_bugs")
        return {"fix_code": "NO_BUGS_FOUND"}

    llm = get_llm(state)

    prompt = f"""You are an expert software engineer.

Repository structure and code:
{state["repo_structure"]}

Bugs to fix:
{state["bugs_found"]}

Write the complete fixed code for each file that needs changes.

IMPORTANT: For each file respond in EXACTLY this format:

FILE: filename.py
```python
# complete fixed file content here
```

Rules:
- Write the COMPLETE file content, not just changed lines
- Keep all existing functionality
- Fix ALL bugs identified
- Add comments explaining each fix"""

    response = await llm.ainvoke(prompt)
    logger.info("coder_finished", loop=state.get("loop_count", 0))
    return {"fix_code": response.content}


# ── Node 4: Critic ───────────────────────────────────────────────

async def critic_node(state: AgentState) -> dict:
    """Reviews the fix quality."""
    logger.info("critic_started", loop=state.get("loop_count", 0))

    # Skip if no bugs found
    if state.get("bugs_found") == "NO_BUGS_FOUND":
        logger.info("critic_skipped_no_bugs")
        return {
            "review_result": "pass",
            "review_feedback": "No bugs found — code is clean",
            "loop_count": state.get("loop_count", 0) + 1,
        }

    llm = get_llm(state)

    prompt = f"""You are a senior code reviewer.

Original task: {state["task"]}

Bugs that needed fixing:
{state["bugs_found"]}

Proposed fix:
{state["fix_code"]}

Review strictly. Check:
1. Does it fix ALL bugs?
2. Is the code syntactically correct?
3. Could it break other things?
4. Is quality production-ready?

Respond in EXACTLY this format:
RESULT: pass
FEEDBACK: none

OR:

RESULT: fail
FEEDBACK: <specific issues>"""

    response = await llm.ainvoke(prompt)
    content = response.content.strip()

    result = "fail"
    feedback = "Could not parse critic response"

    for line in content.split("\n"):
        if line.startswith("RESULT:"):
            result = line.replace("RESULT:", "").strip().lower()
        if line.startswith("FEEDBACK:"):
            feedback = line.replace("FEEDBACK:", "").strip()

    logger.info("critic_finished", result=result, loop=state.get("loop_count", 0))
    return {
        "review_result": result,
        "review_feedback": feedback,
        "loop_count": state.get("loop_count", 0) + 1,
    }


# ── Node 5: Create PR ────────────────────────────────────────────

async def create_pr_node(state: AgentState) -> dict:
    """Creates a REAL GitHub PR with the fix — or skips if no bugs."""
    logger.info("create_pr_started", result=state.get("review_result"))

    # No bugs found — skip PR creation
    if state.get("bugs_found") == "NO_BUGS_FOUND":
        logger.info("no_pr_needed_code_is_clean")
        return {
            "pr_url": None,
            "error": "NO_BUGS_FOUND",
        }

    from app.services.github_service import GitHubService

    github = GitHubService(
        token=state["github_token"],
        repo_url=state["repo_url"],
    )

    # Parse files from coder output
    files = _parse_files_from_coder(state["fix_code"])

    if not files:
        logger.warning("no_files_parsed")
        return {"pr_url": None, "error": "Could not parse fixed files from coder output"}

    # Create unique branch name using timestamp
    fix_branch = f"fix/agent-fix-{int(time.time())}"
    branch_created = await github.create_branch(fix_branch, state["branch"])

    if not branch_created:
        logger.error("branch_creation_failed", branch=fix_branch)
        return {"pr_url": None, "error": "Could not create branch on GitHub"}

    # Commit each fixed file
    for file_path, content in files.items():
        committed = await github.commit_file(
            file_path=file_path,
            content=content,
            branch=fix_branch,
        )
        logger.info("file_committed", path=file_path, success=committed)

    # Open the PR
    pr_url = await github.create_pull_request(
        head_branch=fix_branch,
        base_branch=state["branch"],
        title="fix: automated bug fixes by coding agent",
        body=f"""## Automated Bug Fixes

**Task:** {state["task"]}

**Bugs Found:**
{state["bugs_found"]}

**Changes Made:**
{state["fix_code"][:500]}...

---
*This PR was created automatically by the Autonomous Coding Agent*""",
    )

    logger.info("create_pr_finished", pr_url=pr_url)
    return {"pr_url": pr_url or None}


def _parse_files_from_coder(fix_code: str) -> dict[str, str]:
    """Parse coder output into {filename: content} dict."""
    files = {}
    pattern = r"FILE:\s*(\S+)\s*```(?:\w+)?\s*(.*?)```"
    matches = re.findall(pattern, fix_code, re.DOTALL)
    for file_path, content in matches:
        files[file_path.strip()] = content.strip()
    return files