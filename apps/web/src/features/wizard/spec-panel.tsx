"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { lineText, specLines, UNSET, type SpecLine } from "./spec-yaml";
import { specComments, toSpec } from "./to-spec";
import { useWizard } from "./wizard-context";

function Line({ line }: { line: SpecLine }) {
  return (
    <>
      {line.indent}
      {line.bullet && <span className="text-muted">{line.bullet}</span>}
      <span className="text-muted">{line.key}:</span>
      {line.unset ? (
        <span className="text-muted italic opacity-70"> {UNSET}</span>
      ) : (
        line.value !== undefined && <span className="text-ink"> {line.value}</span>
      )}
      {line.comment && <span className="text-muted italic">{`  # ${line.comment}`}</span>}
    </>
  );
}

/**
 * Tracks a generation number per line. A line whose text changed gets a new generation, which
 * changes its React key and replays the "fresh" highlight animation. Uses React's "store
 * information from previous renders" pattern (state updated during render).
 */
function useLineGenerations(texts: string[]): number[] {
  const [tracked, setTracked] = useState({ texts, gens: texts.map(() => 0) });
  if (tracked.texts !== texts) {
    const gens = texts.map((t, i) =>
      tracked.texts[i] === t ? (tracked.gens[i] ?? 0) : (tracked.gens[i] ?? 0) + 1,
    );
    setTracked({ texts, gens });
    return gens;
  }
  return tracked.gens;
}

export function SpecPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useWizard();
  const lines = useMemo(() => specLines(toSpec(state), specComments(state)), [state]);
  const texts = useMemo(() => lines.map(lineText), [lines]);
  const gens = useLineGenerations(texts);

  return (
    <aside
      aria-label="Deploy spec"
      className={cn(
        "flex-col border-line bg-surface",
        // Desktop: sticky right column. Narrow screens: bottom sheet toggled by "View spec".
        "min-[1181px]:sticky min-[1181px]:top-14 min-[1181px]:flex min-[1181px]:h-[calc(100vh-56px)] min-[1181px]:border-l",
        "max-[1180px]:fixed max-[1180px]:inset-x-0 max-[1180px]:bottom-0 max-[1180px]:z-15 max-[1180px]:h-[70vh] max-[1180px]:border-t",
        open ? "max-[1180px]:flex" : "max-[1180px]:hidden",
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h3 className="text-sm">runway.yaml</h3>
          <small className="block text-[12.5px] text-muted">
            Written as you answer. This is exactly what gets deployed.
          </small>
        </div>
        <Button variant="ghost" size="small" className="min-[1181px]:hidden" onClick={onClose}>
          Close
        </Button>
      </div>
      <pre
        data-testid="spec"
        className="m-0 flex-1 overflow-auto py-4 font-mono text-[12.5px] leading-[1.75]"
      >
        <span className="block px-5 whitespace-pre text-muted italic"># runway.yaml</span>
        {lines.map((line, i) => (
          <span
            key={`${i}-${gens[i]}`}
            className={cn("block px-5 whitespace-pre", gens[i] > 0 && "spec-fresh")}
          >
            <Line line={line} />
          </span>
        ))}
      </pre>
    </aside>
  );
}
