import { Languages } from "lucide-react";
import { TranslationPanel } from "../components/translation/TranslationPanel";
import { AudioPanel } from "../components/audio/AudioPanel";
import { useDocumentStore } from "../store/useDocumentStore";

export function TranslatePage() {
  const originalText = useDocumentStore((state) => state.originalText);

  return (
    <main className="translate-page" aria-label="Translation workspace">
      {!originalText && (
        <div className="translate-empty">
          <div className="translate-empty-icon">
            <Languages size={40} />
          </div>
          <h2>No document loaded</h2>
          <p>
            Go to the <a href="/">Reader page</a> and upload a PDF or image first.
            Once text is extracted it will be available here for translation and audio.
          </p>
        </div>
      )}
      <div className="translate-grid">
        <TranslationPanel />
        <AudioPanel />
      </div>
    </main>
  );
}
