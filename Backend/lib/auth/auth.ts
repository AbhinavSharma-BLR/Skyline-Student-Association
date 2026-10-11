import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

/**
 * Better Auth Server Configuration
 * Configured with Prisma PostgreSQL adapter and email/password authentication.
 * Sessions are stored directly in PostgreSQL via Prisma models.
 */
/**
 * Evaluates whether Better Auth rate limiting is active.
 *
 * Security Policy:
 * 1. Rate limiting remains strictly enabled during development, browser demo, and production.
 * 2. A bypass flag alone CANNOT disable protection outside test runs.
 * 3. Bypassing rate limiting requires BOTH an explicit test environment (NODE_ENV === "test")
 *    AND an explicit test-only bypass flag (TEST_DISABLE_RATE_LIMIT === "true").
 */
export function isRateLimitEnabled(
  nodeEnv: string | undefined = process.env.NODE_ENV,
  testBypassFlag: string | undefined = process.env.TEST_DISABLE_RATE_LIMIT
): boolean {
  if (nodeEnv === "test" && testBypassFlag === "true") {
    return false;
  }
  return true;
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || "development-temporary-fallback-secret-key-32chars",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // In development/hackathon mode
  },
  rateLimit: {
    enabled: isRateLimitEnabled(),
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": {
        window: 60,
        max: 100,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days session lifetime
    updateAge: 60 * 60 * 24,     // Refresh session timestamp once every 24 hours
  },
});

export type Auth = typeof auth;
