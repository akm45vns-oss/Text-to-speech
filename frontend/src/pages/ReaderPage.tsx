import { UploadDropzone } from "../components/upload/UploadDropzone";
import { ReaderPane } from "../components/reader/ReaderPane";
import { motion } from "framer-motion";

export function ReaderPage() {
  return (
    <motion.main 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-8 p-4 md:p-8 flex-1 max-w-5xl mx-auto w-full" 
      aria-label="Reader workspace"
    >
      <UploadDropzone />
      <ReaderPane />
    </motion.main>
  );
}
