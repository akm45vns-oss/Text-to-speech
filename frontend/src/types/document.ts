export type LanguageCode = "auto" | "en" | "hi" | "fr" | "es" | "hi-Latn";

export type ReaderTheme = "system" | "light" | "dark";

export type WorkflowState = "idle" | "processing" | "ready" | "reading" | "listening" | "translating" | "translate_listen";

export interface DocumentStats {
  words: number;
  readingMinutes: number;
  listeningMinutes: number;
  detectedLanguage: string;
  confidence: string;
  processingTimeMs: number;
}

export interface DocumentRecord {
  id: string;
  filename: string;
  size: number;
  pages: number;
  language: string;
  createdAt: string;
}

export interface UploadResponse {
  documentId: string;
  filename: string;
  size: number;
  pages: number;
  language: string;
}

export interface OcrResponse {
  documentId: string;
  text: string;
  pages: number;
  language: string;
}

export interface TranslateResponse {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface TtsResponse {
  audioUrl: string;
  voice: string;
  durationEstimateSeconds: number;
}

export interface JobInitResponse {
  jobId: string;
}

export interface JobResponse {
  id: string;
  jobType: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  progress: number;
  totalChunks: number;
  completedChunks: number;
  resultData?: string | null;
  errorMessage?: string | null;
}

export interface ReaderSettings {
  theme: ReaderTheme;
  targetLanguage: LanguageCode;
  voice: string;
  playbackSpeed: number;
  fontSize: number;
  lineHeight: number;
  measure: number;
}
