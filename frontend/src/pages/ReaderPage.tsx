import { UploadDropzone } from "../components/upload/UploadDropzone";
import { ReaderPane } from "../components/reader/ReaderPane";
import { DocumentReadyScreen } from "../components/workflow/DocumentReadyScreen";
import { motion, AnimatePresence } from "framer-motion";
import { useDocumentStore } from "../store/useDocumentStore";

export function ReaderPage() {
  const workflowState = useDocumentStore((state) => state.workflowState);

  return (
    <main 
      className="flex flex-col flex-1 max-w-5xl mx-auto w-full relative" 
      aria-label="Reader workspace"
    >
      <AnimatePresence mode="wait">
        {(workflowState === "idle" || workflowState === "processing") && (
          <motion.div 
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 md:p-8"
          >
            <UploadDropzone />
          </motion.div>
        )}
        
        {workflowState === "ready" && (
          <motion.div 
            key="ready"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <DocumentReadyScreen />
          </motion.div>
        )}
        
        {workflowState === "reading" && (
          <motion.div 
            key="reading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 md:p-8 h-full flex flex-col flex-1"
          >
            <ReaderPane />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
