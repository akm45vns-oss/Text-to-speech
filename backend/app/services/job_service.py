import asyncio
import json
import logging
import os
import re
from pathlib import Path
from uuid import uuid4

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database.session import SessionLocal
from app.models.job import Chunk, Job
from app.schemas.documents import TranslateRequest, TtsRequest
from app.services.translate_service import TranslationService, TranslationServiceError
from app.services.tts_service import TtsService, TtsServiceError

logger = logging.getLogger(__name__)

# Configurable Limits
MAX_CHUNK_CHARS = int(os.getenv("MAX_CHUNK_CHARS", "2000"))
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "3"))
AUDIO_DIR = Path("audio")


class JobServiceError(Exception):
    pass


class JobService:
    def create_translation_job(self, document_id: str, payload: TranslateRequest, db: Session) -> str:
        job_id = str(uuid4())
        settings = {
            "source_language": payload.source_language,
            "target_language": payload.target_language
        }
        
        job = Job(
            id=job_id,
            job_type="TRANSLATE",
            document_id=document_id,
            settings_payload=json.dumps(settings)
        )
        db.add(job)
        db.commit()
        
        # Chunk text and create Chunk records
        self._create_chunks_for_job(job_id, payload.text, db)
        
        # Start background processing
        asyncio.create_task(self._process_job_async(job_id))
        
        return job_id

    def create_tts_job(self, document_id: str, payload: TtsRequest, db: Session) -> str:
        job_id = str(uuid4())
        settings = {
            "voice": payload.voice,
            "speed": payload.speed
        }
        
        job = Job(
            id=job_id,
            job_type="TTS",
            document_id=document_id,
            settings_payload=json.dumps(settings)
        )
        db.add(job)
        db.commit()
        
        # Chunk text (using smaller chunks for TTS can be helpful, but we'll use the same algorithm)
        # TTS chunking should ideally stop at 500-1000 chars for edge-tts stability
        tts_chunk_max = min(MAX_CHUNK_CHARS, 1500) 
        self._create_chunks_for_job(job_id, payload.text, db, max_chars=tts_chunk_max)
        
        # Start background processing
        asyncio.create_task(self._process_job_async(job_id))
        
        return job_id

    def get_job_status(self, job_id: str, db: Session) -> dict:
        job = db.get(Job, job_id)
        if not job:
            raise JobServiceError("Job not found.")
            
        return {
            "id": job.id,
            "job_type": job.job_type,
            "status": job.status,
            "progress": job.progress,
            "total_chunks": job.total_chunks,
            "completed_chunks": job.completed_chunks,
            "result_data": job.result_data,
            "error_message": job.error_message
        }

    def _create_chunks_for_job(self, job_id: str, text: str, db: Session, max_chars: int = MAX_CHUNK_CHARS):
        """Intelligently chunks text by paragraphs, then sentences."""
        chunks = []
        current = ""
        
        # Split by paragraph first
        paragraphs = re.split(r'\n+', text.strip())
        
        for para in paragraphs:
            if len(para) <= max_chars:
                if len(current) + len(para) + 2 <= max_chars:
                    current = (current + "\n\n" + para).strip() if current else para
                else:
                    if current:
                        chunks.append(current)
                    current = para
            else:
                # Paragraph is too big, split by sentences
                if current:
                    chunks.append(current)
                    current = ""
                    
                sentences = re.split(r'(?<=[.!?])\s+', para)
                for sentence in sentences:
                    sentence = sentence.strip()
                    if not sentence:
                        continue
                    if len(sentence) <= max_chars:
                        if len(current) + len(sentence) + 1 <= max_chars:
                            current = (current + " " + sentence).strip() if current else sentence
                        else:
                            if current:
                                chunks.append(current)
                            current = sentence
                    else:
                        # Fallback: if a single sentence is ridiculously long, force split it
                        if current:
                            chunks.append(current)
                            current = ""
                        for i in range(0, len(sentence), max_chars):
                            chunks.append(sentence[i:i+max_chars])
        
        if current:
            chunks.append(current)
            
        if not chunks:
            chunks = [""] # Handle empty text gracefully
            
        # Insert chunks into DB
        for i, chunk_text in enumerate(chunks):
            chunk = Chunk(job_id=job_id, sequence=i, text=chunk_text)
            db.add(chunk)
            
        job = db.get(Job, job_id)
        job.total_chunks = len(chunks)
        db.commit()

    async def _process_job_async(self, job_id: str):
        """Background coroutine to process all chunks of a job."""
        # Use a new DB session for the background task
        with SessionLocal() as db:
            job = db.get(Job, job_id)
            if not job or job.status in ("COMPLETED", "FAILED"):
                return
                
            job.status = "PROCESSING"
            db.commit()
            
            try:
                if job.job_type == "TRANSLATE":
                    await self._process_translation_job(job, db)
                elif job.job_type == "TTS":
                    await self._process_tts_job(job, db)
                    
            except Exception as e:
                logger.error(f"Job {job_id} failed: {e}")
                job.status = "FAILED"
                job.error_message = str(e)
                db.commit()

    async def _process_translation_job(self, job: Job, db: Session):
        settings = json.loads(job.settings_payload)
        chunks = db.scalars(select(Chunk).where(Chunk.job_id == job.id).order_by(Chunk.sequence)).all()
        
        translator = TranslationService()
        
        for chunk in chunks:
            if chunk.status == "COMPLETED":
                continue
                
            while chunk.attempts < MAX_RETRIES:
                try:
                    payload = TranslateRequest(
                        text=chunk.text,
                        source_language=settings["source_language"],
                        target_language=settings["target_language"]
                    )
                    # TranslationService handles fallback and translation
                    response = await translator.translate(payload)
                    
                    chunk.result_data = response.translated_text
                    chunk.status = "COMPLETED"
                    job.completed_chunks += 1
                    job.progress = int((job.completed_chunks / job.total_chunks) * 100) if job.total_chunks > 0 else 100
                    db.commit()
                    break # Success, break retry loop
                    
                except Exception as e:
                    chunk.attempts += 1
                    db.commit()
                    if chunk.attempts >= MAX_RETRIES:
                        raise Exception(f"Chunk {chunk.sequence} failed after {MAX_RETRIES} attempts: {e}")
                    await asyncio.sleep(1) # Small backoff
                    
        # All chunks completed, merge text
        db.refresh(job) # Ensure we have latest data
        merged_text = "\n\n".join([c.result_data for c in chunks if c.result_data])
        job.result_data = merged_text
        job.status = "COMPLETED"
        job.progress = 100.0
        db.commit()

    async def _process_tts_job(self, job: Job, db: Session):
        settings = json.loads(job.settings_payload)
        chunks = db.scalars(select(Chunk).where(Chunk.job_id == job.id).order_by(Chunk.sequence)).all()
        
        tts_service = TtsService()
        AUDIO_DIR.mkdir(parents=True, exist_ok=True)
        
        chunk_files = []
        partial_merged = False
        
        for chunk in chunks:
            if chunk.status == "COMPLETED" and chunk.result_data:
                chunk_files.append(Path(chunk.result_data))
                continue
                
            while chunk.attempts < MAX_RETRIES:
                try:
                    payload = TtsRequest(
                        text=chunk.text,
                        voice=settings["voice"],
                        speed=float(settings["speed"])
                    )
                    
                    # We pass a custom filename prefix so chunks are easily identified
                    chunk_filename = f"chunk_{job.id}_{chunk.sequence}.mp3"
                    chunk_path = AUDIO_DIR / chunk_filename
                    
                    # Edge-tts synthesis
                    await tts_service.synthesize_to_file(payload, chunk_path)
                    
                    chunk.result_data = str(chunk_path)
                    chunk.status = "COMPLETED"
                    job.completed_chunks += 1
                    job.progress = int((job.completed_chunks / job.total_chunks) * 100) if job.total_chunks > 0 else 100
                    db.commit()
                    
                    chunk_files.append(chunk_path)
                    
                    if not partial_merged and job.progress >= 50 and len(chunk_files) > 0:
                        partial_filename = f"{job.id}_partial.mp3"
                        partial_path = AUDIO_DIR / partial_filename
                        self._merge_mp3_files(chunk_files, partial_path)
                        job.result_data = f"/audio/{partial_filename}"
                        db.commit()
                        partial_merged = True
                        
                    break # Success, break retry loop
                    
                except Exception as e:
                    chunk.attempts += 1
                    db.commit()
                    if chunk.attempts >= MAX_RETRIES:
                        raise Exception(f"Chunk {chunk.sequence} failed after {MAX_RETRIES} attempts: {e}")
                    await asyncio.sleep(1)
                    
        # Merge all MP3s
        final_filename = f"{job.id}.mp3"
        final_path = AUDIO_DIR / final_filename
        
        self._merge_mp3_files(chunk_files, final_path)
        
        # Cleanup chunks to save space
        for cf in chunk_files:
            try:
                if cf.exists():
                    cf.unlink()
            except Exception:
                pass
                
        # Do NOT delete the partial file here! 
        # If the user's browser is currently streaming the partial file, deleting it will 
        # cause their subsequent HTTP Range requests to return 404, breaking playback instantly!
        
        job.result_data = f"/audio/{final_filename}"
        job.status = "COMPLETED"
        job.progress = 100.0
        db.commit()
        
    def _merge_mp3_files(self, input_paths: list[Path], output_path: Path):
        """Binary appends MP3 files together. Very fast and requires no ffmpeg."""
        with open(output_path, "wb") as outfile:
            for p in input_paths:
                if p.exists():
                    with open(p, "rb") as infile:
                        outfile.write(infile.read())
