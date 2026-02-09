import { useCallback, useRef, useSyncExternalStore } from "react";
import { DEFAULT_MODEL_ID } from "@/config/models";

const STORAGE_KEY = "draft-composer";

type DraftState = {
  text: string;
  modelId: string;
  webSearchEnabled: boolean;
};

const DEFAULT_DRAFT: DraftState = {
  text: "",
  modelId: DEFAULT_MODEL_ID,
  webSearchEnabled: false,
};

// --- Helpers ---

function readDraft(): DraftState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as DraftState;
    }
  } catch {
    // corrupted data, fall through
  }
  return DEFAULT_DRAFT;
}

function persistDraft(partial: Partial<DraftState>) {
  const current = readDraft();
  const next = { ...current, ...partial };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

// --- External store for settings (modelId, webSearchEnabled) ---
// Text is intentionally excluded from the reactive store to avoid
// re-render loops (text is written on every keystroke).

type SettingsState = {
  modelId: string;
  webSearchEnabled: boolean;
};

let settingsListeners: Array<() => void> = [];
let settingsCache: SettingsState | null = null;

function emitSettingsChange() {
  settingsCache = null; // bust cache
  for (const listener of settingsListeners) {
    listener();
  }
}

function subscribeSettings(listener: () => void) {
  settingsListeners = [...settingsListeners, listener];
  return () => {
    settingsListeners = settingsListeners.filter((l) => l !== listener);
  };
}

function getSettingsSnapshot(): SettingsState {
  if (settingsCache) return settingsCache;
  const draft = readDraft();
  settingsCache = {
    modelId: draft.modelId,
    webSearchEnabled: draft.webSearchEnabled,
  };
  return settingsCache;
}

const SERVER_SETTINGS_SNAPSHOT: SettingsState = {
  modelId: DEFAULT_DRAFT.modelId,
  webSearchEnabled: DEFAULT_DRAFT.webSearchEnabled,
};

function getSettingsServerSnapshot(): SettingsState {
  return SERVER_SETTINGS_SNAPSHOT;
}

// --- Debounced text writer ---

let textDebounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Write text to localStorage with debounce. Does NOT trigger any React
 * re-renders — the text value is "fire and forget" into storage.
 */
function debouncedSetText(text: string, delayMs = 300) {
  if (textDebounceTimer) {
    clearTimeout(textDebounceTimer);
  }
  textDebounceTimer = setTimeout(() => {
    persistDraft({ text });
    textDebounceTimer = null;
  }, delayMs);
}

/** Flush any pending debounced text write immediately. */
function flushText() {
  if (textDebounceTimer) {
    clearTimeout(textDebounceTimer);
    textDebounceTimer = null;
  }
}

// --- Hook ---

export function useDraftInput() {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getSettingsServerSnapshot,
  );

  // Read initial text once on first render (not reactive).
  const initialTextRef = useRef<string | null>(null);
  if (initialTextRef.current === null) {
    initialTextRef.current = readDraft().text;
  }

  const setText = useCallback((text: string) => {
    debouncedSetText(text);
  }, []);

  const setModelId = useCallback((modelId: string) => {
    persistDraft({ modelId });
    emitSettingsChange();
  }, []);

  const setWebSearchEnabled = useCallback((webSearchEnabled: boolean) => {
    persistDraft({ webSearchEnabled });
    emitSettingsChange();
  }, []);

  const clear = useCallback(() => {
    flushText();
    persistDraft({ text: "" });
    // No emitSettingsChange — text is not part of the reactive store.
  }, []);

  return {
    /** Initial text value — read once, not reactive. Use as initialInput. */
    initialText: initialTextRef.current,
    modelId: settings.modelId,
    webSearchEnabled: settings.webSearchEnabled,
    setText,
    setModelId,
    setWebSearchEnabled,
    clear,
  };
}
