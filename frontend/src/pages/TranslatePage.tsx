import { Languages } from "lucide-react";
import { TranslationPanel } from "../components/translation/TranslationPanel";
import { AudioPanel } from "../components/audio/AudioPanel";
import { useDocumentStore } from "../store/useDocumentStore";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

export function TranslatePage() {
  const originalText = useDocumentStore((state) => state.originalText);

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
            Once text is extracted, it will be available here for translation and audio.
          </p>
          <NavLink to="/" className="inline-flex items-center justify-center rounded-xl text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-glass">
            Go to Reader
          </NavLink>
        </div>
      )}
      
      {originalText && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 w-full">
          <TranslationPanel />
          <AudioPanel />
        </div>
      )}
    </motion.main>
  );
}
