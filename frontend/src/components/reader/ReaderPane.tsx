import { Copy, Minus, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useDocumentStore } from "../../store/useDocumentStore";
import { estimateReadingMinutes, splitSentences } from "../../utils/text";
import { StatusPill } from "../common/StatusPill";

const sampleText = "Upload a PDF or image to begin. Extracted text appears here with reading controls, search, and synchronized sentence highlighting. The reader is tuned for long sessions with adjustable size, line height, and width.";

export function ReaderPane() {
  const originalText = useDocumentStore((state) => state.originalText);
  const settings = useDocumentStore((state) => state.settings);
  const updateSettings = useDocumentStore((state) => state.updateSettings);
  const [query, setQuery] = useState("");
  const text = originalText || sampleText;
  const sentences = useMemo(() => splitSentences(text), [text]);
  const readingMinutes = estimateReadingMinutes(text);

  const filteredSentences = query
    ? sentences.filter((sentence) => sentence.toLowerCase().includes(query.toLowerCase()))
    : sentences;

  return (
    <section className="reader-pane" id="reader">
      <div className="panel-header">
        <div>
          <h2>Reader</h2>
          <div className="header-pills">
            <StatusPill label={`${readingMinutes} min read`} />
            <StatusPill label={`${sentences.length} sentences`} />
          </div>
        </div>
        <div className="reader-actions">
          <label className="search-box">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search text" />
          </label>
          <button className="icon-button" type="button" aria-label="Copy text" title="Copy text" onClick={() => navigator.clipboard.writeText(text)}>
            <Copy size={18} />
          </button>
        </div>
      </div>

      <div className="settings-row" id="settings">
        <button className="icon-button" type="button" aria-label="Decrease font size" title="Decrease font size" onClick={() => updateSettings({ fontSize: Math.max(14, settings.fontSize - 1) })}>
          <Minus size={18} />
        </button>
        <input
          aria-label="Font size"
          type="range"
          min="14"
          max="28"
          value={settings.fontSize}
          onChange={(event) => updateSettings({ fontSize: Number(event.target.value) })}
        />
        <button className="icon-button" type="button" aria-label="Increase font size" title="Increase font size" onClick={() => updateSettings({ fontSize: Math.min(28, settings.fontSize + 1) })}>
          <Plus size={18} />
        </button>
        <label>
          Line
          <input
            type="range"
            min="1.3"
            max="2.1"
            step="0.1"
            value={settings.lineHeight}
            onChange={(event) => updateSettings({ lineHeight: Number(event.target.value) })}
          />
        </label>
      </div>

      <article
        className="reader-surface"
        style={{
          fontSize: `${settings.fontSize}px`,
          lineHeight: settings.lineHeight,
          maxWidth: `${settings.measure}ch`,
        }}
      >
        {filteredSentences.map((sentence, index) => (
          // Using index as key is correct here: sentences are re-derived from
          // the same source text on every render and are never individually
          // reordered or removed — so index is a stable, cheap identity.
          <p key={index} className={index === 0 ? "active-sentence" : undefined}>
            {sentence}
          </p>
        ))}
      </article>
    </section>
  );
}
