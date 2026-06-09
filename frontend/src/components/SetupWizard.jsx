import { useState } from "react"

const PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI",
    icon: "🟢",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
    keyPrefix: "sk-",
    instructions: [
      "Go to platform.openai.com",
      "Click API Keys in left sidebar",
      "Click Create new secret key",
      "Copy the key starting with sk-",
    ],
    keyUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "gemini",
    name: "Gemini",
    icon: "🔵",
    models: ["gemini-1.5-pro", "gemini-1.5-flash"],
    keyPrefix: "AIza",
    instructions: [
      "Go to aistudio.google.com",
      "Click Get API Key",
      "Create new API key",
      "Copy the key",
    ],
    keyUrl: "https://aistudio.google.com/app/apikey",
  },
  {
    id: "grok",
    name: "Grok",
    icon: "⚡",
    models: ["grok-2", "grok-beta"],
    keyPrefix: "xai-",
    instructions: [
      "Go to console.x.ai",
      "Click API Keys",
      "Create new key",
      "Copy the key starting with xai-",
    ],
    keyUrl: "https://console.x.ai",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    icon: "🐋",
    models: ["deepseek-chat", "deepseek-coder"],
    keyPrefix: "sk-",
    instructions: [
      "Go to platform.deepseek.com",
      "Click API Keys",
      "Create new key",
      "Copy the key",
    ],
    keyUrl: "https://platform.deepseek.com/api_keys",
  },
]

const GITHUB_INSTRUCTIONS = [
  "Go to github.com then click your profile photo then Settings",
  "Scroll down and click Developer settings",
  "Click Personal access tokens then Tokens classic",
  "Click Generate new token classic",
  "Select scope: repo",
  "Click Generate token and copy immediately!",
]

