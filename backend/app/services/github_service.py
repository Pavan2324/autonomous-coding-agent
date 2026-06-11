"""
GitHub service — handles all GitHub API interactions.
Reads files, creates branches, commits code, opens PRs.
"""

import base64
import httpx
from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()


class GitHubService:

    def __init__(self, token: str, repo_url: str):
        # Parse owner and repo from URL
        # "https://github.com/Pavan2324/test-buggy-repo"
        # → owner = "Pavan2324"
        # → repo  = "test-buggy-repo"
        parts = repo_url.rstrip("/").replace(".git", "").split("/")
        self.owner = parts[-2]
        self.repo = parts[-1]
        self.token = token
        self.base_url = "https://api.github.com"
        self.headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json",
        }

    async def get_file_tree(self, branch: str = "main") -> list[str]:
        """Get list of all files in the repo."""
        url = f"{self.base_url}/repos/{self.owner}/{self.repo}/git/trees/{branch}?recursive=1"
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, headers=self.headers)
            if response.status_code != 200:
                logger.error("github_tree_failed", status=response.status_code)
                return []
            data = response.json()
            return [
                item["path"] for item in data.get("tree", [])
                if item["type"] == "blob"
            ]

    async def get_file_content(self, path: str, branch: str = "main") -> str:
        """Read content of a specific file."""
        url = f"{self.base_url}/repos/{self.owner}/{self.repo}/contents/{path}?ref={branch}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, headers=self.headers)
            if response.status_code != 200:
                return f"Could not read {path}"
            data = response.json()
            content = base64.b64decode(data["content"]).decode("utf-8")
            return content

    async def get_repo_structure(self, branch: str = "main") -> str:
        """Read key files from repo — README, requirements, source code."""
        files = await self.get_file_tree(branch)

        priority_files = []

        # Always read README
        for f in files:
            if f.lower().startswith("readme"):
                priority_files.append(f)

        # Read requirements/dependencies
        for f in files:
            if f in ["requirements.txt", "pyproject.toml", "package.json"]:
                priority_files.append(f)

        # Read source files (max 5) — Python, JS, TS, Go, Java, etc
        code_extensions = (".py", ".js", ".ts", ".go", ".java", ".rb", ".php", ".cs", ".cpp", ".c")
        code_files = [
            f for f in files
            if f.endswith(code_extensions)
            and not f.lower().startswith("test")
            and "node_modules" not in f
            and ".min." not in f
        ]
        priority_files.extend(code_files[:5])

        # Read test files (max 3)
        test_files = [
            f for f in files
            if "test" in f.lower() and f.endswith(code_extensions)
        ]
        priority_files.extend(test_files[:3])

        # Build structure string
        result = f"Repository: {self.owner}/{self.repo}\n"
        result += f"Branch: {branch}\n"
        result += f"All files: {', '.join(files)}\n\n"

        for file_path in priority_files:
            content = await self.get_file_content(file_path, branch)
            result += f"\n{'='*50}\n"
            result += f"FILE: {file_path}\n"
            result += f"{'='*50}\n"
            result += content
            result += "\n"

        return result

    async def create_branch(self, new_branch: str, base_branch: str = "main") -> bool:
        """Create a new branch for our fix."""
        # Get the SHA of base branch
        url = f"{self.base_url}/repos/{self.owner}/{self.repo}/git/refs/heads/{base_branch}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, headers=self.headers)
            if response.status_code != 200:
                logger.error("branch_sha_failed",
                            status=response.status_code,
                            body=response.text,
                            owner=self.owner,
                            repo=self.repo)
                return False
            sha = response.json()["object"]["sha"]

            # Create new branch from that SHA
            create_url = f"{self.base_url}/repos/{self.owner}/{self.repo}/git/refs"
            payload = {
                "ref": f"refs/heads/{new_branch}",
                "sha": sha
            }
            response = await client.post(create_url, headers=self.headers, json=payload)
            if response.status_code != 201:
                logger.error("branch_creation_failed",
                            status=response.status_code,
                            body=response.text,
                            branch=new_branch,
                            owner=self.owner,
                            repo=self.repo)
                return False
            logger.info("branch_created", branch=new_branch)
            return True

    async def commit_file(
        self,
        file_path: str,
        content: str,
        branch: str,
        message: str = "fix: automated bug fix by coding agent"
    ) -> bool:
        """Commit a file change to a branch."""
        url = f"{self.base_url}/repos/{self.owner}/{self.repo}/contents/{file_path}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                url,
                headers=self.headers,
                params={"ref": branch}
            )
            file_sha = None
            if response.status_code == 200:
                file_sha = response.json()["sha"]

            encoded = base64.b64encode(content.encode()).decode()

            payload = {
                "message": message,
                "content": encoded,
                "branch": branch,
            }
            if file_sha:
                payload["sha"] = file_sha

            response = await client.put(url, headers=self.headers, json=payload)
            if response.status_code not in [200, 201]:
                logger.error("commit_failed",
                            status=response.status_code,
                            body=response.text,
                            file_path=file_path)
                return False
            logger.info("file_committed", path=file_path)
            return True

    async def create_pull_request(
        self,
        head_branch: str,
        base_branch: str,
        title: str,
        body: str,
    ) -> str | None:
        """Open a real GitHub PR."""
        url = f"{self.base_url}/repos/{self.owner}/{self.repo}/pulls"
        payload = {
            "title": title,
            "body": body,
            "head": head_branch,
            "base": base_branch,
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=self.headers, json=payload)
            if response.status_code == 201:
                pr_url = response.json()["html_url"]
                logger.info("pr_created", pr_url=pr_url)
                return pr_url
            logger.error("pr_failed",
                        status=response.status_code,
                        body=response.text)
            return None
