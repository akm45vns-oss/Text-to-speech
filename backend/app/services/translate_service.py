import os
import re
import httpx

from app.schemas.documents import TranslateRequest, TranslateResponse

# ---------------------------------------------------------------------------
# Translation URLs
# ---------------------------------------------------------------------------
GOOGLE_TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single"
MYMEMORY_URL = "https://api.mymemory.translated.net/get"
MAX_CHUNK_CHARS = 480

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

        # Create a proxy request for standard translation
        proxy_payload = TranslateRequest(
            text=payload.text,
            source_language=payload.source_language,
            target_language=actual_target
        )

        # 1. Prefer LibreTranslate if explicit config is provided
        base_url = os.getenv("LIBRETRANSLATE_URL")
        if base_url:
            try:
                response = await self._translate_with_libretranslate(base_url, proxy_payload)
                return self._finalize_response(response, is_hinglish, payload)
            except Exception as exc:
                print(f"LibreTranslate failed: {exc}. Trying fallback...", flush=True)

        # 2. Try Google Translate (unofficial gtx endpoint) - very stable & high limits
        try:
            response = await self._translate_with_google(proxy_payload)
            return self._finalize_response(response, is_hinglish, payload)
        except Exception as exc:
            print(f"Google Translate failed: {exc}. Trying MyMemory...", flush=True)

        # 3. Try MyMemory as a final fallback
        try:
            response = await self._translate_with_mymemory(proxy_payload)
            return self._finalize_response(response, is_hinglish, payload)
        except Exception as exc:
            print(f"MyMemory failed: {exc}", flush=True)
            raise TranslationServiceError(
                "Translation service is currently unavailable. Please try again later."
            ) from exc

    def _finalize_response(self, response: TranslateResponse, is_hinglish: bool, original_payload: TranslateRequest) -> TranslateResponse:
        if is_hinglish:
            transliterated = self._transliterate_devanagari_to_roman(response.translated_text)
            return TranslateResponse(
                translated_text=transliterated,
                source_language=original_payload.source_language,
                target_language=original_payload.target_language
            )
        return response

    # ------------------------------------------------------------------
    # Google Translate (Free, gtx client)
    # ------------------------------------------------------------------
    async def _translate_with_google(self, payload: TranslateRequest) -> TranslateResponse:
        source = payload.source_language if payload.source_language not in ("auto", "") else "auto"
        
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(
                GOOGLE_TRANSLATE_URL,
                params={
                    "client": "gtx",
                    "sl": source,
                    "tl": payload.target_language,
                    "dt": "t",
                    "q": payload.text
                }
            )
            response.raise_for_status()
            data = response.json()
            
            # Parse Google translation array response structure
            translated_text = ""
            if data and isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
                translated_text = "".join(sentence[0] for sentence in data[0] if sentence and len(sentence) > 0)
                
            if not translated_text:
                raise TranslationServiceError("Google Translate returned empty response.")
                
            return TranslateResponse(
                translated_text=translated_text,
                source_language=payload.source_language,
                target_language=payload.target_language
            )

    # ------------------------------------------------------------------
    # MyMemory (Free, fallback)
    # ------------------------------------------------------------------
    async def _translate_with_mymemory(self, payload: TranslateRequest) -> TranslateResponse:
        source = payload.source_language if payload.source_language not in ("auto", "") else "en"
        langpair = f"{source}|{payload.target_language}"

        chunks = self._chunk_text(payload.text)
        translated_parts: list[str] = []

        async with httpx.AsyncClient(timeout=15) as client:
            for chunk in chunks:
                response = await client.get(
                    MYMEMORY_URL,
                    params={
                        "q": chunk, 
                        "langpair": langpair,
                        "de": "readlingo-app@outlook.com"  # Increases limits, reduces cloud IP bans
                    },
                )
                response.raise_for_status()
                data = response.json()
                translated = data.get("responseData", {}).get("translatedText") or chunk
                if isinstance(translated, str) and translated.startswith("MYMEMORY WARNING"):
                    raise TranslationServiceError("MyMemory quota limit reached.")
                translated_parts.append(translated)

        return TranslateResponse(
            translated_text="\n".join(translated_parts),
            source_language=payload.source_language,
            target_language=payload.target_language,
        )

    # ------------------------------------------------------------------
    # LibreTranslate
    # ------------------------------------------------------------------
    async def _translate_with_libretranslate(self, base_url: str, payload: TranslateRequest) -> TranslateResponse:
        async with httpx.AsyncClient(timeout=15) as client:
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
            data = response.json()
            return TranslateResponse(
                translated_text=data.get("translatedText", ""),
                source_language=payload.source_language,
                target_language=payload.target_language
            )

    def _chunk_text(self, text: str) -> list[str]:
        if len(text) <= MAX_CHUNK_CHARS:
            return [text]

        chunks: list[str] = []
        current = ""
        sentences = re.split(r"(?<=[.!?])\s+", text.replace("\n", " "))

        for sentence in sentences:
            candidate = (current + " " + sentence).strip() if current else sentence
            if len(candidate) <= MAX_CHUNK_CHARS:
                current = candidate
            else:
                if current:
                    chunks.append(current)
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
    # Transliteration
    # ------------------------------------------------------------------
    def _transliterate_devanagari_to_roman(self, text: str) -> str:
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
