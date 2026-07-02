from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database.session import get_session
from app.schemas.documents import (
    DocumentUploadResponse,
    HistoryItem,
    OcrRequest,
    OcrResponse,
    TranslateRequest,
    TranslateResponse,
    TtsRequest,
    TtsResponse,
)
from app.services.document_service import DocumentService, DocumentServiceError
from app.services.translate_service import TranslationService, TranslationServiceError
from app.services.tts_service import TtsService, TtsServiceError

router = APIRouter()


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


@router.post("/translate", response_model=TranslateResponse, response_model_by_alias=True)
async def translate(payload: TranslateRequest) -> TranslateResponse:
    try:
        return await TranslationService().translate(payload)
    except TranslationServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/tts", response_model=TtsResponse, response_model_by_alias=True)
async def tts(payload: TtsRequest) -> TtsResponse:
    try:
        return await TtsService().synthesize(payload)
    except TtsServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/history", response_model=list[HistoryItem], response_model_by_alias=True)
def history(session: Session = Depends(get_session)) -> list[HistoryItem]:
    return DocumentService(session).history()
