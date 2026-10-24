"use client";

/**
 * Sun/moon theme switch, fixed to the top-right of every page. The choice is a per-browser
 * convenience saved in localStorage; the icon itself is pure CSS (`dark:`), so it is right on
 * first paint with no hydration flicker.
 */
export function ThemeToggle() {
  function toggle() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Private mode / blocked storage: the switch still works for this page view.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch between light and dark theme"
      title="Switch theme"
      className="fixed right-3 top-3 z-50 grid h-11 w-11 place-items-center rounded-full border border-border bg-surface text-text shadow-card hover:bg-surface-2"
    >
      {/* Moon in light mode (go dark), sun in dark mode (go light). */}
      <svg viewBox="0 0 24 24" className="h-5 w-5 dark:hidden" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
      <svg viewBox="0 0 24 24" className="hidden h-5 w-5 dark:block" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
