import os
import sys
import io
from pathlib import Path
import pytest

# Ensure project root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from api.main import (
    app,
    clean_and_structure_markdown,
    split_profile_sections,
    select_relevant_context,
    PROFILE_FILE
)


client = TestClient(app)


def test_serve_homepage():
    """Verify that root URL serves the frontend index.html successfully."""
    response = client.get("/")
    assert response.status_code == 200
    assert "LinkedIn Me" in response.text


def test_get_profile():
    """Verify GET /api/profile returns the current markdown file."""
    response = client.get("/api/profile")
    assert response.status_code == 200
    data = response.json()
    assert "exists" in data
    assert "markdown" in data
    assert data["exists"] is True


def test_upload_text_file():
    """Verify POST /api/upload extracts and saves text/md files."""
    test_content = (
        "# Jane Doe - Senior Cloud Architect\n\n"
        "## Summary\n"
        "Experienced cloud architect with 10 years experience.\n\n"
        "## Skills\n"
        "- AWS\n"
        "- Kubernetes\n"
        "- Python\n"
    )
    
    file_bytes = io.BytesIO(test_content.encode("utf-8"))
    response = client.post(
        "/api/upload",
        files={"file": ("jane_doe_profile.md", file_bytes, "text/markdown")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "Jane Doe" in data["markdown"]
    assert "Cloud Architect" in data["markdown"]

    # Verify that file was saved to disk
    assert PROFILE_FILE.exists()
    assert "Jane Doe" in PROFILE_FILE.read_text(encoding="utf-8")


def test_upload_invalid_extension():
    """Verify uploading an unsupported extension returns 400 error."""
    file_bytes = io.BytesIO(b"fake executable binary")
    response = client.post(
        "/api/upload",
        files={"file": ("malware.exe", file_bytes, "application/octet-stream")}
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]


def test_upload_empty_request():
    """Verify empty upload request returns 400 error."""
    response = client.post("/api/upload")
    assert response.status_code == 400
    assert "Please provide either a file upload or a webpage URL" in response.json()["detail"]


def test_markdown_structurer():
    """Verify clean_and_structure_markdown normalizes headers and bullets."""
    raw = (
        "John Smith\n"
        "experience\n"
        "Software Engineer at Google\n"
        "education\n"
        "MIT\n"
        "* Developed algorithms\n"
    )
    structured = clean_and_structure_markdown(raw)
    assert "## Experience" in structured
    assert "## Education" in structured
    assert "- Developed algorithms" in structured


def test_split_and_select_sections():
    """Verify section splitter and relevant context selector."""
    long_markdown = (
        "# Sample User\n\n"
        "## Summary\nQuick summary.\n\n"
        "## Experience\nWorked on Python and distributed systems.\n\n"
        "## Education\nStanford University CS.\n\n"
        "## Skills\nDocker, Kubernetes, Go.\n"
    )
    sections = split_profile_sections(long_markdown)
    assert len(sections) >= 4

    context = select_relevant_context(long_markdown, "Where did you study?")
    assert "Stanford" in context


def test_chat_empty_query():
    """Verify empty query returns prompt to enter a question."""
    response = client.post("/api/chat", json={"message": "   ", "history": []})
    assert response.status_code == 200
    data = response.json()
    assert data["reply"] == "Please enter a question."


def test_chat_without_api_key():
    """Verify friendly error message when OPENAI_API_KEY is missing or dummy."""
    # Ensure placeholder key
    os.environ["OPENAI_API_KEY"] = "your_openai_api_key_here"
    response = client.post("/api/chat", json={"message": "What is your name?", "history": []})
    assert response.status_code == 200
    data = response.json()
    assert "⚠️ OpenAI API key is missing" in data["reply"]
