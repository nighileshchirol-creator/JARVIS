# LinkedIn Me AI Chatbot

A simple, fast, and fully functional local AI chatbot that answers questions about you using your LinkedIn profile. Everything runs locally on your machine except requests to the OpenAI API.

## 🌟 Features

- **Strict Knowledge Grounding**: Answers questions using `data/linkedin_profile.md` as the single factual source.
- **First-Person Persona**: Answers naturally in first person (`"I"`, `"my"`, `"me"`).
- **Exact Missing Info Fallback**: If information is not in the profile, returns:  
  `"My profile does not include that information."`
- **Section Attribution**: Displays the supporting Markdown section heading (e.g., `📌 Source: Experience`, `📌 Source: Education`).
- **Flexible Document Ingestion**:
  - Upload **PDF**, **DOCX**, **DOC**, **TXT**, **HTML**, or **MD** documents.
  - Or paste a publicly accessible webpage URL.
  - Documents are extracted 100% locally with Python libraries—no external APIs called for document conversion.
- **Zero Heavy Frameworks**: No LangChain, no vector databases, no embeddings, no Streamlit, and no complex RAG overhead.
- **Dynamic Context**: Full markdown is passed for normal-sized profiles, with smart section keyword matching for large profiles.
- **Session History**: Maintains conversation history throughout the current session.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla CSS (Modern dark glassmorphic design), Vanilla JavaScript (`fetch`).
- **Backend**: Python FastAPI with `uvicorn`.
- **AI Engine**: Official OpenAI Python SDK (`openai`).
- **Text Extractors**: `pypdf`, `python-docx`, `beautifulsoup4`, `markdownify`.
- **Storage**: Local filesystem (`data/linkedin_profile.md`).

---

## 📁 Project Structure

```text
linkedin-me-chatbot/
├── public/
│   ├── index.html       # Single-page UI
│   ├── style.css        # Responsive dark theme
│   └── script.js        # Vanilla JS client logic
├── api/
│   └── main.py          # FastAPI server & endpoints
├── data/
│   └── linkedin_profile.md # Knowledge base markdown
├── tests/
│   └── test_api.py      # Automated smoke tests
├── requirements.txt     # Python dependencies
├── .env.example         # Environment template
├── .env                 # API key configuration
├── .gitignore           # Ignored files
└── README.md            # Documentation
```

---

## 🚀 Quickstart Guide

### 1. Configure OpenAI API Key

Edit the `.env` file in the project root:

```env
OPENAI_API_KEY=sk-...your-actual-key...
OPENAI_MODEL=gpt-4o-mini
```

### 2. Launch the Application

Run the server using Uvicorn:

```powershell
python -m uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
```

Then open your browser to:
👉 **`http://127.0.0.1:8000`**

---

## 📖 How to Use

1. **Test the Starter Profile**: The app comes with a realistic starter profile in `data/linkedin_profile.md` so you can chat immediately.
2. **Import Your Own Profile**:
   - Go to your LinkedIn profile.
   - Click **More** > **Save to PDF** (or save as HTML/text).
   - Drop the file into the **Upload File** tab or browse to select it.
   - Click **Convert & Save**.
   - Watch the **Markdown Preview** update live with your structured profile!
3. **Chat**:
   - Ask questions like:
     - *"What companies have you worked at?"*
     - *"What are your top technical skills?"*
     - *"Where did you go to university?"*
     - *"Do you have experience in quantum computing?"* (Trigger the fallback when absent)

---

## 🧪 Running Smoke Tests

Run the included automated tests:

```powershell
python -m pytest tests/test_api.py -v
```

---

## 🔒 Security & Privacy

- All document parsing occurs 100% on your local machine.
- Your `OPENAI_API_KEY` stays on the backend server and is never exposed to the frontend.
