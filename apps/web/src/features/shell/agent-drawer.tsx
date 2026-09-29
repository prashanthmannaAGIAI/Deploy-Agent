"use client";

import { Dialog } from "radix-ui";

import { Button } from "@/components/ui/button";
import { SparkIcon } from "@/components/ui/icons";
import { Note } from "@/components/ui/note";

const SUGGESTIONS = [
  "Why did the health check fail?",
  "What will this cost?",
  "Explain the generated Dockerfile",
  "Is it safe to use access keys?",
];

/** "Ask agent" drawer. The agent itself (chat with tool use) arrives in Phase 4. */
export function AgentDrawer() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button size="small">
          <SparkIcon className="size-4" />
          <span className="max-[520px]:hidden">Ask agent</span>
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-20 bg-black/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-21 flex w-[min(420px,100%)] flex-col border-l border-line bg-surface"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
            <Dialog.Title className="text-base font-semibold">AiOps agent</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="small">
                Close
              </Button>
            </Dialog.Close>
          </div>
          <div className="grid flex-1 content-start gap-3 overflow-auto p-4" aria-live="polite">
            <div className="max-w-[88%] rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-[14.5px]">
              I can explain any step, suggest settings for your repo, or dig into a failed
              deployment. What do you need?
            </div>
            <Note>
              The agent arrives in Phase 4. It will answer from your repository, cloud account and
              logs.
            </Note>
          </div>
          <div className="flex flex-wrap gap-1.5 px-4 pb-2.5">
            {SUGGESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                disabled
                className="rounded-full border border-line-2 bg-surface px-3 py-[5px] text-[13px] disabled:opacity-60"
              >
                {q}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2 border-t border-line px-4 py-3"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              disabled
              aria-label="Message the agent"
              placeholder="Ask about this deployment"
              className="min-h-10 w-full rounded-lg border border-line-2 bg-surface px-3 py-2 disabled:cursor-not-allowed disabled:bg-surface-2"
            />
            <Button variant="primary" type="submit" disabled>
              Send
            </Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
