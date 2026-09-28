import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-[1280px] px-[clamp(16px,3vw,40px)] pt-7 pb-12">
      <div className="grid justify-items-center gap-3 px-5 py-16 text-center">
        <h2>{title}</h2>
        <p className="text-muted">{body}</p>
        <Link href="/new" className={buttonVariants({ variant: "primary" })}>
          Start a deployment
        </Link>
      </div>
    </div>
  );
}
