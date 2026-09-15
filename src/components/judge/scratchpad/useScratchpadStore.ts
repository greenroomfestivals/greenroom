import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { AppState } from "@excalidraw/excalidraw/types";
import localforage from "localforage";
import { useCallback, useEffect, useState } from "react";

export type ScratchpadKeyProps = {
  configId: string;
  programmeId: string;
  judgeMode: "SINGLE" | "GROUP";
  judgeId?: string;
  codeLetters?: string[];
};

export function getScratchpadKey(props: ScratchpadKeyProps) {
  const { configId, programmeId, judgeMode, judgeId } = props;
  const id = judgeMode === "GROUP" ? "group" : judgeId;
  return `scratchpad_${configId}_${programmeId}_${id}`;
}

export function useScratchpadStore(props: ScratchpadKeyProps) {
  const [initialData, setInitialData] = useState<{
    elements: readonly ExcalidrawElement[];
    appState?: Partial<AppState>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const key = getScratchpadKey(props);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    localforage
      .getItem<{
        elements: readonly ExcalidrawElement[];
        appState?: Partial<AppState>;
      }>(key)
      .then((data) => {
        if (mounted) {
          setInitialData(data || { elements: [] });
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load scratchpad state", err);
        if (mounted) {
          setInitialData({ elements: [] });
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [key]);

  const saveToStorage = useCallback(
    (elements: readonly ExcalidrawElement[], appState: AppState) => {
      // Pick minimal app state to save (like view config) if needed, or just elements.
      const stateToSave = {
        elements,
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
        },
      };
      localforage.setItem(key, stateToSave).catch((err) => {
        console.error("Failed to save scratchpad state", err);
      });
    },
    [key],
  );

  return { initialData, isLoading, saveToStorage };
}
