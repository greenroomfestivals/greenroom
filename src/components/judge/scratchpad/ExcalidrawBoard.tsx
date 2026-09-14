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
          elements: initialData?.elements,
          appState: {
            ...initialData?.appState,
            activeTool: {
              type: "freedraw",
              customType: null,
              locked: false,
              lastActiveTool: null,
            },
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
