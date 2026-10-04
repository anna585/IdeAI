import type { ReactNode } from "react";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <a aria-label="IdeAI home" className="brand" href="/">
          <span aria-hidden="true" className="brand-mark">
            ✳
          </span>
          <span>IdeAI</span>
        </a>
        <div className="topbar-note">
          <span className="status-dot" />
          Your space, in sync
        </div>
      </header>
      <main className="main-content">{children}</main>
    </div>
  );
}
