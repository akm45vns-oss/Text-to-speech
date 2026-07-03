import os
import re
import httpx

from app.schemas.documents import TranslateRequest, TranslateResponse

# ---------------------------------------------------------------------------
# MyMemory is a free translation API (no key required, 1 000 words/day).
# https://mymemory.translated.net/doc/spec.php
# Max 500 characters per request — we chunk longer texts automatically.
# ---------------------------------------------------------------------------
MYMEMORY_URL = "https://api.mymemory.translated.net/get"
MAX_CHUNK_CHARS = 480  # stay safely under the 500-char limit

# Devanagari mapping for Hinglish Transliteration
VOWELS = {
    'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo', 'ऋ': 'ri',
    'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'अं': 'an', 'अः': 'ah', 'ऑ': 'o'
}

MATRAS = {
    'ा': 'aa', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo', 'ृ': 'ri',
    'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ं': 'n', 'ँ': 'n', 'ः': 'h', 'ॅ': 'e'
}

CONSONANTS = {
    'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'n',
    'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'n',
    'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
    'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
    'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
    'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
    'क्ष': 'ksh', 'त्र': 'tr', 'ज्ञ': 'gy',
    'क़': 'q', 'ख़': 'kh', 'ग़': 'g', 'ज़': 'z', 'ड़': 'd', 'ढ़': 'dh', 'फ़': 'f'
}

VIRAMA = '्'


class TranslationServiceError(Exception):
    pass


class TranslationService:
    async def translate(self, payload: TranslateRequest) -> TranslateResponse:
        # Check if the target is Hinglish (Hindi in Latin script)
        is_hinglish = payload.target_language == "hi-Latn"
        actual_target = "hi" if is_hinglish else payload.target_language

        # Create a proxy request for the standard translation phase
        proxy_payload = TranslateRequest(
            text=payload.text,
            source_language=payload.source_language,
            target_language=actual_target
        )

        # If a self-hosted LibreTranslate instance is configured, prefer it.
        base_url = os.getenv("LIBRETRANSLATE_URL")
        if base_url:
            response = await self._translate_with_libretranslate(base_url, proxy_payload)
        else:
            response = await self._translate_with_mymemory(proxy_payload)

        # If Hinglish is requested, convert the Devanagari Hindi result to Latin script
        if is_hinglish:
            transliterated = self._transliterate_devanagari_to_roman(response.translated_text)
            return TranslateResponse(
                translated_text=transliterated,
                source_language=payload.source_language,
                target_language=payload.target_language
            )

        return response

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

    # ------------------------------------------------------------------
    # Transliteration (Devanagari -> Romanized Hinglish)
    # ------------------------------------------------------------------
    def _transliterate_devanagari_to_roman(self, text: str) -> str:
        """Transliterates Devanagari script text into standard Romanized Hinglish."""
        words = text.split(' ')
        result_words = []
        
        for word in words:
            if not re.search(r'[\u0900-\u097F]', word):
                result_words.append(word)
                continue
                
            transliterated = ""
            i = 0
            n = len(word)
            
            while i < n:
                char = word[i]
                
                if char in CONSONANTS:
                    base = CONSONANTS[char]
                    
                    if i + 1 < n:
                        next_char = word[i + 1]
                        
                        if next_char == VIRAMA:
                            transliterated += base
                            i += 2
                            continue
                        elif next_char in MATRAS:
                            transliterated += base + MATRAS[next_char]
                            i += 2
                            continue
                    
                    # End of word consonant schwa deletion rule
                    if i + 1 == n or (i + 1 < n and word[i + 1] in ['।', ',', '.', '!', '?', '-', '\n']):
                        transliterated += base
                    else:
                        transliterated += base + 'a'
                    i += 1
                    
                elif char in VOWELS:
                    transliterated += VOWELS[char]
                    i += 1
                elif char in MATRAS:
                    transliterated += MATRAS[char]
                    i += 1
                elif char == '।':
                    transliterated += '.'
                    i += 1
                else:
                    transliterated += char
                    i += 1
                    
            result_words.append(transliterated)
            
        return ' '.join(result_words)
