"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DropdownMenu } from "radix-ui";
import { startTransition } from "react";

import { Logo } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

import { AgentDrawer } from "./agent-drawer";

const NAV = [
  { href: "/new", label: "New deployment" },
  { href: "/deployments", label: "Deployments" },
  { href: "/monitoring", label: "Monitoring" },
];

export function TopBar({
  email,
  signOutAction,
}: {
  email: string;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-5 flex h-14 items-center gap-4 border-b border-line bg-surface px-5 max-[820px]:gap-2 max-[820px]:px-3">
      <Link href="/new" className="flex items-center gap-2.5 text-[17px] font-semibold">
        <Logo />
        <span className="max-[520px]:hidden">Runway</span>
      </Link>
      <nav aria-label="Main" className="ml-3 flex gap-1 overflow-x-auto max-[820px]:ml-0">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            aria-current={pathname.startsWith(n.href) ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-2 font-medium whitespace-nowrap text-muted max-[520px]:px-2",
              pathname.startsWith(n.href) && "bg-surface-2 text-ink",
            )}
          >
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="flex-1" />
      <AgentDrawer />
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          aria-label={`Account menu for ${email}`}
          className="grid size-8 flex-none cursor-pointer place-items-center rounded-full bg-accent-soft text-[13px] font-semibold text-accent"
        >
          {(email[0] ?? "U").toUpperCase()}
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            className="z-30 min-w-56 rounded-xl border border-line bg-surface p-1.5 shadow-lg"
          >
            <div className="px-2.5 py-2 text-[13px] text-muted">
              Signed in as
              <div className="font-medium text-ink [overflow-wrap:anywhere]">{email}</div>
            </div>
            <DropdownMenu.Separator className="my-1 h-px bg-line" />
            {/* Called from onSelect: the menu unmounts on select, so a <form> inside it would
                never submit. */}
            <DropdownMenu.Item
              onSelect={() => startTransition(() => signOutAction())}
              className="w-full cursor-pointer rounded-lg px-2.5 py-2 text-left text-sm outline-none data-[highlighted]:bg-surface-2"
            >
              Sign out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </header>
  );
}
