import type { LanguageCode, OcrResponse, TranslateResponse, TtsResponse, UploadResponse } from "../types/document";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

/**
 * Parse a JSON response, raising a user-friendly Error on failure.
 * FastAPI errors are JSON `{"detail": "..."}` — we extract the detail message
 * rather than showing the raw JSON string to the user.
 */
async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (typeof body?.detail === "string") {
        message = body.detail;
      } else if (typeof body?.detail === "object" && Array.isArray(body.detail)) {
        // Pydantic validation errors come as an array of {loc, msg, type}
        message = body.detail.map((e: { msg: string }) => e.msg).join("; ");
      } else if (typeof body === "string") {
        message = body;
      }
    } catch {
      // Body was not JSON — fall back to the status message above.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });

  return readJson<UploadResponse>(response);
}

export async function extractText(documentId: string): Promise<OcrResponse> {
  const response = await fetch(`${API_BASE_URL}/api/ocr`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentId }),
  });

  return readJson<OcrResponse>(response);
}

export async function translateText(text: string, targetLanguage: LanguageCode, sourceLanguage = "auto"): Promise<TranslateResponse> {
  const response = await fetch(`${API_BASE_URL}/api/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, sourceLanguage, targetLanguage }),
  });

  return readJson<TranslateResponse>(response);
}

export async function synthesizeSpeech(text: string, voice: string, speed: number): Promise<TtsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice, speed }),
  });

  const payload = await readJson<TtsResponse>(response);
  return {
    ...payload,
    audioUrl: payload.audioUrl.startsWith("http") ? payload.audioUrl : `${API_BASE_URL}${payload.audioUrl}`,
  };
}
