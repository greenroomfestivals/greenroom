"use client";

import { Excalidraw, MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import type {
  AppState,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types/types";
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
          appState: initialData?.appState,
          scrollToContent: true,
        }}
        onChange={onChange}
        viewModeEnabled={props.isReadOnly}
        theme="light"
      >
        <WelcomeScreen>
          <WelcomeScreen.Hints.ToolbarHint />
          <WelcomeScreen.Hints.MenuHint />
        </WelcomeScreen>
        <MainMenu>
          <MainMenu.DefaultItems.ClearCanvas />
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.DefaultItems.Export />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
        </MainMenu>
      </Excalidraw>
    </div>
  );
}
