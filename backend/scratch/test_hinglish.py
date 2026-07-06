import asyncio
from app.services.translate_service import TranslationService
from app.schemas.documents import TranslateRequest

async def test():
    svc = TranslationService()
    # Test English -> Hinglish
    req = TranslateRequest.model_validate({
        'text': 'Hello, how are you? What is your name?',
        'targetLanguage': 'hi-Latn'
    })
    
    result = await svc.translate(req)
    
    with open('scratch/test_hinglish_output.txt', 'w', encoding='utf-8') as f:
        f.write(f"Original: {req.text}\n")
        f.write(f"Hinglish: {result.translated_text}\n")
        f.write(f"Source Lang: {result.source_language}\n")
        f.write(f"Target Lang: {result.target_language}\n")

asyncio.run(test())
print("Hinglish translation test completed. Output written to scratch/test_hinglish_output.txt")
