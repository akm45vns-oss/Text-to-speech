from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Shared config: allow both the Python snake_case name and the camelCase alias
# when populating, and use aliases when serializing.
# ---------------------------------------------------------------------------
class _AliasedModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class DocumentUploadResponse(_AliasedModel):
    document_id: str = Field(serialization_alias="documentId")
    filename: str
    size: int
    pages: int
    language: str


class OcrRequest(_AliasedModel):
    document_id: str = Field(validation_alias="documentId")


class OcrResponse(_AliasedModel):
    document_id: str = Field(serialization_alias="documentId")
    text: str
    pages: int
    language: str


class TranslateRequest(_AliasedModel):
    text: str = Field(min_length=1)
    source_language: str = Field(default="auto", validation_alias="sourceLanguage")
    target_language: str = Field(validation_alias="targetLanguage")


class TranslateResponse(_AliasedModel):
    translated_text: str = Field(serialization_alias="translatedText")
    source_language: str = Field(serialization_alias="sourceLanguage")
    target_language: str = Field(serialization_alias="targetLanguage")


class TtsRequest(_AliasedModel):
    text: str = Field(min_length=1) # Removed artificial limit for smart chunking
    voice: str = "en-IN-NeerjaNeural"
    speed: float = Field(default=1.0, ge=0.7, le=1.4)


class TtsResponse(_AliasedModel):
    audio_url: str = Field(serialization_alias="audioUrl")
    voice: str
    duration_estimate_seconds: int = Field(serialization_alias="durationEstimateSeconds")


class JobResponse(_AliasedModel):
    id: str
    job_type: str = Field(serialization_alias="jobType")
    status: str
    progress: float
    total_chunks: int = Field(serialization_alias="totalChunks")
    completed_chunks: int = Field(serialization_alias="completedChunks")
    result_data: str | None = Field(default=None, serialization_alias="resultData")
    error_message: str | None = Field(default=None, serialization_alias="errorMessage")


class HistoryItem(_AliasedModel):
    id: str
    filename: str
    size: int
    pages: int
    language: str
    created_at: datetime = Field(serialization_alias="createdAt")
