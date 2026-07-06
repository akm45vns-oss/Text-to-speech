import { BookOpenText, Languages, Moon, Sun } from "lucide-react";
import type { PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";
import { useDocumentStore } from "../../store/useDocumentStore";
import { Button } from "../ui/Button";
import { motion } from "framer-motion";

export function AppShell({ children }: PropsWithChildren) {
  const theme = useDocumentStore((state) => state.settings.theme);
  const updateSettings = useDocumentStore((state) => state.updateSettings);

  const effectiveTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300 pb-16 md:pb-0">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center px-4 md:px-8">
          <NavLink className="flex items-center gap-3 mr-6" to="/" aria-label="AKM45-Lingo home">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glass">
              <BookOpenText size={22} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold leading-none tracking-tight text-lg">AKM45-Lingo</span>
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Read & Translate</span>
            </div>
          </NavLink>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium ml-8" aria-label="Primary">
            <NavLink
              to="/"
              end
              className={({ isActive }) => 
                `flex items-center gap-2 transition-colors hover:text-foreground/80 ${isActive ? "text-foreground font-semibold" : "text-foreground/60"}`
              }
            >
              <BookOpenText size={16} />
              Reader
            </NavLink>
            <NavLink
              to="/translate"
              className={({ isActive }) => 
                `flex items-center gap-2 transition-colors hover:text-foreground/80 ${isActive ? "text-foreground font-semibold" : "text-foreground/60"}`
              }
            >
              <Languages size={16} />
              Translate
            </NavLink>
          </nav>

          <div className="ml-auto flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle dark mode"
              title="Toggle dark mode"
              className="relative rounded-full h-10 w-10"
              onClick={() => updateSettings({ theme: effectiveTheme === "dark" ? "light" : "dark" })}
            >
              <motion.div
                initial={false}
                animate={{ rotate: effectiveTheme === "dark" ? 0 : 90, scale: effectiveTheme === "dark" ? 1 : 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Moon size={20} />
              </motion.div>
              <motion.div
                initial={false}
                animate={{ rotate: effectiveTheme === "dark" ? -90 : 0, scale: effectiveTheme === "dark" ? 0 : 1 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Sun size={20} />
              </motion.div>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full h-full max-w-[1600px] mx-auto">
        {children}
      </main>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70 pb-safe" aria-label="Mobile navigation">
        <div className="flex items-center justify-around h-16 px-4">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${isActive ? "text-foreground font-semibold" : "text-muted-foreground"}`}
          >
            <BookOpenText size={22} />
            <span className="text-[10px] font-medium tracking-wide">Reader</span>
          </NavLink>
          <NavLink
            to="/translate"
            className={({ isActive }) => `flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${isActive ? "text-foreground font-semibold" : "text-muted-foreground"}`}
          >
            <Languages size={22} />
            <span className="text-[10px] font-medium tracking-wide">Translate</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
