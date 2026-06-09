import { useState, useEffect } from "react"
import RunForm from "./components/RunForm"
import RunStatus from "./components/RunStatus"
import SetupWizard from "./components/SetupWizard"

function App() {
  const [config, setConfig] = useState(null)
  const [activeRunId, setActiveRunId] = useState(null)
  const [runHistory, setRunHistory] = useState([])

  // Check if keys already saved in localStorage
  useEffect(() => {
    const provider = localStorage.getItem("aca_provider")
    const model = localStorage.getItem("aca_model")
    const apiKey = localStorage.getItem("aca_api_key")
    const githubToken = localStorage.getItem("aca_github_token")

    if (provider && apiKey && githubToken) {
      setConfig({ provider, model, apiKey, githubToken })
    }
  }, [])

  const handleSetupComplete = (cfg) => {
    setConfig(cfg)
  }

  const handleRunCreated = (runId) => {
    setActiveRunId(runId)
    setRunHistory(prev => [runId, ...prev])
  }

  const handleReset = () => {
    localStorage.removeItem("aca_provider")
    localStorage.removeItem("aca_model")
    localStorage.removeItem("aca_api_key")
    localStorage.removeItem("aca_github_token")
    setConfig(null)
  }

  // Show setup wizard if no config
  if (!config) {
    return <SetupWizard onComplete={handleSetupComplete} />
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>🤖 Autonomous Coding Agent</h1>
          <p style={styles.subtitle}>
            Submit any GitHub repo — AI agents find bugs and open a PR automatically
          </p>
          <div style={styles.configBadge}>
            <span>{config.provider} / {config.model}</span>
            <button style={styles.resetBtn} onClick={handleReset}>
              ⚙ Change Settings
            </button>
          </div>
        </div>

        {/* Form */}
        <RunForm
          onRunCreated={handleRunCreated}
          config={config}
        />

        {/* Active Run */}
        {activeRunId && (
          <RunStatus runId={activeRunId} />
        )}

        {/* Run History */}
        {runHistory.length > 1 && (
          <div style={styles.history}>
            <h3 style={styles.historyTitle}>Previous Runs</h3>
            {runHistory.slice(1).map(runId => (
              <button
                key={runId}
                style={styles.historyItem}
                onClick={() => setActiveRunId(runId)}
              >
                {runId}
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "40px 20px",
  },
  container: {
    maxWidth: "720px",
    margin: "0 auto",
  },
  header: {
    textAlign: "center",
    marginBottom: "40px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "700",
    marginBottom: "12px",
    background: "linear-gradient(135deg, #4ade80, #60a5fa)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    color: "#888",
    fontSize: "16px",
    lineHeight: "1.6",
    marginBottom: "16px",
  },
  configBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "12px",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "20px",
    padding: "6px 16px",
    fontSize: "13px",
    color: "#888",
  },
  resetBtn: {
    background: "transparent",
    border: "none",
    color: "#60a5fa",
    fontSize: "13px",
    cursor: "pointer",
  },
  history: {
    background: "#1a1a1a",
    borderRadius: "12px",
    padding: "24px",
    border: "1px solid #2a2a2a",
  },
  historyTitle: {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "16px",
    color: "#aaa",
  },
  historyItem: {
    display: "block",
    width: "100%",
    textAlign: "left",
    background: "#0f0f0f",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#888",
    fontSize: "12px",
    marginBottom: "8px",
    fontFamily: "monospace",
    cursor: "pointer",
  },
}

export default App