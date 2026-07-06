import { motion } from "framer-motion";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import type { JobResponse } from "../../types/document";
import { Card } from "../ui/Card";

interface ProgressOverlayProps {
  job: JobResponse | null;
  title: string;
}

export function ProgressOverlay({ job, title }: ProgressOverlayProps) {
  if (!job) return null;

  const isFailed = job.status === "FAILED";
  const isCompleted = job.status === "COMPLETED";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    >
      <Card className="w-full max-w-lg p-8 flex flex-col gap-6 shadow-2xl border-primary/20 bg-card">
        <div className="flex flex-col items-center text-center gap-4">
          {isCompleted ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center"
            >
              <CheckCircle2 size={32} />
            </motion.div>
          ) : isFailed ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center"
            >
              <AlertCircle size={32} />
            </motion.div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Loader2 size={32} className="animate-spin" />
            </div>
          )}

          <div>
            <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {isCompleted ? "Completed successfully." : isFailed ? "An error occurred." : "Processing large document in the background..."}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm font-semibold">
            <span className={isFailed ? "text-red-500" : "text-primary"}>
              {isFailed ? "Failed" : `${Math.round(job.progress)}%`}
            </span>
            <span className="text-muted-foreground">
              Chunk {job.completedChunks} / {job.totalChunks || "?"}
            </span>
          </div>
          <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${isFailed ? "bg-red-500" : "bg-primary"}`}
              initial={{ width: 0 }}
              animate={{ width: `${job.progress}%` }}
              transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            />
          </div>
        </div>

        {isFailed && job.errorMessage && (
          <div className="bg-red-500/10 text-red-500 p-4 rounded-xl text-sm font-medium">
            {job.errorMessage}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
