import { useState } from "react"
import { createRun } from "../api"

function RunForm({ onRunCreated, config }) {
  const [repoUrl, setRepoUrl] = useState("")
  const [branch, setBranch] = useState("main")
  const [task, setTask] = useState("find and fix all bugs")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (!repoUrl) {
      setError("Please enter a repo URL")
      return
    }

    setLoading(true)
    setError("")

    try {
      const run = await createRun(repoUrl, branch, task, config)
      onRunCreated(run.run_id)
      setRepoUrl("")
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to create run. Is the backend running?"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🤖 Submit a Repository</h2>
      <p style={styles.subtitle}>
        Our AI agents will find bugs and open a PR automatically
      </p>

      <div style={styles.form}>
        <div style={styles.field}>
          <label style={styles.label}>GitHub Repo URL</label>
          <input
            style={styles.input}
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
          />
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Branch</label>
            <input
              style={styles.input}
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
            />
          </div>

          <div style={{ ...styles.field, flex: 2 }}>
            <label style={styles.label}>Task</label>
            <input
              style={styles.input}
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="find and fix all bugs"
            />
          </div>
        </div>

        {/* Show current config */}
        <div style={styles.configInfo}>
          <span>🤖 {config.provider} / {config.model}</span>
          <span>🔑 API key set ✓</span>
          <span>🐙 GitHub token set ✓</span>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button
          style={loading ? styles.buttonDisabled : styles.button}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Submitting..." : "🚀 Run Agent"}
        </button>
      </div>
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
  title: {
    fontSize: "20px",
    fontWeight: "600",
    marginBottom: "8px",
  },
  subtitle: {
    color: "#888",
    marginBottom: "24px",
    fontSize: "14px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  row: {
    display: "flex",
    gap: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: 1,
  },
  label: {
    fontSize: "13px",
    color: "#aaa",
    fontWeight: "500",
  },
  input: {
    background: "#0f0f0f",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
  },
  configInfo: {
    display: "flex",
    gap: "16px",
    padding: "10px 14px",
    background: "#0f0f0f",
    borderRadius: "8px",
    border: "1px solid #2a2a2a",
    fontSize: "12px",
    color: "#4ade80",
    flexWrap: "wrap",
  },
  button: {
    background: "#4ade80",
    color: "#000",
    border: "none",
    borderRadius: "8px",
    padding: "12px 24px",
    fontSize: "15px",
    fontWeight: "600",
    marginTop: "8px",
    cursor: "pointer",
  },
  buttonDisabled: {
    background: "#2a2a2a",
    color: "#666",
    border: "none",
    borderRadius: "8px",
    padding: "12px 24px",
    fontSize: "15px",
    fontWeight: "600",
    marginTop: "8px",
    cursor: "not-allowed",
  },
  error: {
    color: "#f87171",
    fontSize: "13px",
  },
}

export default RunForm