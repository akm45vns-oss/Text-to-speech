import { useMutation } from "@tanstack/react-query";
import { Languages, LoaderCircle } from "lucide-react";
import { translateText } from "../../services/api";
import { useDocumentStore } from "../../store/useDocumentStore";
import type { LanguageCode } from "../../types/document";

const languages: Array<{ code: LanguageCode; label: string }> = [
  { code: "hi", label: "Hindi" },
  { code: "en", label: "English" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
];

export function TranslationPanel() {
  const originalText = useDocumentStore((state) => state.originalText);
  const translatedText = useDocumentStore((state) => state.translatedText);
  const settings = useDocumentStore((state) => state.settings);
  const updateSettings = useDocumentStore((state) => state.updateSettings);
  const setTranslatedText = useDocumentStore((state) => state.setTranslatedText);

  const translationMutation = useMutation({
    mutationFn: () => translateText(originalText, settings.targetLanguage),
    onSuccess: (response) => setTranslatedText(response.translatedText),
  });

  return (
    <section className="control-panel" id="translate">
      <div className="panel-header compact">
        <div>
          <h2>Translation</h2>
          <p>Auto detect to selected language</p>
        </div>
        <Languages size={22} />
      </div>
      <label className="field-label">
        Language
        <select value={settings.targetLanguage} onChange={(event) => updateSettings({ targetLanguage: event.target.value as LanguageCode })}>
          {languages.map((language) => (
            <option key={language.code} value={language.code}>{language.label}</option>
          ))}
        </select>
      </label>
      <button className="primary-button wide" type="button" disabled={!originalText || translationMutation.isPending} onClick={() => translationMutation.mutate()}>
        {translationMutation.isPending ? <LoaderCircle className="spin" size={18} /> : <Languages size={18} />}
        Translate
      </button>
      <div className="translated-box" aria-live="polite">
        {translatedText || "Translated text will appear here."}
      </div>
      {translationMutation.error && <p className="error-text">{translationMutation.error.message}</p>}
    </section>
  );
}
