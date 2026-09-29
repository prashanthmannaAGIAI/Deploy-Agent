import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Copy .env.example to .env at the repo root.`);
  return value;
}

// Fields this app adds to the Auth.js JWT (the encrypted session cookie).
type RunwayToken = { refreshToken?: string };

const issuer = required("KEYCLOAK_ISSUER");
const clientId = required("KEYCLOAK_WEB_CLIENT_ID");
const clientSecret = required("KEYCLOAK_WEB_CLIENT_SECRET");

/** Ends the Keycloak SSO session too, so the next sign-in asks for the password again. */
async function endKeycloakSession(refreshToken: string) {
  try {
    await fetch(`${issuer}/protocol/openid-connect/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    });
  } catch {
    // Keycloak unreachable: the local session is still cleared.
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Keycloak({ clientId, clientSecret, issuer, checks: ["pkce", "state"] })],
  secret: required("AUTH_SECRET"),
  // Hosted deployments set AUTH_URL, and Auth.js then builds every URL from it rather than
  // from the request's Host header. Only a developer machine may trust the Host header.
  // (An explicit `false` here would override Auth.js's own AUTH_URL default and reject
  // every request in production.)
  trustHost: process.env.RUNWAY_ENV === "dev" || Boolean(process.env.AUTH_URL),
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    authorized: ({ auth }) => Boolean(auth?.user),
    jwt({ token, account }) {
      // Stored only in the encrypted session cookie, never sent to the browser as JSON.
      if (account?.refresh_token) (token as RunwayToken).refreshToken = account.refresh_token;
      return token;
    },
  },
  events: {
    async signOut(message) {
      const refreshToken =
        "token" in message ? (message.token as RunwayToken | null)?.refreshToken : undefined;
      if (refreshToken) await endKeycloakSession(refreshToken);
    },
  },
});
