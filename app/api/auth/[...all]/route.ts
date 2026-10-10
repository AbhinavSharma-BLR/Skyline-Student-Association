import { auth } from "@/lib/auth/auth";
import { toNextJsHandler } from "better-auth/next-js";

/**
 * Better Auth Catch-All HTTP Route Handler
 * Dispatches all authentication endpoints:
 * - POST /api/auth/sign-up/email
 * - POST /api/auth/sign-in/email
 * - POST /api/auth/sign-out
 * - GET  /api/auth/get-session
 */
export const { GET, POST } = toNextJsHandler(auth);
