"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Note } from "@/components/ui/note";
import { cn } from "@/lib/utils";

import { STEPS } from "./catalogue";
import { SpecPanel } from "./spec-panel";
import { STEP_VIEWS } from "./steps";
import { firstInvalidStep, validateStep } from "./validation";
import { useWizard, WizardProvider } from "./wizard-context";

function Rail() {
  const { state, dispatch } = useWizard();
  return (
    <aside
      aria-label="Steps"
      className="border-line bg-surface px-3 py-6 min-[821px]:border-r max-[820px]:overflow-x-auto max-[820px]:border-b max-[820px]:p-2.5"
    >
      <ol className="m-0 grid list-none gap-0.5 p-0 max-[820px]:flex max-[820px]:gap-1">
        {STEPS.map((name, i) => {
          const done = i < state.step && i <= state.furthest;
          const current = i === state.step;
          return (
            <li key={name}>
              <button
                type="button"
                disabled={i > state.furthest}
                aria-current={current ? "step" : undefined}
                onClick={() => dispatch({ type: "goTo", step: i })}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 rounded-lg border-0 bg-transparent px-2.5 py-[9px] text-left font-medium whitespace-nowrap text-muted enabled:hover:bg-surface-2 disabled:cursor-default disabled:opacity-55",
                  current && "bg-accent-soft text-ink enabled:hover:bg-accent-soft",
                )}
              >
                <span
                  className={cn(
                    "grid size-6 flex-none place-items-center rounded-full border-[1.5px] border-line-2 text-xs",
                    done && "border-ok bg-ok text-white",
                    current && "border-accent text-accent",
                  )}
                >
                  {done ? "✓" : i + 1}
                </span>
                {name}
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

function WizardBody() {
  const { state, dispatch, error, setError } = useWizard();
  const [specOpen, setSpecOpen] = useState(false);
  const [deployNote, setDeployNote] = useState(false);
  const StepView = STEP_VIEWS[state.step];
  const last = state.step === STEPS.length - 1;

  const next = () => {
    const message = validateStep(state);
    setError(message);
    if (message) return;
    dispatch({ type: "advance" });
    window.scrollTo(0, 0);
  };

  const deploy = () => {
    const invalid = firstInvalidStep(state);
    if (invalid >= 0 && invalid < state.step) {
      dispatch({ type: "goTo", step: invalid });
      setError(validateStep(state, invalid));
      return;
    }
    const message = validateStep(state);
    setError(message);
    setDeployNote(!message);
  };

  return (
    <div className="grid min-h-[calc(100vh-56px)] grid-cols-[230px_minmax(0,1fr)_400px] max-[1180px]:grid-cols-[210px_minmax(0,1fr)] max-[820px]:grid-cols-1">
      <Rail />
      <main className="w-full max-w-[820px] px-[clamp(20px,4vw,48px)] pt-8 pb-12">
        <StepView />
        {last && deployNote && (
          <Note kind="ok" className="mt-5" role="status">
            <b className="font-medium">Your deploy spec is complete.</b> Deployments start from here
            in Phase 5; drafts are saved to your project in Phase 2.
          </Note>
        )}
        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-5">
          {state.step > 0 && (
            <Button
              onClick={() => {
                setDeployNote(false);
                dispatch({ type: "back" });
                window.scrollTo(0, 0);
              }}
            >
              Back
            </Button>
          )}
          <p
            role="alert"
            data-testid="step-error"
            className="m-0 min-w-[200px] flex-1 text-sm font-medium text-err"
          >
            {error}
          </p>
          <Button
            variant="ghost"
            className="min-[1181px]:hidden"
            onClick={() => setSpecOpen((o) => !o)}
          >
            View spec
          </Button>
          {last ? (
            <Button variant="primary" onClick={deploy}>
              Deploy to {state.target.env}
            </Button>
          ) : (
            <Button variant="primary" onClick={next}>
              Continue
            </Button>
          )}
        </div>
      </main>
      <SpecPanel open={specOpen} onClose={() => setSpecOpen(false)} />
    </div>
  );
}

export function Wizard() {
  return (
    <WizardProvider>
      <WizardBody />
    </WizardProvider>
  );
}
