import { useMutation } from "@tanstack/react-query";
import { Download, Play, Volume2 } from "lucide-react";
import { synthesizeSpeech } from "../../services/api";
import { useDocumentStore } from "../../store/useDocumentStore";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";
import { Slider } from "../ui/Slider";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { motion } from "framer-motion";

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
    <Card className="h-full flex flex-col shadow-glass border-border/60">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="flex items-center gap-2 text-xl tracking-tight">
            Audio
          </CardTitle>
          <p className="text-sm text-muted-foreground font-medium">Generate MP3 speech</p>
        </div>
        <div className="flex items-center justify-center h-10 w-10 bg-primary/10 text-primary rounded-full">
          <Volume2 size={20} />
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-col flex-1 p-6">
        <div className="flex flex-col gap-6 flex-1">
          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Voice
            </label>
            <Select 
              value={settings.voice} 
              onChange={(event) => updateSettings({ voice: event.target.value })}
            >
              {voices.map((voice) => (
                <option key={voice.id} value={voice.id}>{voice.label}</option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-4 bg-muted/20 p-5 rounded-xl border border-border/40">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Speed
              </label>
              <span className="text-sm font-bold text-primary tabular-nums bg-primary/10 px-2.5 py-0.5 rounded-full">
                {settings.playbackSpeed.toFixed(1)}x
              </span>
            </div>
            <Slider
              min={0.7}
              max={1.4}
              step={0.1}
              value={settings.playbackSpeed}
              onChange={(event) => updateSettings({ playbackSpeed: Number(event.target.value) })}
            />
          </div>

          <Button 
            className="w-full h-11 text-base font-semibold shadow-glass" 
            disabled={!speechText || ttsMutation.isPending} 
            isLoading={ttsMutation.isPending}
            onClick={() => ttsMutation.mutate()}
          >
            {!ttsMutation.isPending && <Play size={18} className="mr-2 fill-current" />}
            {ttsMutation.isPending ? "Generating Audio..." : "Generate MP3 Audio"}
          </Button>

          {audioUrl && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="mt-4 flex flex-col gap-4 p-5 bg-primary/5 rounded-xl border border-primary/20"
            >
              <audio 
                src={audioUrl} 
                controls 
                className="w-full h-12 rounded-lg"
              />
              <a 
                href={audioUrl} 
                download
                className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary h-10 px-4 py-2 border border-primary/20 bg-transparent hover:bg-primary/10 text-primary w-full"
              >
                <Download size={18} className="mr-2" />
                Download MP3
              </a>
            </motion.div>
          )}

          {ttsMutation.error && (
            <motion.p 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
              className="text-sm font-medium text-red-500 bg-red-500/10 p-3 rounded-md mt-4"
            >
              {ttsMutation.error.message}
            </motion.p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
