import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { auth, signOut } from "@/auth";
import { PoweredBy } from "@/components/brand/aiops-logo";
import { TopBar } from "@/features/shell/top-bar";

export default async function AppLayout({ children }: { children: ReactNode }) {
  // The proxy already redirects anonymous requests; this is the check that renders nothing
  // without a session even if the proxy matcher misses a route.
  const session = await auth();
  if (!session?.user) redirect("/login");

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <>
      <TopBar email={session.user.email ?? session.user.name ?? ""} signOutAction={signOutAction} />
      {children}
      <footer className="flex justify-center border-t border-line bg-surface px-5 py-3">
        <PoweredBy />
      </footer>
    </>
  );
}
