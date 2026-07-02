import { UploadDropzone } from "../components/upload/UploadDropzone";
import { ReaderPane } from "../components/reader/ReaderPane";

export function ReaderPage() {
  return (
    <main className="reader-page" aria-label="Reader workspace">
      <UploadDropzone />
      <ReaderPane />
    </main>
  );
}
