import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  Headphones, 
  Globe, 
  Mic2, 
  FileText, 
  Clock, 
  Type, 
  CheckCircle2 
} from "lucide-react";
import { useDocumentStore } from "../../store/useDocumentStore";
import { Card } from "../ui/Card";

export function DocumentReadyScreen() {
  const navigate = useNavigate();
  const activeDocument = useDocumentStore((state) => state.activeDocument);
  const documentStats = useDocumentStore((state) => state.documentStats);
  const setWorkflowState = useDocumentStore((state) => state.setWorkflowState);
  const updateSettings = useDocumentStore((state) => state.updateSettings);

  if (!activeDocument || !documentStats) return null;

  const handleAction = (action: "read" | "listening" | "translating" | "translate_listen") => {
    if (action === "listening") {
      updateSettings({ targetLanguage: "auto" }); 
    }
    setWorkflowState(action === "read" ? "reading" : action);
    if (action !== "read") {
      navigate("/translate");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-5xl mx-auto py-12 px-4 flex flex-col gap-12"
    >
      <div className="flex flex-col items-center text-center gap-4">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
          className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-2"
        >
          <CheckCircle2 size={32} />
        </motion.div>
        <h1 className="text-4xl font-bold tracking-tight">Document Ready</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          We've successfully extracted the text from your document. Review the summary below and choose how you'd like to proceed.
        </p>
      </div>

      <Card className="p-8 shadow-glass bg-card/60 backdrop-blur-xl border-border/60">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 divide-x divide-border/40">
          <div className="flex flex-col gap-1 pl-4 lg:pl-0">
            <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <FileText size={16} /> Filename
            </span>
            <span className="font-medium truncate" title={activeDocument.filename}>
              {activeDocument.filename}
            </span>
          </div>
          <div className="flex flex-col gap-1 pl-4">
            <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <FileText size={16} /> Pages
            </span>
            <span className="font-medium">{activeDocument.pages}</span>
          </div>
          <div className="flex flex-col gap-1 pl-4">
            <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Type size={16} /> Words
            </span>
            <span className="font-medium">{documentStats.words.toLocaleString()}</span>
          </div>
          <div className="flex flex-col gap-1 pl-4">
            <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Globe size={16} /> Language
            </span>
            <span className="font-medium">
              {documentStats.detectedLanguage} <span className="text-xs text-muted-foreground">({documentStats.confidence})</span>
            </span>
          </div>
          <div className="flex flex-col gap-1 pl-4">
            <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Clock size={16} /> Read Time
            </span>
            <span className="font-medium">{documentStats.readingMinutes} min</span>
          </div>
          <div className="flex flex-col gap-1 pl-4">
            <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Headphones size={16} /> Listen Time
            </span>
            <span className="font-medium">{documentStats.listeningMinutes} min</span>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold tracking-tight text-center">What would you like to do?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ActionCard 
            icon={<BookOpen size={32} />}
            title="Read Document"
            description="Open the reader. No translation. No audio."
            onClick={() => handleAction("read")}
          />
          <ActionCard 
            icon={<Headphones size={32} />}
            title="Listen in Original"
            description="Generate speech directly from the extracted text."
            onClick={() => handleAction("listening")}
          />
          <ActionCard 
            icon={<Globe size={32} />}
            title="Translate Document"
            description="Translate the text. Open the translated reader."
            onClick={() => handleAction("translating")}
          />
          <ActionCard 
            icon={<Mic2 size={32} />}
            title="Translate & Listen"
            description="Translate the document and generate speech."
            onClick={() => handleAction("translate_listen")}
          />
        </div>
      </div>
    </motion.div>
  );
}

function ActionCard({ icon, title, description, onClick }: { icon: React.ReactNode, title: string, description: string, onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex flex-col items-center text-center gap-4 p-8 rounded-2xl bg-card border border-border/60 shadow-glass hover:shadow-lg hover:border-primary/50 transition-all group"
    >
      <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <div className="space-y-2">
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </motion.button>
  );
}
