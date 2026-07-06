import httpx
import json

async def test_google_translate():
    url = "https://translate.googleapis.com/translate_a/single"
    params = {
        "client": "gtx",
        "sl": "auto",
        "tl": "hi",
        "dt": "t",
        "q": "Hello, how are you? What is your name?"
    }
    
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(url, params=params)
        print("Status Code:", response.status_code)
        # Safe decoding
        data = response.json()
        print("Raw JSON response:", json.dumps(data, ensure_ascii=False)[:300])
        
        # Parse sentences
        translated_text = ""
        if data and isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
            translated_text = "".join(sentence[0] for sentence in data[0] if sentence and len(sentence) > 0)
        
        print("Parsed translation:", repr(translated_text))

import asyncio
asyncio.run(test_google_translate())
