import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:8000/api/v1",
})

export const createRun = async (repoUrl, branch, task, config) => {
  const response = await api.post("/runs", {
    repo_url: repoUrl,
    branch: branch,
    task: task,
    api_key: config.apiKey,
    github_token: config.githubToken,
    model: config.model,
    provider: config.provider,
  })
  return response.data
}

export const getRun = async (runId) => {
  const response = await api.get(`/runs/${runId}`)
  return response.data
}

export const listRuns = async () => {
  const response = await api.get("/runs")
  return response.data
}