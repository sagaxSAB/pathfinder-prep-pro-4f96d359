import { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";

export const PageShell = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>{children}</main>
      <footer className="border-t border-border/60 mt-24">
        <div className="container py-8 text-sm text-muted-foreground flex items-center justify-between">
          <span>© Helm — your AI career co-pilot</span>
          <span>Built with Lovable Cloud + AI</span>
        </div>
      </footer>
    </div>
  );
};
