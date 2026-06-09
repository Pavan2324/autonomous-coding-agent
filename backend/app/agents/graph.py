"""
LangGraph orchestrator — the brain of the system.

Defines the state machine that connects all agents.
"""

from langgraph.graph import StateGraph, END
from app.agents.state import AgentState
from app.agents.nodes import (
    explorer_node,
    analyzer_node,
    coder_node,
    critic_node,
    create_pr_node,
)
from app.core.logging import get_logger

logger = get_logger(__name__)


def should_retry(state: AgentState) -> str:
    """
    Decision function — called after Critic runs.
    Returns the name of the NEXT node to execute.
    """
    loop_count = state.get("loop_count", 0)
    max_loops = state.get("max_loops", 3)
    review_result = state.get("review_result", "fail")

    logger.info(
        "critic_decision",
        result=review_result,
        loop_count=loop_count,
        max_loops=max_loops,
    )

    # Circuit breaker — stop wasting tokens!
    if loop_count >= max_loops:
        logger.info("max_loops_reached", shipping_best_effort=True)
        return "create_pr"

    # Quality passed — ship it!
    if review_result == "pass":
        return "create_pr"

    # Quality failed — try again
    return "analyzer"


def build_graph() -> StateGraph:
    """Build and compile the agent graph."""

    graph = StateGraph(AgentState)

    # ── Add nodes ────────────────────────────────────────────────
    graph.add_node("explorer", explorer_node)
    graph.add_node("analyzer", analyzer_node)
    graph.add_node("coder", coder_node)
    graph.add_node("critic", critic_node)
    graph.add_node("create_pr", create_pr_node)

    # ── Add edges (the flow) ──────────────────────────────────────
    graph.set_entry_point("explorer")        # always start here

    graph.add_edge("explorer", "analyzer")   # explorer → analyzer
    graph.add_edge("analyzer", "coder")      # analyzer → coder
    graph.add_edge("coder", "critic")        # coder → critic

    # ── Conditional edge (the smart part) ────────────────────────
    graph.add_conditional_edges(
        "critic",           # after critic runs...
        should_retry,       # call this function...
        {                   # map return value to next node
            "analyzer": "analyzer",
            "create_pr": "create_pr",
        }
    )

    graph.add_edge("create_pr", END)         # done!

    return graph.compile()


# Single compiled instance — built once, reused every run
coding_agent = build_graph()