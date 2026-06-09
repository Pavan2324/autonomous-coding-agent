import { useState, useEffect } from "react"
import { getRun } from "../api"

const AGENTS = [
  { key: "explorer",  label: "🔍 Explorer",  desc: "Reading repo files" },
  { key: "analyzer",  label: "🐛 Analyzer",  desc: "Finding bugs" },
  { key: "coder",     label: "💻 Coder",     desc: "Writing fixes" },
  { key: "critic",    label: "👀 Critic",    desc: "Reviewing quality" },
  { key: "create_pr", label: "🚀 Create PR", desc: "Opening pull request" },
]

function RunStatus({ runId }) {
  const [run, setRun] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!runId) return

    const interval = setInterval(async () => {
      try {
        const data = await getRun(runId)
        setRun(data)
        if (data.status === "completed" || data.status === "failed") {
          clearInterval(interval)
        }
      } catch (err) {
        setError("Failed to fetch run status")
        clearInterval(interval)
      }
    }, 3000)

    getRun(runId).then(setRun).catch(() => setError("Failed to fetch"))

    return () => clearInterval(interval)
  }, [runId])

  if (!run) return (
    <div style={styles.container}>
      <p style={styles.loading}>Loading run status...</p>
    </div>
  )

  const getAgentStatus = (agentKey) => {
    if (run.status === "completed") return "done"
    if (agentKey === run.current_agent) return "running"
    const agentIndex = AGENTS.findIndex(a => a.key === agentKey)
    if (agentIndex < run.steps_completed) return "done"
    return "pending"
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          {run.status === "completed" ? "✅" :
           run.status === "failed" ? "❌" : "⚡"} Run Status
        </h2>
        <span style={{
          ...styles.badge,
          background: run.status === "completed" ? "#166534" :
                      run.status === "failed" ? "#7f1d1d" : "#1e3a5f"
        }}>
          {run.status}
        </span>
      </div>

      <p style={styles.repo}>{run.repo_url}</p>

      <div style={styles.agents}>
        {AGENTS.map((agent) => {
          const status = getAgentStatus(agent.key)
          return (
            <div key={agent.key} style={{
              ...styles.agent,
              borderColor: status === "done" ? "#166534" :
                           status === "running" ? "#1e3a5f" : "#2a2a2a"
            }}>
              <div style={styles.agentLeft}>
                <span style={styles.agentLabel}>{agent.label}</span>
                <span style={styles.agentDesc}>{agent.desc}</span>
              </div>
              <span style={{
                ...styles.agentStatus,
                color: status === "done" ? "#4ade80" :
                       status === "running" ? "#60a5fa" : "#444"
              }}>
                {status === "done" ? "✓ Done" :
                 status === "running" ? "⟳ Running..." : "○ Waiting"}
              </span>
            </div>
          )
        })}
      </div>

      {/* PR Created */}
      {run.status === "completed" && run.pr_url && (
        <div style={styles.prBox}>
          <p style={styles.prLabel}>🎉 Pull Request Created!</p>
          <p style={styles.prSummary}>
            Bugs were found and fixed automatically.
          </p>
          <a href={run.pr_url} target="_blank" rel="noreferrer" style={styles.prLink}>
            View Pull Request →
          </a>
        </div>
      )}

      {/* No bugs found */}
      {run.status === "completed" && !run.pr_url && run.result_summary && (
        <div style={styles.cleanBox}>
          <p style={styles.cleanLabel}>{run.result_summary}</p>
          <p style={styles.cleanDesc}>
            All agents ran successfully. No fixes were needed.
          </p>
        </div>
      )}

      {/* Failed */}
      {run.status === "failed" && (
        <div style={styles.errorBox}>
          <p style={styles.errorLabel}>❌ Run Failed</p>
          <p style={styles.errorDesc}>
            {run.error_message || "Something went wrong"}
          </p>
        </div>
      )}

      <p style={styles.steps}>
        Steps completed: {run.steps_completed} / {AGENTS.length}
      </p>
    </div>
  )
}

const styles = {
  container: {
    background: "#1a1a1a",
    borderRadius: "12px",
    padding: "32px",
    marginBottom: "24px",
    border: "1px solid #2a2a2a",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  title: {
    fontSize: "20px",
    fontWeight: "600",
  },
  badge: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
    color: "#fff",
  },
  repo: {
    color: "#888",
    fontSize: "13px",
    marginBottom: "24px",
  },
  agents: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "24px",
  },
  agent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderRadius: "8px",
    border: "1px solid",
    background: "#0f0f0f",
  },
  agentLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  agentLabel: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#fff",
  },
  agentDesc: {
    fontSize: "12px",
    color: "#666",
  },
  agentStatus: {
    fontSize: "13px",
    fontWeight: "500",
  },
  prBox: {
    background: "#052e16",
    border: "1px solid #166534",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px",
  },
  prLabel: {
    color: "#4ade80",
    fontWeight: "600",
    fontSize: "15px",
    marginBottom: "6px",
  },
  prSummary: {
    color: "#86efac",
    fontSize: "13px",
    marginBottom: "10px",
  },
  prLink: {
    color: "#4ade80",
    fontSize: "13px",
    fontWeight: "600",
    textDecoration: "underline",
  },
  cleanBox: {
    background: "#052e16",
    border: "1px solid #166534",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px",
  },
  cleanLabel: {
    color: "#4ade80",
    fontWeight: "600",
    fontSize: "15px",
    marginBottom: "6px",
  },
  cleanDesc: {
    color: "#86efac",
    fontSize: "13px",
  },
  errorBox: {
    background: "#450a0a",
    border: "1px solid #7f1d1d",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px",
  },
  errorLabel: {
    color: "#f87171",
    fontWeight: "600",
    fontSize: "15px",
    marginBottom: "6px",
  },
  errorDesc: {
    color: "#fca5a5",
    fontSize: "13px",
  },
  steps: {
    color: "#666",
    fontSize: "12px",
  },
  loading: {
    color: "#888",
  },
}

export default RunStatus
