import { Copy, Search, Type, AlignLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { useDocumentStore } from "../../store/useDocumentStore";
import { estimateReadingMinutes, splitSentences } from "../../utils/text";
import { Button } from "../ui/Button";
import { Slider } from "../ui/Slider";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { motion } from "framer-motion";

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
    <Card className="w-full flex flex-col relative overflow-visible shadow-glass border-border/60" id="reader">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 bg-card/90 backdrop-blur sticky top-16 z-40 rounded-t-xl py-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-xl flex items-center gap-2 tracking-tight">
            Reader
          </CardTitle>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mt-1">
            <span className="px-2 py-0.5 rounded-full bg-muted border border-border/50">{readingMinutes} min read</span>
            <span className="px-2 py-0.5 rounded-full bg-muted border border-border/50">{sentences.length} sentences</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              value={query} 
              onChange={(event) => setQuery(event.target.value)} 
              placeholder="Search text..." 
              className="w-full h-9 pl-9 pr-4 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/70"
            />
          </div>
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground" aria-label="Copy text" title="Copy text" onClick={() => navigator.clipboard.writeText(text)}>
            <Copy size={16} />
          </Button>
        </div>
      </CardHeader>

      <div className="flex flex-col sm:flex-row items-center gap-8 p-4 border-b border-border/40 bg-muted/20">
        <div className="flex items-center gap-4 w-full sm:w-1/2">
          <Type size={16} className="text-muted-foreground shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-12 shrink-0">Size</span>
          <Slider
            min={14}
            max={28}
            step={1}
            value={settings.fontSize}
            onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
            className="flex-1"
          />
          <span className="text-xs font-medium w-10 text-right tabular-nums">{settings.fontSize}px</span>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-1/2">
          <AlignLeft size={16} className="text-muted-foreground shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-16 shrink-0">Spacing</span>
          <Slider
            min={1.3}
            max={2.1}
            step={0.1}
            value={settings.lineHeight}
            onChange={(e) => updateSettings({ lineHeight: Number(e.target.value) })}
            className="flex-1"
          />
          <span className="text-xs font-medium w-8 text-right tabular-nums">{settings.lineHeight}</span>
        </div>
      </div>

      <CardContent className="p-6 md:p-12 min-h-[50vh]">
        <article
          className="mx-auto transition-all duration-300 ease-in-out text-foreground/90 font-medium"
          style={{
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
            maxWidth: `${settings.measure}ch`,
          }}
        >
          {filteredSentences.map((sentence, index) => (
            <motion.p 
              key={index} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(index * 0.01, 0.5) }}
              className={`mb-4 transition-all duration-200 ${
                index === 0 ? "bg-primary/10 text-foreground rounded-lg border-l-4 border-primary pl-4 py-2 shadow-sm font-semibold" : "hover:text-foreground"
              }`}
            >
              {sentence}
            </motion.p>
          ))}
          {filteredSentences.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-12 text-muted-foreground">
              <Search size={32} className="mb-4 opacity-20" />
              <p className="italic">No results found for "{query}"</p>
            </div>
          )}
        </article>
      </CardContent>
    </Card>
  );
}
