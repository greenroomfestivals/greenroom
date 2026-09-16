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
  const onCloseRef = React.useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Trap back button on mobile
  useEffect(() => {
    // Push a dummy state so the physical back button doesn`t leave the scoring page
    window.history.pushState(null, "", window.location.href);

    const handlePopState = (_e: PopStateEvent) => {
      // User pressed back, close the overlay instead of navigating
      onCloseRef.current();
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex h-[100dvh] w-full flex-col bg-background lg:static lg:z-auto lg:h-full lg:w-[40%] xl:w-[50%] lg:shrink-0 lg:border-l lg:border-border">
      <div className="flex-1 overflow-hidden relative">
        <ExcalidrawBoard {...keyProps} isReadOnly={isReadOnly} />
      </div>
    </div>
  );
}
