import { create } from "zustand";
import type { ReaderSettings, UploadResponse, WorkflowState, DocumentStats } from "../types/document";

interface DocumentState {
  activeDocument: UploadResponse | null;
  originalText: string;
  translatedText: string;
  audioUrl: string;
  settings: ReaderSettings;
  workflowState: WorkflowState;
  documentStats: DocumentStats | null;
  setActiveDocument: (document: UploadResponse | null) => void;
  setOriginalText: (text: string) => void;
  setTranslatedText: (text: string) => void;
  setAudioUrl: (audioUrl: string) => void;
  updateSettings: (settings: Partial<ReaderSettings>) => void;
  setWorkflowState: (state: WorkflowState) => void;
  setDocumentStats: (stats: DocumentStats | null) => void;
  resetWorkflow: () => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  activeDocument: null,
  originalText: "",
  translatedText: "",
  audioUrl: "",
  workflowState: "idle",
  documentStats: null,
  settings: {
    theme: "system",
    targetLanguage: "hi",
    voice: "en-IN-NeerjaNeural",
    playbackSpeed: 1,
    fontSize: 18,
    lineHeight: 1.7,
    measure: 72,
  },
  setActiveDocument: (activeDocument) => set({ activeDocument }),
  setOriginalText: (originalText) => set({ originalText }),
  setTranslatedText: (translatedText) => set({ translatedText }),
  setAudioUrl: (audioUrl) => set({ audioUrl }),
  updateSettings: (settings) => set((state) => ({ settings: { ...state.settings, ...settings } })),
  setWorkflowState: (workflowState) => set({ workflowState }),
  setDocumentStats: (documentStats) => set({ documentStats }),
  resetWorkflow: () => set({ 
    activeDocument: null, 
    originalText: "", 
    translatedText: "", 
    audioUrl: "", 
    workflowState: "idle",
    documentStats: null
  }),
}));
