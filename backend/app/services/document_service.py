from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document import Document
from app.schemas.documents import DocumentUploadResponse, HistoryItem, OcrResponse

try:
    import fitz
except ImportError:  # pragma: no cover
    fitz = None

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    Image = None


UPLOAD_DIR = Path("uploads")
MAX_UPLOAD_SIZE = 25 * 1024 * 1024
SUPPORTED_TYPES = {"application/pdf", "image/png", "image/jpeg"}


class DocumentServiceError(Exception):
    pass


class DocumentService:
    def __init__(self, session: Session) -> None:
        self.session = session

    async def save_upload(self, file: UploadFile) -> DocumentUploadResponse:
        if file.content_type not in SUPPORTED_TYPES:
            raise DocumentServiceError("Only PDF, PNG, JPG, and JPEG files are supported.")

        content = await file.read()
        if not content:
            raise DocumentServiceError("The uploaded file is empty.")
        if len(content) > MAX_UPLOAD_SIZE:
            raise DocumentServiceError("Files must be smaller than 25 MB.")

        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        document_id = str(uuid4())
        extension = Path(file.filename or "document").suffix.lower() or self._extension_for_type(file.content_type)
        stored_path = UPLOAD_DIR / f"{document_id}{extension}"
        stored_path.write_bytes(content)

        pages = self._page_count(stored_path, file.content_type)
        document = Document(
            id=document_id,
            filename=file.filename or stored_path.name,
            path=str(stored_path),
            content_type=file.content_type,
            size=len(content),
            pages=pages,
            language="Auto",
        )
        self.session.add(document)
        self.session.commit()

        return DocumentUploadResponse(document_id=document.id, filename=document.filename, size=document.size, pages=document.pages, language=document.language)

    def extract_text(self, document_id: str) -> OcrResponse:
        document = self.session.get(Document, document_id)
        if document is None:
            raise DocumentServiceError("Document not found.")

        path = Path(document.path)
        if not path.exists():
            raise DocumentServiceError("Uploaded file is missing from storage.")

        text = ""
        if document.content_type == "application/pdf":
            text = self._extract_pdf_text(path)
        elif document.content_type.startswith("image/"):
            text = self._image_placeholder(path)

        if not text.strip():
            raise DocumentServiceError("No selectable text was found. Add an OCR engine such as Tesseract for scanned documents.")

        document.extracted_text = text
        self.session.add(document)
        self.session.commit()
        return OcrResponse(document_id=document.id, text=text, pages=document.pages, language=document.language)

    def history(self) -> list[HistoryItem]:
        rows = self.session.scalars(select(Document).order_by(Document.created_at.desc()).limit(20)).all()
        return [
            HistoryItem(id=row.id, filename=row.filename, size=row.size, pages=row.pages, language=row.language, created_at=row.created_at)
            for row in rows
        ]

    def _page_count(self, path: Path, content_type: str) -> int:
        if content_type == "application/pdf" and fitz is not None:
            with fitz.open(path) as pdf:
                return max(1, pdf.page_count)
        if content_type.startswith("image/") and Image is not None:
            # open + verify to confirm the file is a valid image; verify() is
            # destructive so we open a fresh handle for it.
            with Image.open(path) as image:
                image.verify()
            return 1
        return 1

    def _extract_pdf_text(self, path: Path) -> str:
        if fitz is None:
            raise DocumentServiceError("PyMuPDF is not installed, so PDF extraction is unavailable.")
        with fitz.open(path) as pdf:
            return "\n\n".join(page.get_text("text").strip() for page in pdf if page.get_text("text").strip())

    def _image_placeholder(self, path: Path) -> str:
        # Validate the image is readable before raising the friendly error.
        if Image is not None:
            try:
                with Image.open(path) as image:
                    image.verify()
            except Exception:
                raise DocumentServiceError("The uploaded image file is corrupt or unreadable.")
        raise DocumentServiceError(
            "Image OCR requires a Tesseract integration. The upload is valid, but OCR is not configured yet."
        )

    def _extension_for_type(self, content_type: str) -> str:
        return {
            "application/pdf": ".pdf",
            "image/png": ".png",
            "image/jpeg": ".jpg",
        }.get(content_type, ".bin")
