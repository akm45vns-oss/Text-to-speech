from pathlib import Path
from uuid import uuid4

from app.schemas.documents import TtsRequest, TtsResponse

try:
    import edge_tts
except ImportError:  # pragma: no cover
    edge_tts = None


AUDIO_DIR = Path("audio")


class TtsServiceError(Exception):
    pass


class TtsService:
    async def synthesize(self, payload: TtsRequest) -> TtsResponse:
        if edge_tts is None:
            raise TtsServiceError("edge-tts is not installed, so speech generation is unavailable.")

        AUDIO_DIR.mkdir(parents=True, exist_ok=True)
        filename = f"{uuid4()}.mp3"
        path = AUDIO_DIR / filename
        rate = self._speed_to_rate(payload.speed)

        try:
            communicate = edge_tts.Communicate(payload.text, payload.voice, rate=rate)
            await communicate.save(str(path))
        except Exception as exc:  # pragma: no cover
            raise TtsServiceError("Speech generation failed.") from exc

        words = len(payload.text.split())
        duration = max(1, int((words / 155) * 60 / payload.speed))
        return TtsResponse(audio_url=f"/audio/{filename}", voice=payload.voice, duration_estimate_seconds=duration)

    def _speed_to_rate(self, speed: float) -> str:
        percent = int((speed - 1) * 100)
        return f"{percent:+d}%"
