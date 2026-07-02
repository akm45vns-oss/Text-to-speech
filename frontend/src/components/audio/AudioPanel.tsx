import { useMutation } from "@tanstack/react-query";
import { Download, LoaderCircle, Play, Volume2 } from "lucide-react";
import { synthesizeSpeech } from "../../services/api";
import { useDocumentStore } from "../../store/useDocumentStore";

const voices = [
  { id: "en-IN-NeerjaNeural", label: "Indian English Female" },
  { id: "en-IN-PrabhatNeural", label: "Indian English Male" },
  { id: "hi-IN-SwaraNeural", label: "Hindi Female" },
  { id: "fr-FR-DeniseNeural", label: "French Female" },
  { id: "es-ES-ElviraNeural", label: "Spanish Female" },
];

export function AudioPanel() {
  const originalText = useDocumentStore((state) => state.originalText);
  const translatedText = useDocumentStore((state) => state.translatedText);
  const audioUrl = useDocumentStore((state) => state.audioUrl);
  const settings = useDocumentStore((state) => state.settings);
  const updateSettings = useDocumentStore((state) => state.updateSettings);
  const setAudioUrl = useDocumentStore((state) => state.setAudioUrl);
  const speechText = translatedText || originalText;

  const ttsMutation = useMutation({
    mutationFn: () => synthesizeSpeech(speechText, settings.voice, settings.playbackSpeed),
    onSuccess: (response) => setAudioUrl(response.audioUrl),
  });

  return (
    <section className="control-panel">
      <div className="panel-header compact">
        <div>
          <h2>Audio</h2>
          <p>Generate MP3 speech</p>
        </div>
        <Volume2 size={22} />
      </div>
      <label className="field-label">
        Voice
        <select value={settings.voice} onChange={(event) => updateSettings({ voice: event.target.value })}>
          {voices.map((voice) => (
            <option key={voice.id} value={voice.id}>{voice.label}</option>
          ))}
        </select>
      </label>
      <label className="field-label">
        Speed {settings.playbackSpeed.toFixed(1)}x
        <input
          type="range"
          min="0.7"
          max="1.4"
          step="0.1"
          value={settings.playbackSpeed}
          onChange={(event) => updateSettings({ playbackSpeed: Number(event.target.value) })}
        />
      </label>
      <button className="primary-button wide" type="button" disabled={!speechText || ttsMutation.isPending} onClick={() => ttsMutation.mutate()}>
        {ttsMutation.isPending ? <LoaderCircle className="spin" size={18} /> : <Play size={18} />}
        Generate audio
      </button>
      {audioUrl && (
        <div className="audio-box">
          <audio src={audioUrl} controls />
          <a className="secondary-button" href={audioUrl} download>
            <Download size={18} />
            Download MP3
          </a>
        </div>
      )}
      {ttsMutation.error && <p className="error-text">{ttsMutation.error.message}</p>}
    </section>
  );
}
