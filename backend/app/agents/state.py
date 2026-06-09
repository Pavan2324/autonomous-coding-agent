from typing import TypedDict


class AgentState(TypedDict):
    # ── Input ─────────────────────────────────
    repo_url: str
    branch: str
    task: str

    # ── User provided keys (never stored) ─────
    api_key: str
    github_token: str
    model: str
    provider: str

    # ── Explorer output ───────────────────────
    repo_structure: str

    # ── Analyzer output ───────────────────────
    bugs_found: str

    # ── Coder output ──────────────────────────
    fix_code: str

    # ── Critic output ─────────────────────────
    review_result: str
    review_feedback: str

    # ── Control ───────────────────────────────
    loop_count: int
    max_loops: int

    # ── Final output ──────────────────────────
    pr_url: str
    error: str