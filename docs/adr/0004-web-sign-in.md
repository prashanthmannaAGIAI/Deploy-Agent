# 4. Web sign-in: Auth.js v5 + Keycloak hosted login

Date: 2026-09-28 · Status: accepted

## Context
Phase 1 needs email + password sign-in through Keycloak, MFA later for accounts that can deploy to production, and GitHub / Google / SSO shown as "Coming soon". The prototype puts an email and a password field on Runway's own page.

## Decision
- **Auth.js v5** (`next-auth@5.0.0-beta.32`, the only line that supports the App Router and Next 16) with the Keycloak OIDC provider: authorization code + PKCE (S256, enforced on the client) + state. JWT session strategy, 8-hour sessions.
- **Password entry happens on Keycloak's hosted page**, not ours. Runway's sign-in page keeps the prototype layout and asks for the work email, which is passed to Keycloak as `login_hint`. Passwords, brute-force protection and (later) OTP never pass through the web app. Direct access grants (password grant) stay disabled on the client.
- The Keycloak page uses a `runway` login theme (keycloak.v2 + Runway tokens and IBM Plex), so the hand-off looks consistent.
- **Sign-out ends the Keycloak session** server-to-server (refresh token posted to the logout endpoint), so the next sign-in asks for the password again. The refresh token lives only in the encrypted session cookie.
- `trustHost` only when `RUNWAY_ENV=dev`; elsewhere `AUTH_URL` must be set. Post-login redirects are limited to same-origin paths.
- **Dev user**: a one-shot `keycloak-dev-user` compose job creates `DEV_USER_EMAIL` / `DEV_USER_PASSWORD` (role `deployer`) once Keycloak is healthy. It refuses to run unless `RUNWAY_ENV=dev`, and it is not in `realm-runway.json` or any export.

## Consequences
- The sign-in screen differs from the prototype: one "Continue" step on our page, password on the next page.
- Auth.js v5 is still a beta; pin the exact version and re-check on upgrades.
- MFA enforcement (conditional OTP for users with the `deployer` role) is configured in Phase 8 together with RBAC. Until then the dev user signs in with password only.
