import { BookOpenText, Languages, Moon, Sun } from "lucide-react";
import type { PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";
import { useDocumentStore } from "../../store/useDocumentStore";

export function AppShell({ children }: PropsWithChildren) {
  const theme = useDocumentStore((state) => state.settings.theme);
  const updateSettings = useDocumentStore((state) => state.updateSettings);

  // Resolve the effective theme for the toggle icon
  const effectiveTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/" aria-label="ReadLingo AI home">
          <span className="brand-mark">
            <BookOpenText size={22} />
          </span>
          <span>
            <strong>ReadLingo AI</strong>
            <small>Read, translate, listen</small>
          </span>
        </NavLink>

        <nav className="desktop-nav" aria-label="Primary">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}
          >
            <BookOpenText size={18} />
            Reader
          </NavLink>
          <NavLink
            to="/translate"
            className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}
          >
            <Languages size={18} />
            Translate
          </NavLink>
        </nav>

        <button
          className="icon-button"
          type="button"
          aria-label="Toggle dark mode"
          title="Toggle dark mode"
          onClick={() =>
            updateSettings({ theme: effectiveTheme === "dark" ? "light" : "dark" })
          }
        >
          {effectiveTheme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      {children}

      {/* Mobile bottom navigation */}
      <nav className="bottom-nav" aria-label="Mobile navigation">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `bottom-nav-link ${isActive ? "bottom-nav-link--active" : ""}`}
        >
          <BookOpenText size={20} />
          <span>Reader</span>
        </NavLink>
        <NavLink
          to="/translate"
          className={({ isActive }) => `bottom-nav-link ${isActive ? "bottom-nav-link--active" : ""}`}
        >
          <Languages size={20} />
          <span>Translate</span>
        </NavLink>
      </nav>
    </div>
  );
}
