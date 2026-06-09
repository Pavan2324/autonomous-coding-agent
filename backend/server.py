"""Application entrypoint — run with: uvicorn server:app --reload"""
from app.main import create_app

app = create_app()