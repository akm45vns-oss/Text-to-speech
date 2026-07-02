# ReadLingo AI Architecture

## MVP Scope

- Upload PDF, JPG, JPEG, and PNG files.
- Extract selectable PDF text on the backend.
- Keep OCR, translation, and TTS behind service boundaries so stronger engines can be added without changing the UI.
- Provide a mobile-friendly reader with language controls, reading settings, playback controls, and audio download.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/upload` | Store and validate a document. |
| `POST` | `/api/ocr` | Extract text from an uploaded document. |
| `POST` | `/api/translate` | Translate text into a target language. |
| `POST` | `/api/tts` | Generate speech audio. |
| `GET` | `/api/history` | Return recent document records. |
| `GET` | `/api/health` | Health check. |

## Service Boundaries

- `document_service.py`: file validation, persistence, PDF text extraction, document metadata.
- `translate_service.py`: LibreTranslate-compatible network adapter plus deterministic local fallback.
- `tts_service.py`: Edge TTS adapter and audio file lifecycle.
- `database/`: SQLAlchemy session and persistence models.

## Production Notes

- Replace local storage with object storage such as Cloudflare R2 or Supabase Storage.
- Move CPU-heavy OCR/TTS work into a queue worker.
- Add rate limiting, antivirus scanning, and signed download URLs before public release.
