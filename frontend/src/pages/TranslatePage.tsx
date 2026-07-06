import { Languages } from "lucide-react";
import { TranslationPanel } from "../components/translation/TranslationPanel";
import { PremiumAudioPlayer } from "../components/audio/PremiumAudioPlayer";
import { useDocumentStore } from "../store/useDocumentStore";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export function TranslatePage() {
  const originalText = useDocumentStore((state) => state.originalText);
  const workflowState = useDocumentStore((state) => state.workflowState);

  const showTranslate = workflowState === "translating" || workflowState === "idle" || workflowState === "ready";
  const showListen = workflowState === "listening" || workflowState === "translate_listen" || workflowState === "idle" || workflowState === "ready";

  return (
    <motion.main 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full" 
      aria-label="Translation workspace"
    >
      {!originalText && (
        <div className="flex flex-col items-center justify-center flex-1 min-h-[60vh] text-center max-w-md mx-auto">
          <div className="flex items-center justify-center w-24 h-24 bg-muted rounded-full mb-8 text-muted-foreground shadow-sm">
            <Languages size={48} strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-4">No document loaded</h2>
          <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
            Go to the <NavLink to="/" className="text-primary hover:underline font-medium">Reader</NavLink> and upload a PDF or image first.
            Once text is extracted, you can translate it and generate speech.
          </p>
          <NavLink to="/" className="inline-flex items-center justify-center rounded-xl text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-glass">
            Go to Reader
          </NavLink>
        </div>
      )}
      
      {originalText && (
        <div className={`grid gap-6 md:gap-8 w-full ${showTranslate && showListen ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"}`}>
          <AnimatePresence mode="popLayout">
            {showTranslate && (
              <motion.div 
                key="translate-panel"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={showListen && showTranslate ? "" : "max-w-4xl mx-auto w-full"}
              >
                <TranslationPanel />
              </motion.div>
            )}
            
            {showListen && (
              <motion.div 
                key="audio-panel"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={showListen && showTranslate ? "" : "max-w-4xl mx-auto w-full"}
              >
                <PremiumAudioPlayer />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.main>
  );
}
