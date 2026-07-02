import { create } from "zustand";
import type { ReaderSettings, UploadResponse } from "../types/document";

interface DocumentState {
  activeDocument: UploadResponse | null;
  originalText: string;
  translatedText: string;
  audioUrl: string;
  settings: ReaderSettings;
  setActiveDocument: (document: UploadResponse | null) => void;
  setOriginalText: (text: string) => void;
  setTranslatedText: (text: string) => void;
  setAudioUrl: (audioUrl: string) => void;
  updateSettings: (settings: Partial<ReaderSettings>) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  activeDocument: null,
  originalText: "",
  translatedText: "",
  audioUrl: "",
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
}));
