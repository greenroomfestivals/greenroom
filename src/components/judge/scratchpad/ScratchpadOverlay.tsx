import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";
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

  return (
    <div className="fixed inset-0 z-50 flex h-[100dvh] w-full flex-col bg-background xl:static xl:z-auto xl:h-full xl:w-[var(--split-right)] xl:shrink-0 xl:border-l xl:border-border">
      <div className="flex-1 overflow-hidden relative">
        <ExcalidrawBoard {...keyProps} isReadOnly={isReadOnly} />
      </div>
    </div>
  );
}
