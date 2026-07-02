import { useMutation } from "@tanstack/react-query";
import { FileImage, FileText, LoaderCircle, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { extractText, uploadDocument } from "../../services/api";
import { useDocumentStore } from "../../store/useDocumentStore";
import { formatBytes } from "../../utils/text";
import { StatusPill } from "../common/StatusPill";

const acceptedTypes = ["application/pdf", "image/png", "image/jpeg"];

export function UploadDropzone() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const setActiveDocument = useDocumentStore((state) => state.setActiveDocument);
  const setOriginalText = useDocumentStore((state) => state.setOriginalText);
  const activeDocument = useDocumentStore((state) => state.activeDocument);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!acceptedTypes.includes(file.type)) {
        throw new Error("Upload a PDF, PNG, JPG, or JPEG file.");
      }
      if (file.size > 25 * 1024 * 1024) {
        throw new Error("Keep files under 25 MB.");
      }

      const uploaded = await uploadDocument(file);
      const extracted = await extractText(uploaded.documentId);
      return { uploaded, extracted };
    },
    onSuccess: ({ uploaded, extracted }) => {
      setError("");
      setActiveDocument(uploaded);
      setOriginalText(extracted.text);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Upload failed."),
  });

  function handleFile(file?: File) {
    if (file) uploadMutation.mutate(file);
  }

  return (
    // id="upload" placed here so the nav anchor "#upload" scrolls to the dropzone
    <section id="upload">
      <div
        className={`dropzone ${dragging ? "dragging" : ""}`}
        onDragEnter={() => setDragging(true)}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handleFile(event.dataTransfer.files[0]);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          hidden
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
        <div className="upload-art" aria-hidden="true">
          <FileText />
          <FileImage />
        </div>
        <div>
          <h1>Read. Translate. Listen.</h1>
          <p>Drop a document here and ReadLingo opens it in a focused reader with translation and voice controls ready.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => inputRef.current?.click()}>
          {uploadMutation.isPending ? <LoaderCircle className="spin" size={18} /> : <UploadCloud size={18} />}
          {uploadMutation.isPending ? "Processing" : "Upload document"}
        </button>
        <div className="upload-meta">
          <StatusPill label="PDF" tone="success" />
          <StatusPill label="PNG" />
          <StatusPill label="JPG" />
          <StatusPill label="25 MB max" tone="warning" />
        </div>
      </div>
      {activeDocument && (
        <div className="file-strip" aria-live="polite">
          <span>{activeDocument.filename}</span>
          <span>{formatBytes(activeDocument.size)}</span>
          <span>{activeDocument.pages} page{activeDocument.pages === 1 ? "" : "s"}</span>
        </div>
      )}
      {error && <p className="error-text" role="alert">{error}</p>}
    </section>
  );
}
