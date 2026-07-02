import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { ReaderPage } from "./pages/ReaderPage";
import { TranslatePage } from "./pages/TranslatePage";
import { useDocumentStore } from "./store/useDocumentStore";

export default function App() {
  const theme = useDocumentStore((state) => state.settings.theme);

  useEffect(() => {
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const applySystemTheme = (mq: MediaQueryList | MediaQueryListEvent) => {
        document.documentElement.dataset.theme = mq.matches ? "dark" : "light";
      };
      applySystemTheme(mediaQuery);
      mediaQuery.addEventListener("change", applySystemTheme);
      return () => mediaQuery.removeEventListener("change", applySystemTheme);
    } else {
      document.documentElement.dataset.theme = theme;
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<ReaderPage />} />
          <Route path="/translate" element={<TranslatePage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
