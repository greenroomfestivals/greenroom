import { PenTool, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/core/utils/cn";

interface FloatingLauncherProps {
  isOpen?: boolean;
  onClick: () => void;
}

export function FloatingLauncher({ isOpen, onClick }: FloatingLauncherProps) {
  const [position, setPosition] = useState({ x: 24, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const buttonStartPos = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const snapToEdge = (x: number, y: number) => {
      if (typeof window === "undefined") return { x, y };
      const padding = 24;
      const buttonSize = 56; // w-14 h-14 = 56px
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;

      let newX = x;
      let newY = y;

      if (x + buttonSize / 2 < screenW / 2) {
        newX = padding;
      } else {
        newX = screenW - buttonSize - padding;
      }

      newY = Math.max(padding, Math.min(newY, screenH - buttonSize - padding));
      return { x: newX, y: newY };
    };

    // Snap to the closest edge on mount or window resize.
    const handleResize = () => {
      setPosition((prev) => snapToEdge(prev.x, prev.y));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const snapToEdgeForDrag = (x: number, y: number) => {
    if (typeof window === "undefined") return { x, y };
    const padding = 24;
    const buttonSize = 56;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    let newX = x;
    let newY = y;
    if (x + buttonSize / 2 < screenW / 2) {
      newX = padding;
    } else {
      newX = screenW - buttonSize - padding;
    }
    newY = Math.max(padding, Math.min(newY, screenH - buttonSize - padding));
    return { x: newX, y: newY };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    hasDragged.current = false;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    buttonStartPos.current = { ...position };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasDragged.current = true;
    }
    setPosition({
      x: buttonStartPos.current.x + dx,
      y: buttonStartPos.current.y + dy,
    });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    // Snap to edge
    setPosition(snapToEdgeForDrag(position.x, position.y));

    if (!hasDragged.current) {
      onClick();
    }
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={cn(
        "fixed z-[100] flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform touch-none",
        isOpen
          ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
          : "bg-primary text-primary-foreground",
        isDragging
          ? "cursor-grabbing scale-105"
          : "cursor-pointer hover:scale-105",
        !isDragging && "transition-all duration-300 ease-out",
      )}
      style={{
        left: position.x,
        top: position.y,
      }}
      aria-label={isOpen ? "Close Scratchpad" : "Open Scratchpad"}
    >
      {isOpen ? <X className="h-6 w-6" /> : <PenTool className="h-6 w-6" />}
    </button>
  );
}
