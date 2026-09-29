"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
  type Dispatch,
  type ReactNode,
} from "react";

import { initialState, wizardReducer, type WizardAction, type WizardState } from "./state";

// Drafts are saved server-side from Phase 2. Until then answers survive a refresh in
// localStorage. The state holds identifiers only, never credentials or secret values.
const STORAGE_KEY = "runway.wizard.v1";

type WizardContextValue = {
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
  error: string;
  setError: (message: string) => void;
};

const WizardContext = createContext<WizardContextValue | null>(null);

function load(): WizardState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<WizardState>;
    // Merge section by section so drafts from older builds pick up new fields.
    return {
      ...initialState,
      ...saved,
      access: { ...initialState.access, ...saved.access },
      repo: { ...initialState.repo, ...saved.repo },
      target: { ...initialState.target, ...saved.target },
      build: { ...initialState.build, ...saved.build },
      infra: { ...initialState.infra, ...saved.infra },
      pipe: { ...initialState.pipe, ...saved.pipe },
    };
  } catch {
    return null;
  }
}

// `restored` flips in the same dispatch that applies the saved draft. Saving waits for it:
// otherwise the first save would overwrite the draft with the initial state (and Strict Mode's
// second mount would then load that).
type Store = { state: WizardState; restored: boolean };
type StoreAction = WizardAction | { type: "loaded"; saved: WizardState | null };

function storeReducer(store: Store, action: StoreAction): Store {
  if (action.type === "loaded") return { state: action.saved ?? store.state, restored: true };
  return { ...store, state: wizardReducer(store.state, action) };
}

export function WizardProvider({ children }: { children: ReactNode }) {
  const [{ state, restored }, rawDispatch] = useReducer(storeReducer, {
    state: initialState,
    restored: false,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    rawDispatch({ type: "loaded", saved: load() });
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage can be unavailable (private mode, quota); the wizard still works without it.
    }
  }, [state, restored]);

  const dispatch = useCallback((action: WizardAction) => {
    // Any edit clears the footer error, as in the prototype.
    if (action.type !== "advance") setError("");
    rawDispatch(action);
  }, []);

  return (
    <WizardContext.Provider value={{ state, dispatch, error, setError }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used inside <WizardProvider>");
  return ctx;
}
