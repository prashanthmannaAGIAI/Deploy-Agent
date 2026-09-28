import { act, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { expect, test } from "vitest";

import { initialState } from "./state";
import { useWizard, WizardProvider } from "./wizard-context";

const KEY = "runway.wizard.v1";

function Probe() {
  const { state, dispatch } = useWizard();
  return (
    <>
      <output data-testid="repo">{state.repo.name}</output>
      <button
        onClick={() => dispatch({ type: "patch", section: "repo", values: { name: "acme/new" } })}
      >
        change
      </button>
    </>
  );
}

test("a saved draft survives mounting under Strict Mode (effects run twice)", async () => {
  localStorage.setItem(
    KEY,
    JSON.stringify({ ...initialState, repo: { ...initialState.repo, name: "acme/payments-api" } }),
  );

  render(
    <StrictMode>
      <WizardProvider>
        <Probe />
      </WizardProvider>
    </StrictMode>,
  );

  expect(await screen.findByText("acme/payments-api")).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem(KEY)!).repo.name).toBe("acme/payments-api");
});

test("edits are saved", async () => {
  render(
    <WizardProvider>
      <Probe />
    </WizardProvider>,
  );
  await act(async () => screen.getByText("change").click());
  expect(JSON.parse(localStorage.getItem(KEY)!).repo.name).toBe("acme/new");
});

test("a corrupt draft is ignored", () => {
  localStorage.setItem(KEY, "{not json");
  render(
    <WizardProvider>
      <Probe />
    </WizardProvider>,
  );
  expect(screen.getByTestId("repo")).toHaveTextContent("");
});
