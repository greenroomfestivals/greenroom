"use client";

import { Excalidraw, MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type {
  AppState,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types";
import React, { useCallback, useRef } from "react";
import {
  type ScratchpadKeyProps,
  useScratchpadStore,
} from "./useScratchpadStore";

// Simple debounce function
function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}

function createId() {
  return Math.random().toString(36).substring(2, 10);
}

function generateDefaultTableElements(codeLetters: string[]) {
  const elements: any[] = [];
  if (!codeLetters || codeLetters.length === 0) return elements;

  const colWidths = [140, 80, 80, 80, 80, 80, 120];
  const rowHeight = 60;
  const startX = 50;
  const startY = 50;

  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  const totalHeight = rowHeight * (codeLetters.length + 1);

  const baseElement = {
    version: 1,
    versionNonce: Math.floor(Math.random() * 1000000),
    isDeleted: false,
    fillStyle: "hachure",
    strokeWidth: 1,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    groupIds: [],
    roundness: null,
    seed: Math.floor(Math.random() * 1000000),
    strokeSharpness: "sharp",
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
  };

  // Outer rectangle
  elements.push({
    ...baseElement,
    id: createId(),
    type: "rectangle",
    x: startX,
    y: startY,
    width: totalWidth,
    height: totalHeight,
    strokeColor: "#1e1e1e",
    backgroundColor: "transparent",
    angle: 0,
    roundness: { type: 3 }, // slightly rounded
  });

  // Vertical lines
  let currentX = startX;
  for (let i = 0; i < colWidths.length - 1; i++) {
    currentX += colWidths[i];
    elements.push({
      ...baseElement,
      id: createId(),
      type: "line",
      x: currentX,
      y: startY,
      width: 0,
      height: totalHeight,
      strokeColor: "#1e1e1e",
      backgroundColor: "transparent",
      angle: 0,
      points: [[0, 0], [0, totalHeight]],
    });
  }

  // Horizontal lines
  let currentY = startY;
  for (let i = 0; i < codeLetters.length; i++) {
    currentY += rowHeight;
    elements.push({
      ...baseElement,
      id: createId(),
      type: "line",
      x: startX,
      y: currentY,
      width: totalWidth,
      height: 0,
      strokeColor: "#1e1e1e",
      backgroundColor: "transparent",
      angle: 0,
      points: [[0, 0], [totalWidth, 0]],
    });
  }

  const createText = (text: string, x: number, y: number, w: number, h: number) => {
    const estWidth = text.length * 12;
    const estHeight = 24;
    return {
      ...baseElement,
      id: createId(),
      type: "text",
      x: x + (w - estWidth) / 2,
      y: y + (h - estHeight) / 2,
      width: estWidth,
      height: estHeight,
      strokeColor: "#1e1e1e",
      backgroundColor: "transparent",
      angle: 0,
      text: text,
      fontSize: 20,
      fontFamily: 1, // Virgil
      textAlign: "center",
      verticalAlign: "middle",
      baseline: 18,
    };
  };

  // Header Texts
  elements.push(createText("CODE LETTER", startX, startY, colWidths[0], rowHeight));
  elements.push(createText("Total Scores", startX + totalWidth - colWidths[colWidths.length - 1], startY, colWidths[colWidths.length - 1], rowHeight));

  // Row Texts
  currentY = startY + rowHeight;
  codeLetters.forEach((code) => {
    elements.push(createText(code, startX, currentY, colWidths[0], rowHeight));
    currentY += rowHeight;
  });

  return elements;
}

interface ExcalidrawBoardProps extends ScratchpadKeyProps {
  isReadOnly?: boolean;
}

export default function ExcalidrawBoard(props: ExcalidrawBoardProps) {
  const { initialData, isLoading, saveToStorage } = useScratchpadStore(props);
  const excalidrawAPI = useRef<ExcalidrawImperativeAPI>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: debounce wrapping requires this
  const debouncedSave = useCallback(
    debounce((elements: readonly ExcalidrawElement[], appState: AppState) => {
      saveToStorage(elements, appState);
    }, 1000),
    [saveToStorage],
  );

  const onChange = (
    elements: readonly ExcalidrawElement[],
    appState: AppState,
  ) => {
    if (props.isReadOnly) return;
    debouncedSave(elements, appState);
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background text-muted-foreground">
        Loading Scratchpad...
      </div>
    );
  }

  const initialElements = 
    initialData?.elements && initialData.elements.length > 0
      ? initialData.elements
      : generateDefaultTableElements(props.codeLetters || []);

  return (
    <div className="h-full w-full excalidraw-wrapper relative">
      <style>{`
        /* Hide unwanted toolbar items via aria-labels and specific class names */
        .excalidraw-wrapper label[aria-label*="Diamond"],
        .excalidraw-wrapper label[aria-label*="Ellipse"],
        .excalidraw-wrapper label[aria-label*="Arrow"],
        .excalidraw-wrapper label[aria-label*="Line"],
        .excalidraw-wrapper label[aria-label*="Laser"],
        .excalidraw-wrapper label[aria-label*="Web embed"],
        .excalidraw-wrapper label[aria-label*="Frame"],
        .excalidraw-wrapper label[aria-label*="Magic frame"],
        .excalidraw-wrapper .layer-ui__library {
          display: none !important;
        }
      `}</style>
      {props.isReadOnly && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive backdrop-blur-md">
          Read-Only Mode
        </div>
      )}
      <Excalidraw
        excalidrawAPI={(api) => {
          excalidrawAPI.current = api;
        }}
        initialData={{
          elements: initialElements,
          appState: {
            ...initialData?.appState,
            activeTool: { type: "freedraw", customType: null, locked: false, lastActiveTool: null },
          },
          scrollToContent: true,
        }}
        UIOptions={{
          tools: {
            image: false,
          },
        }}
        onChange={onChange}
        viewModeEnabled={props.isReadOnly}
        theme="light"
      >
        <MainMenu>
          <MainMenu.DefaultItems.ClearCanvas />
        </MainMenu>
      </Excalidraw>
    </div>
  );
}
