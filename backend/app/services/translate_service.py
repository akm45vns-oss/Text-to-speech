import os

import httpx

from app.schemas.documents import TranslateRequest, TranslateResponse

# ---------------------------------------------------------------------------
# MyMemory is a free translation API (no key required, 1 000 words/day).
# https://mymemory.translated.net/doc/spec.php
# Max 500 characters per request — we chunk longer texts automatically.
# ---------------------------------------------------------------------------
MYMEMORY_URL = "https://api.mymemory.translated.net/get"
MAX_CHUNK_CHARS = 480  # stay safely under the 500-char limit


class TranslationServiceError(Exception):
    pass


class TranslationService:
    async def translate(self, payload: TranslateRequest) -> TranslateResponse:
        # If a self-hosted LibreTranslate instance is configured, prefer it.
        base_url = os.getenv("LIBRETRANSLATE_URL")
        if base_url:
            return await self._translate_with_libretranslate(base_url, payload)

        # Default: use the free MyMemory API.
        return await self._translate_with_mymemory(payload)

    # ------------------------------------------------------------------
    # MyMemory (free, no key)
    # ------------------------------------------------------------------
    async def _translate_with_mymemory(self, payload: TranslateRequest) -> TranslateResponse:
        # MyMemory uses "en|hi" style language pairs; map "auto" → "en" as a
        # sensible default when no source language is specified.
        source = payload.source_language if payload.source_language not in ("auto", "") else "en"
        langpair = f"{source}|{payload.target_language}"

        chunks = self._chunk_text(payload.text)
        translated_parts: list[str] = []

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                for chunk in chunks:
                    response = await client.get(
                        MYMEMORY_URL,
                        params={"q": chunk, "langpair": langpair},
                    )
                    response.raise_for_status()
                    data = response.json()
                    translated = data.get("responseData", {}).get("translatedText") or chunk
                    # MyMemory sometimes returns the error string as the translation.
                    if isinstance(translated, str) and translated.startswith("MYMEMORY WARNING"):
                        raise TranslationServiceError(
                            "MyMemory daily quota reached. Try again tomorrow or configure a LibreTranslate server."
                        )
                    translated_parts.append(translated)
        except httpx.HTTPError as exc:
            raise TranslationServiceError(
                "Translation service is unavailable. Check your internet connection."
            ) from exc

        return TranslateResponse(
            translated_text="\n".join(translated_parts),
            source_language=payload.source_language,
            target_language=payload.target_language,
        )

    def _chunk_text(self, text: str) -> list[str]:
        """Split *text* into pieces ≤ MAX_CHUNK_CHARS at sentence boundaries."""
        if len(text) <= MAX_CHUNK_CHARS:
            return [text]

        chunks: list[str] = []
        current = ""

        # Try to split on sentence-ending punctuation first.
        import re
        sentences = re.split(r"(?<=[.!?])\s+", text.replace("\n", " "))

        for sentence in sentences:
            candidate = (current + " " + sentence).strip() if current else sentence
            if len(candidate) <= MAX_CHUNK_CHARS:
                current = candidate
            else:
                if current:
                    chunks.append(current)
                # If a single sentence exceeds the limit, hard-split on words.
                if len(sentence) > MAX_CHUNK_CHARS:
                    word_buf = ""
                    for word in sentence.split():
                        trial = (word_buf + " " + word).strip()
                        if len(trial) <= MAX_CHUNK_CHARS:
                            word_buf = trial
                        else:
                            if word_buf:
                                chunks.append(word_buf)
                            word_buf = word
                    current = word_buf
                else:
                    current = sentence

        if current:
            chunks.append(current)

        return chunks or [text[:MAX_CHUNK_CHARS]]

    # ------------------------------------------------------------------
    # LibreTranslate (self-hosted, optional)
    # ------------------------------------------------------------------
    async def _translate_with_libretranslate(self, base_url: str, payload: TranslateRequest) -> TranslateResponse:
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    f"{base_url.rstrip('/')}/translate",
                    json={
                        "q": payload.text,
                        "source": payload.source_language,
                        "target": payload.target_language,
                        "format": "text",
                    },
                )
                response.raise_for_status()
        except httpx.HTTPError as exc:
            raise TranslationServiceError("LibreTranslate is unavailable.") from exc

        data = response.json()
        return TranslateResponse(
            translated_text=data.get("translatedText", ""),
            source_language=payload.source_language,
            target_language=payload.target_language,
        )
