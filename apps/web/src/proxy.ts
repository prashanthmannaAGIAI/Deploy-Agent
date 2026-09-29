// Every page except the sign-in page and Auth.js endpoints requires a session.
// Unauthenticated requests are redirected to /login by the `authorized` callback in auth.ts.
export { auth as proxy } from "@/auth";

export const config = {
  matcher: ["/((?!api/auth|login|_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
