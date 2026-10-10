import { createAuthClient } from "better-auth/react";

/**
 * Better Auth Browser Client
 * Shared by Student Frontend and Management Frontend developers.
 * Used for sign-in, sign-up, sign-out, and reactive session hooks (useSession).
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const { signIn, signUp, signOut, useSession } = authClient;
