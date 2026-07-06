from datetime import datetime
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base

class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    job_type: Mapped[str] = mapped_column(String(32), nullable=False) # 'TRANSLATE' or 'TTS'
    document_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="PENDING") # PENDING, PROCESSING, COMPLETED, FAILED
    progress: Mapped[float] = mapped_column(Float, default=0.0)
    total_chunks: Mapped[int] = mapped_column(Integer, default=0)
    completed_chunks: Mapped[int] = mapped_column(Integer, default=0)
    
    # Store JSON string of settings (e.g. voice, target_language, original_text_length)
    settings_payload: Mapped[str] = mapped_column(Text, default="{}")
    
    # Final result (translated string or audio URL)
    result_data: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Error message if failed
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    chunks: Mapped[list["Chunk"]] = relationship("Chunk", back_populates="job", cascade="all, delete-orphan")


class Chunk(Base):
    __tablename__ = "chunks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    job_id: Mapped[str] = mapped_column(ForeignKey("jobs.id"), nullable=False)
    sequence: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Original text slice for this chunk
    text: Mapped[str] = mapped_column(Text, nullable=False)
    
    status: Mapped[str] = mapped_column(String(32), default="PENDING") # PENDING, COMPLETED, FAILED
    
    # Result data (translated string or path to mp3 chunk)
    result_data: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Number of attempts for automatic retry
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    
    job: Mapped["Job"] = relationship("Job", back_populates="chunks")
