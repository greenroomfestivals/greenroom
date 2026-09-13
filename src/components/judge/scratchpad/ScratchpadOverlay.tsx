import { X } from "lucide-react";
import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/core/utils/cn";
import type { ScratchpadKeyProps } from "./useScratchpadStore";

const ExcalidrawBoard = dynamic(() => import("./ExcalidrawBoard"), {
  ssr: false,
});

interface ScratchpadOverlayProps extends ScratchpadKeyProps {
  onClose: () => void;
  isReadOnly?: boolean;
}

export function ScratchpadOverlay({
  onClose,
  isReadOnly,
  ...keyProps
}: ScratchpadOverlayProps) {
  // Trap back button on mobile
  useEffect(() => {
    // Push a dummy state so the physical back button doesn`t leave the scoring page
    window.history.pushState(null, "", window.location.href);

    const handlePopState = (_e: PopStateEvent) => {
      // User pressed back, close the overlay instead of navigating
      onClose();
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [onClose]);

  // Use a split-view pattern for md+ screens, fullscreen for smaller.
  // Actually, wait, the easiest way to do split view is to place this alongside the Scoring UI.
  // If we want it as an overlay that animates in from the side:
  return (
    <div className="fixed inset-0 z-50 flex h-[100dvh] w-screen bg-background/50 backdrop-blur-sm sm:justify-end">
      {/* Mobile: Fullscreen. Desktop: Split view taking up 50-70% of screen */}
      <div
        className={cn(
          "relative flex h-full w-full flex-col bg-background shadow-2xl transition-all duration-300 ease-in-out",
          "sm:w-[60vw] md:w-[50vw] lg:w-[60vw] sm:border-l sm:border-border",
        )}
      >
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-heading">
              Judge Scratchpad
            </span>
            {isReadOnly && (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                Read-Only
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close Scratchpad"
          >
            <X className="h-5 w-5" />
          </Button>
        </header>

        <div className="flex-1 overflow-hidden relative">
          <ExcalidrawBoard {...keyProps} isReadOnly={isReadOnly} />
        </div>
      </div>
    </div>
  );
}
