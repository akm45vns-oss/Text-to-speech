import { useMutation } from "@tanstack/react-query";
import { Download, Play, Pause, Square, Settings2, ArrowLeft } from "lucide-react";
import { synthesizeSpeech } from "../../services/api";
import { useDocumentStore } from "../../store/useDocumentStore";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";
import { Slider } from "../ui/Slider";
import { Card } from "../ui/Card";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../utils/cn";

const voices = [
  { id: "en-IN-NeerjaNeural", label: "Indian English Female" },
  { id: "en-IN-PrabhatNeural", label: "Indian English Male" },
  { id: "hi-IN-SwaraNeural", label: "Hindi Female" },
  { id: "fr-FR-DeniseNeural", label: "French Female" },
  { id: "es-ES-ElviraNeural", label: "Spanish Female" },
];

export function PremiumAudioPlayer() {
  const navigate = useNavigate();
  const originalText = useDocumentStore((state) => state.originalText);
  const translatedText = useDocumentStore((state) => state.translatedText);
  const audioUrl = useDocumentStore((state) => state.audioUrl);
  const settings = useDocumentStore((state) => state.settings);
  const updateSettings = useDocumentStore((state) => state.updateSettings);
  const setAudioUrl = useDocumentStore((state) => state.setAudioUrl);
  const workflowState = useDocumentStore((state) => state.workflowState);
  
  const speechText = (workflowState === "translate_listen" ? translatedText : originalText) || originalText;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const ttsMutation = useMutation({
    mutationFn: () => synthesizeSpeech(speechText, settings.voice, settings.playbackSpeed),
    onSuccess: (response) => {
      setAudioUrl(response.audioUrl);
      setIsPlaying(true);
    },
  });

  useEffect(() => {
    if (!audioUrl && speechText && !ttsMutation.isPending && !ttsMutation.isError) {
      ttsMutation.mutate();
    }
  }, [audioUrl, speechText, ttsMutation]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, audioUrl]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
      if (audioRef.current) {
        if (e.code === "ArrowRight") audioRef.current.currentTime += 5;
        if (e.code === "ArrowLeft") audioRef.current.currentTime -= 5;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  return (
    <Card className="flex flex-col w-full h-full shadow-glass border-border/60 overflow-hidden relative bg-card/80 backdrop-blur-3xl min-h-[600px]">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/40">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="shrink-0 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
        </Button>
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-xl font-bold tracking-tight">Audio Player</h2>
          <span className="text-sm font-medium text-muted-foreground">
            {workflowState === "translate_listen" ? "Translated Audio" : "Original Audio"}
          </span>
        </div>
        <Button 
          variant={showSettings ? "primary" : "ghost"} 
          size="icon" 
          onClick={() => setShowSettings(!showSettings)}
          className="shrink-0"
        >
          <Settings2 size={20} />
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row flex-1">
        
        {/* Main Player Area */}
        <div className="flex-1 flex flex-col p-8 lg:p-12 items-center justify-center relative">
          
          {/* Animated Waveform Visualization */}
          <div className="flex items-end justify-center gap-1.5 h-32 mb-12 w-full max-w-sm">
            {Array.from({ length: 40 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ height: 4 }}
                animate={{ 
                  height: isPlaying ? [4, Math.random() * 80 + 10, 4] : 4 
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.8 + Math.random() * 0.5,
                  ease: "easeInOut"
                }}
                className={cn("w-2 rounded-full", isPlaying ? "bg-primary" : "bg-muted-foreground/30")}
              />
            ))}
          </div>

          <div className="w-full max-w-md flex flex-col gap-8">
            {/* Scrubber */}
            <div className="flex flex-col gap-2">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full accent-primary h-2 bg-muted rounded-full appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm font-medium text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>-{formatTime(duration - currentTime)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6">
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={() => {
                  if (audioRef.current) audioRef.current.currentTime = 0;
                  setIsPlaying(false);
                }}
                disabled={!audioUrl}
              >
                <Square size={24} className="fill-current" />
              </Button>

              <Button
                size="icon"
                className="h-20 w-20 rounded-full shadow-glass"
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={!audioUrl || ttsMutation.isPending}
                isLoading={ttsMutation.isPending}
              >
                {!ttsMutation.isPending && (
                  isPlaying ? <Pause size={32} className="fill-current" /> : <Play size={32} className="fill-current ml-2" />
                )}
              </Button>

              {audioUrl ? (
                <a 
                  href={audioUrl} 
                  download 
                  className="inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary h-12 w-12 bg-transparent hover:bg-muted text-foreground"
                >
                  <Download size={24} />
                </a>
              ) : (
                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full" disabled>
                  <Download size={24} />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Settings Sidebar */}
        <AnimatePresence>
          {showSettings && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-border/40 bg-muted/10 overflow-hidden shrink-0"
            >
              <div className="p-6 flex flex-col gap-6 w-[320px]">
                <h3 className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Audio Settings</h3>
                
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-semibold">Voice Model</label>
                  <Select 
                    value={settings.voice} 
                    onChange={(e) => updateSettings({ voice: e.target.value })}
                  >
                    {voices.map((voice) => (
                      <option key={voice.id} value={voice.id}>{voice.label}</option>
                    ))}
                  </Select>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold">Playback Speed</label>
                    <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {settings.playbackSpeed.toFixed(1)}x
                    </span>
                  </div>
                  <Slider
                    min={0.7}
                    max={1.4}
                    step={0.1}
                    value={settings.playbackSpeed}
                    onChange={(e) => {
                      const speed = Number(e.target.value);
                      updateSettings({ playbackSpeed: speed });
                      if (audioRef.current) audioRef.current.playbackRate = speed;
                    }}
                  />
                </div>

                <Button 
                  variant="outline" 
                  className="mt-4 w-full"
                  onClick={() => ttsMutation.mutate()}
                  isLoading={ttsMutation.isPending}
                >
                  Regenerate Audio
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
