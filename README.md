---
title: Text to speech
emoji: 📖
colorFrom: indigo
colorTo: green
sdk: docker
app_port: 7860
---

# ReadLingo AI

ReadLingo AI is a document reader for uploading PDFs or images, extracting text, translating it, and generating listenable audio.

## Project Layout

```text
frontend/  React + Vite + TypeScript app
backend/   FastAPI service for upload, OCR/text extraction, translation, and TTS
docs/      Architecture and implementation notes
```

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

The app expects the API at `http://localhost:8000` by default. Override it with:

```text
VITE_API_BASE_URL=http://localhost:8000
```

## Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Optional runtime integrations:

- `PyMuPDF` extracts selectable PDF text.
- `Pillow` validates and reads image metadata.
- `edge-tts` generates MP3 audio.
- `LIBRETRANSLATE_URL` enables real translation through a LibreTranslate-compatible service.

Without optional engines, the API still starts and returns clear errors for engine-dependent work.
