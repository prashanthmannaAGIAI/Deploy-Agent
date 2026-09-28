"use server";

import { signIn } from "@/auth";
import { safeCallback } from "@/lib/safe-callback";

const EMAIL = /^\S+@\S+\.\S+$/;

/** Sends the user to Keycloak with their email pre-filled. The password is entered on the
 *  Keycloak page, so it never passes through this app. */
export async function continueWithEmail(email: string, callbackUrl: string) {
  const loginHint = email.trim();
  if (!EMAIL.test(loginHint) || loginHint.length > 254)
    return { error: "Enter a valid work email." };
  await signIn("keycloak", { redirectTo: safeCallback(callbackUrl) }, { login_hint: loginHint });
  return { error: "" };
}
