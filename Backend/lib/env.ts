// Import Zod library for building and validating environment schemas
import { z } from "zod";

// Define schema for all application environment variables
export const EnvSchema = z.object({
  // PostgreSQL database connection string required by Prisma
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  // Secret key used for signing session cookies and auth tokens (min 32 chars)
  BETTER_AUTH_SECRET: z.string().min(16, "BETTER_AUTH_SECRET must be at least 16 characters"),
  // Base URL of the auth endpoints
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  // Public application URL exposed to client
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  // Local filesystem path for file uploads outside public/
  UPLOAD_DIR: z.string().default("./uploads"),
  // Key used to encrypt QR tokens and receipt access tokens
  RECEIPT_TOKEN_ENCRYPTION_KEY: z.string().min(16, "RECEIPT_TOKEN_ENCRYPTION_KEY must be at least 16 characters"),
  // Shared secret for authorizing background cron job calls
  JOB_RUNNER_SECRET: z.string().min(1, "JOB_RUNNER_SECRET is required"),
  // Payment gateway mode: 'demo' or 'live'
  PAYMENT_MODE: z.enum(["demo", "live"]).default("demo"),
  // Server-only payment gateway API key
  PAYMENT_PROVIDER_KEY: z.string().default("demo_key"),
  // Webhook signature secret for payment confirmations
  PAYMENT_WEBHOOK_SECRET: z.string().default("demo_webhook_secret"),
  // Server-only transactional email API key
  EMAIL_API_KEY: z.string().default("demo_email_key"),
  // Node environment runtime mode
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  // Explicit test-only flag to bypass rate limiting (STRICTLY ignored outside NODE_ENV=test)
  TEST_DISABLE_RATE_LIMIT: z.enum(["true", "false"]).optional(),
});

// TypeScript type inferred from the EnvSchema
export type AppEnv = z.infer<typeof EnvSchema>;

// Pure validation function used to validate any provided environment map
export function validateEnv(rawEnv: Record<string, string | undefined>): AppEnv {
  // Parse and validate the environment variables with Zod
  const result = EnvSchema.safeParse(rawEnv);
  // Check if validation succeeded
  if (!result.success) {
    // Format error messages by field name
    const issues = result.error.issues
      // Map each issue to a descriptive string
      .map((issue) => `[${issue.path.join(".")}]: ${issue.message}`)
      // Join issues with newlines
      .join("\n  ");
    // Throw an error with explicit configuration failure details
    throw new Error(`Environment configuration validation failed:\n  ${issues}`);
  }
  // Return the validated and typed environment configuration
  return result.data;
}

// Lazy environment accessor preventing eager crash during build/test when not invoked
export function getEnv(): AppEnv {
  // Validate process.env against the schema
  return validateEnv(process.env);
}
