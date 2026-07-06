import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Languages } from "lucide-react";
import { translateTextJob, getJobStatus } from "../../services/api";
import { useDocumentStore } from "../../store/useDocumentStore";
import type { LanguageCode } from "../../types/document";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { motion, AnimatePresence } from "framer-motion";
import { ProgressOverlay } from "../workflow/ProgressOverlay";

const languages: Array<{ code: LanguageCode; label: string }> = [
  { code: "hi-Latn", label: "Hinglish (Hindi in Latin)" },
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

  const [jobId, setJobId] = useState<string | null>(null);

  const translationMutation = useMutation({
    mutationFn: () => translateTextJob(originalText, settings.targetLanguage),
    onSuccess: (response) => {
      setJobId(response.jobId);
    },
  });

  const { data: jobStatus } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => getJobStatus(jobId!),
    enabled: !!jobId,
    // Polling every second until complete or failed
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 1000;
      if (data.status === "COMPLETED" || data.status === "FAILED") return false;
      return 1000;
    },
  });

  useEffect(() => {
    if (jobStatus?.status === "COMPLETED" && jobStatus.resultData) {
      setTranslatedText(jobStatus.resultData);
      const timer = setTimeout(() => setJobId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [jobStatus, setTranslatedText]);

  return (
    <Card className="h-full flex flex-col shadow-glass border-border/60 relative overflow-hidden">
      <AnimatePresence>
        {jobId && <ProgressOverlay job={jobStatus || null} title="Translating Document" />}
      </AnimatePresence>

      <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="flex items-center gap-2 text-xl tracking-tight">
            Translation
          </CardTitle>
          <p className="text-sm text-muted-foreground font-medium">Auto detect to selected language</p>
        </div>
        <div className="flex items-center justify-center h-10 w-10 bg-primary/10 text-primary rounded-full">
          <Languages size={20} />
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-col flex-1 p-6">
        <div className="flex flex-col gap-3 flex-1">
          <label className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Target Language
          </label>
          <Select 
            value={settings.targetLanguage} 
            onChange={(event) => updateSettings({ targetLanguage: event.target.value as LanguageCode })}
          >
            {languages.map((language) => (
              <option key={language.code} value={language.code}>{language.label}</option>
            ))}
          </Select>

          <Button 
            className="w-full mt-4 h-11 text-base font-semibold" 
            disabled={!originalText || translationMutation.isPending || !!jobId} 
            isLoading={translationMutation.isPending}
            onClick={() => translationMutation.mutate()}
          >
            {!translationMutation.isPending && <Languages size={18} className="mr-2" />}
            {translationMutation.isPending ? "Starting Job..." : "Translate Text"}
          </Button>

          <div 
            className="flex-1 mt-6 p-5 rounded-xl bg-muted/30 border border-border/50 text-foreground/90 font-medium whitespace-pre-wrap overflow-y-auto min-h-[250px] shadow-inner" 
            aria-live="polite"
          >
            {translatedText ? (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                {translatedText}
              </motion.div>
            ) : (
              <span className="text-muted-foreground italic flex items-center justify-center h-full">Translated text will appear here.</span>
            )}
          </div>
          
          {translationMutation.error && (
            <motion.p 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
              className="text-sm font-medium text-red-500 bg-red-500/10 p-3 rounded-md mt-4"
            >
              {translationMutation.error.message}
            </motion.p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