function SetupWizard({ onComplete }) {
  const [step, setStep] = useState(1)
  const [provider, setProvider] = useState(null)
  const [model, setModel] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [githubToken, setGithubToken] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [showGithub, setShowGithub] = useState(false)
  const [error, setError] = useState("")

  const selectedProvider = PROVIDERS.find(p => p.id === provider)

  const handleProviderSelect = (p) => {
    setProvider(p.id)
    setModel(p.models[0])
    setError("")
  }

  const handleNext = () => {
    if (step === 1 && !provider) {
      setError("Please select a provider")
      return
    }
    if (step === 2 && !apiKey) {
      setError("Please enter your API key")
      return
    }
    if (step === 3 && !githubToken) {
      setError("Please enter your GitHub token")
      return
    }
    setError("")
    setStep(step + 1)
  }

  const handleComplete = () => {
    if (!githubToken) {
      setError("Please enter your GitHub token")
      return
    }
    localStorage.setItem("aca_provider", provider)
    localStorage.setItem("aca_model", model)
    localStorage.setItem("aca_api_key", apiKey)
    localStorage.setItem("aca_github_token", githubToken)
    onComplete({ provider, model, apiKey, githubToken })
  }

  const handleDelete = () => {
    localStorage.removeItem("aca_provider")
    localStorage.removeItem("aca_model")
    localStorage.removeItem("aca_api_key")
    localStorage.removeItem("aca_github_token")
    window.location.reload()
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.wizard}>

        <div style={styles.header}>
          <h1 style={styles.title}>🤖 Autonomous Coding Agent</h1>
          <div style={styles.steps}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{
                ...styles.step,
                background: s === step ? "#4ade80" : s < step ? "#166534" : "#2a2a2a",
                color: s === step ? "#000" : s < step ? "#4ade80" : "#666",
              }}>
                {s < step ? "✓" : s}
              </div>
            ))}
          </div>
          <p style={styles.stepLabel}>
            {step === 1 ? "Choose LLM Provider" : step === 2 ? "Enter API Key" : "Enter GitHub Token"}
          </p>
        </div>

        {step === 1 && (
          <div>
            <p style={styles.desc}>
              Choose which AI model powers your agents. Gemini and Grok have free tiers!
            </p>
            <div style={styles.providers}>
              {PROVIDERS.map(p => (
                <button
                  key={p.id}
                  style={{
                    ...styles.providerBtn,
                    borderColor: provider === p.id ? "#4ade80" : "#2a2a2a",
                    background: provider === p.id ? "#052e16" : "#0f0f0f",
                  }}
                  onClick={() => handleProviderSelect(p)}
                >
                  <span style={styles.providerIcon}>{p.icon}</span>
                  <span style={styles.providerName}>{p.name}</span>
                  {(p.id === "gemini" || p.id === "grok") && (
                    <span style={styles.freeBadge}>FREE</span>
                  )}
                </button>
              ))}
            </div>
            {selectedProvider && (
              <div style={styles.modelSection}>
                <label style={styles.label}>Select Model:</label>
                <select
                  style={styles.select}
                  value={model}
                  onChange={e => setModel(e.target.value)}
                >
                  {selectedProvider.models.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {step === 2 && selectedProvider && (
          <div>
            <p style={styles.desc}>Enter your {selectedProvider.name} API key.</p>
            <div style={styles.instructions}>
              <p style={styles.instrTitle}>How to get your {selectedProvider.name} key:</p>
              {selectedProvider.instructions.map((instr, i) => (
                <p key={i} style={styles.instrStep}>
                  <span style={styles.instrNum}>{i + 1}</span>
                  {instr}
                </p>
              ))}
              <a href={selectedProvider.keyUrl} target="_blank" rel="noreferrer" style={styles.link}>
                Get your {selectedProvider.name} key here
              </a>
            </div>
            <div style={styles.inputGroup}>
              <input
                style={styles.input}
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={selectedProvider.keyPrefix + "..."}
              />
              <button style={styles.showBtn} onClick={() => setShowKey(!showKey)}>
                {showKey ? "Hide" : "Show"}
              </button>
            </div>
            <div style={styles.privacyBox}>
              <span>🔒 Your key is stored only in your browser.</span>
              <span>Never sent to our servers except during runs.</span>
              <span>Never logged or saved to our database.</span>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <p style={styles.desc}>Enter your GitHub token to read repos and open PRs.</p>
            <div style={styles.instructions}>
              <p style={styles.instrTitle}>How to generate your token:</p>
              {GITHUB_INSTRUCTIONS.map((instr, i) => (
                <p key={i} style={styles.instrStep}>
                  <span style={styles.instrNum}>{i + 1}</span>
                  {instr}
                </p>
              ))}
              <a
                href="https://github.com/settings/tokens/new"
                target="_blank"
                rel="noreferrer"
                style={styles.link}
              >
                Generate GitHub token here
              </a>
            </div>
            <div style={styles.inputGroup}>
              <input
                style={styles.input}
                type={showGithub ? "text" : "password"}
                value={githubToken}
                onChange={e => setGithubToken(e.target.value)}
                placeholder="ghp_..."
              />
              <button style={styles.showBtn} onClick={() => setShowGithub(!showGithub)}>
                {showGithub ? "Hide" : "Show"}
              </button>
            </div>
            <div style={styles.privacyBox}>
              <span>🔒 Token stored only in your browser.</span>
              <span>Never saved to our database.</span>
              <button style={styles.deleteBtn} onClick={handleDelete}>
                🗑 Delete all saved keys
              </button>
            </div>
          </div>
        )}

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.nav}>
          {step > 1 && (
            <button style={styles.backBtn} onClick={() => { setStep(step - 1); setError("") }}>
              Back
            </button>
          )}
          {step < 3 ? (
            <button style={styles.nextBtn} onClick={handleNext}>Next</button>
          ) : (
            <button style={styles.nextBtn} onClick={handleComplete}>🚀 Start Using Agent!</button>
          )}
        </div>

      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "#0f0f0f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 1000,
    overflowY: "auto",
  },
  wizard: {
    background: "#1a1a1a",
    borderRadius: "16px",
    padding: "40px",
    width: "100%",
    maxWidth: "560px",
    border: "1px solid #2a2a2a",
  },
  header: {
    textAlign: "center",
    marginBottom: "32px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    marginBottom: "20px",
    background: "linear-gradient(135deg, #4ade80, #60a5fa)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  steps: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "12px",
  },
  step: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "600",
  },
  stepLabel: {
    color: "#888",
    fontSize: "14px",
  },
  desc: {
    color: "#aaa",
    fontSize: "14px",
    marginBottom: "20px",
    lineHeight: "1.6",
  },
  providers: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "20px",
  },
  providerBtn: {
    background: "#0f0f0f",
    border: "2px solid",
    borderRadius: "12px",
    padding: "16px",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    position: "relative",
  },
  providerIcon: { fontSize: "28px" },
  providerName: { fontSize: "14px", fontWeight: "600" },
  freeBadge: {
    position: "absolute",
    top: "8px",
    right: "8px",
    background: "#166534",
    color: "#4ade80",
    fontSize: "10px",
    fontWeight: "700",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  modelSection: { marginBottom: "20px" },
  label: {
    display: "block",
    fontSize: "13px",
    color: "#aaa",
    marginBottom: "8px",
  },
  select: {
    width: "100%",
    background: "#0f0f0f",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#fff",
    fontSize: "14px",
  },
  instructions: {
    background: "#0f0f0f",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px",
  },
  instrTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#aaa",
    marginBottom: "12px",
  },
  instrStep: {
    fontSize: "13px",
    color: "#888",
    marginBottom: "8px",
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    lineHeight: "1.5",
  },
  instrNum: {
    background: "#2a2a2a",
    color: "#4ade80",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "700",
    flexShrink: 0,
  },
  link: {
    color: "#60a5fa",
    fontSize: "13px",
    display: "block",
    marginTop: "12px",
  },
  inputGroup: {
    display: "flex",
    gap: "8px",
    marginBottom: "12px",
  },
  input: {
    flex: 1,
    background: "#0f0f0f",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#fff",
    fontSize: "14px",
  },
  showBtn: {
    background: "#2a2a2a",
    border: "none",
    borderRadius: "8px",
    padding: "10px 16px",
    color: "#aaa",
    fontSize: "13px",
    cursor: "pointer",
  },
  privacyBox: {
    background: "#052e16",
    border: "1px solid #166534",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "12px",
    color: "#4ade80",
    lineHeight: "1.6",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  deleteBtn: {
    background: "transparent",
    border: "1px solid #7f1d1d",
    borderRadius: "6px",
    padding: "6px 12px",
    color: "#f87171",
    fontSize: "12px",
    cursor: "pointer",
    alignSelf: "flex-start",
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "24px",
  },
  backBtn: {
    background: "#2a2a2a",
    border: "none",
    borderRadius: "8px",
    padding: "12px 24px",
    color: "#aaa",
    fontSize: "14px",
    cursor: "pointer",
  },
  nextBtn: {
    background: "#4ade80",
    border: "none",
    borderRadius: "8px",
    padding: "12px 24px",
    color: "#000",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    marginLeft: "auto",
  },
  error: {
    color: "#f87171",
    fontSize: "13px",
    marginTop: "12px",
  },
}

export default SetupWizard
