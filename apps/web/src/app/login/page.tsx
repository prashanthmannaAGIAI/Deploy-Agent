import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AiOpsLogo, PoweredBy } from "@/components/brand/aiops-logo";
import { safeCallback } from "@/lib/safe-callback";

import { CicdRobot } from "./cicd-robot";
import styles from "./login.module.css";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · AiOps" };

// Auth.js error codes → what the user can do about them.
const ERRORS: Record<string, string> = {
  AccessDenied: "Your account isn't allowed to sign in. Ask an admin for access.",
  Configuration: "Sign-in is misconfigured. Check the Keycloak settings in .env.",
  OAuthCallbackError: "Sign-in was cancelled or didn't complete. Try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  const destination = safeCallback(callbackUrl, process.env.WEB_BASE_URL);
  if ((await auth())?.user) redirect(destination);

  return (
    <div className="grid min-h-screen grid-cols-[1.1fr_1fr] max-[820px]:grid-cols-1">
      <div
        className={`${styles.art} flex flex-col justify-between gap-8 p-12 max-[820px]:px-6 max-[820px]:py-8`}
      >
        <AiOpsLogo onDark height={96} />
        <div>
          <h1 className="max-w-[16ch] text-[36px] leading-[1.15] tracking-[-0.02em] text-white">
            Ship any repo to any cloud, and{" "}
            <span className={styles.gradientText}>see exactly what happened.</span>
          </h1>
          <p className="mt-4 max-w-[46ch] text-[15.5px] text-[#A9B8D3]">
            Answer a few questions, review the plan, deploy in one click. When something breaks, the
            agent reads the logs and tells you why.
          </p>
        </div>
        <CicdRobot className="w-full max-w-[560px] max-[820px]:hidden" />
      </div>
      <div
        className={`${styles.formSide} flex flex-col items-center justify-center gap-8 px-6 py-10`}
      >
        <div className={styles.card}>
          <LoginForm
            callbackUrl={destination}
            initialError={error ? (ERRORS[error] ?? "Sign-in didn't complete. Try again.") : ""}
          />
        </div>
        <PoweredBy />
      </div>
    </div>
  );
}
