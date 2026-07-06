from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database.session import get_session
from app.schemas.documents import (
    DocumentUploadResponse,
    HistoryItem,
    OcrRequest,
    OcrResponse,
    TranslateRequest,
    TtsRequest,
    JobResponse,
)
from app.services.document_service import DocumentService, DocumentServiceError
from app.services.job_service import JobService, JobServiceError

router = APIRouter()
job_service = JobService()

@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/upload", response_model=DocumentUploadResponse, response_model_by_alias=True)
async def upload_document(file: UploadFile = File(...), session: Session = Depends(get_session)) -> DocumentUploadResponse:
    try:
        return await DocumentService(session).save_upload(file)
    except DocumentServiceError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/ocr", response_model=OcrResponse, response_model_by_alias=True)
def extract_text(payload: OcrRequest, session: Session = Depends(get_session)) -> OcrResponse:
    try:
        return DocumentService(session).extract_text(payload.document_id)
    except DocumentServiceError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/translate/job", response_model=dict, response_model_by_alias=True)
async def translate_job(payload: TranslateRequest, session: Session = Depends(get_session)) -> dict:
    try:
        # We can pass an empty document_id if not tied directly to one in the payload
        job_id = job_service.create_translation_job("", payload, session)
        return {"jobId": job_id}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/tts/job", response_model=dict, response_model_by_alias=True)
async def tts_job(payload: TtsRequest, session: Session = Depends(get_session)) -> dict:
    try:
        job_id = job_service.create_tts_job("", payload, session)
        return {"jobId": job_id}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/jobs/{job_id}", response_model=JobResponse, response_model_by_alias=True)
def get_job(job_id: str, session: Session = Depends(get_session)) -> dict:
    try:
        return job_service.get_job_status(job_id, session)
    except JobServiceError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/history", response_model=list[HistoryItem], response_model_by_alias=True)
def history(session: Session = Depends(get_session)) -> list[HistoryItem]:
    return DocumentService(session).history()
