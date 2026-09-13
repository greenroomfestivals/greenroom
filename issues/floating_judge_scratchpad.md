# Floating Judge Scratchpad

**Feature Description:**
The goal is to eliminate the need for judges to carry paper for temporary notes/calculations while judging. We will build a Floating Judge Scratchpad that lives directly inside the existing Judge Portal -> Scoring Screen.

It acts as a temporary digital working canvas.

**Requirements:**
- Powered by @excalidraw/excalidraw.
- Floating launcher (draggable pen/pencil icon) that snaps to edges.
- Does NOT refresh or navigate away from the scoring screen.
- Split View on Desktop/Tablet, Fullscreen on Mobile.
- Own 'Close' button (traps mobile back button).
- Infinite canvas with drawing, text, selection, and eraser tools.
- Undo/redo stack (up to 100 actions).
- Persisted locally via IndexedDB (localforage), auto-saved. Keyed by programme and judge mode.
- Locked (read-only) once judging is completed.
- Export to PNG/PDF.

**Dependencies:**
- @excalidraw/excalidraw`n- localforage (for IDB persistence)
- @dnd-kit/core (already installed, for draggable launcher)

**Tasks:**
1. Setup dependencies and lazy loading for Excalidraw.
2. Build floating launcher and overlay components.
3. Integrate Excalidraw component with localforage persistence.
4. Modify StagePortalScoringClient.tsx to include the launcher and scratchpad container.
5. Add text "⛶ Fullscreen" / "Exit Fullscreen" to the existing fullscreen action button.
6. Intercept submission flow to lock the scratchpad as read-only.