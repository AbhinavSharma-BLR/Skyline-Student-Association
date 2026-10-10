// Import describe and it test runners from native node:test module
import { describe, it } from "node:test";
// Import strict assertions from node:assert/strict module
import assert from "node:assert/strict";
// Import SkylineError and handleApiError from Backend/lib/api/errors
import { SkylineError, handleApiError } from "../../lib/api/errors";
// Import environment validation helper from Backend/lib/env
import { validateEnv } from "../../lib/env";
// Import domain status schemas from Backend/lib/schemas/enums
import {
  MembershipStatusSchema,
  ClaimStatusSchema,
  BookingStatusSchema,
  OrderStatusSchema,
  TaskStatusSchema,
} from "../../lib/schemas/enums";

// Group tests for SkylineError and API error handling
describe("Backend Foundation - Error Handling", () => {
  // Test that SkylineError correctly sets properties
  it("creates SkylineError with code, message, statusCode, and fieldErrors", () => {
    // Instantiate error with custom properties
    const error = new SkylineError(
      // Machine-readable code
      "VALIDATION_ERROR",
      // Human-readable message
      "Invalid student data",
      // HTTP 422 Unprocessable Entity
      422,
      // Field level error map
      { email: ["Must be a university email"] }
    );

    // Verify error code is stored correctly
    assert.equal(error.code, "VALIDATION_ERROR");
    // Verify human-readable message
    assert.equal(error.message, "Invalid student data");
    // Verify HTTP status code
    assert.equal(error.statusCode, 422);
    // Verify field errors mapping exists
    assert.deepEqual(error.fieldErrors, { email: ["Must be a university email"] });
    // Verify error is an instance of native Error
    assert.ok(error instanceof Error);
  });

  // Test default status code for SkylineError
  it("defaults SkylineError statusCode to 400 when not specified", () => {
    // Instantiate error without explicit statusCode
    const error = new SkylineError("BAD_REQUEST", "Invalid action");
    // Verify default status code is 400
    assert.equal(error.statusCode, 400);
  });

  // Test handleApiError formatting for SkylineError
  it("formats SkylineError into standard API response envelope", async () => {
    // Create test domain error
    const domainError = new SkylineError("FORBIDDEN", "Only officers can access this resource", 403);
    // Execute error handler with a mock request ID
    const response = handleApiError(domainError, "req-test-123");
    // Extract JSON payload from the response
    const payload = await response.json();

    // Verify HTTP response status matches error status code
    assert.equal(response.status, 403);
    // Verify requestId is included in response
    assert.equal(payload.requestId, "req-test-123");
    // Verify error code matches
    assert.equal(payload.error.code, "FORBIDDEN");
    // Verify error message matches
    assert.equal(payload.error.message, "Only officers can access this resource");
  });

  // Test handleApiError formatting for Prisma unique constraint conflict
  it("handles Prisma P2002 duplicate key constraint as 409 CONFLICT", async () => {
    // Mock Prisma unique constraint violation error object
    const prismaError = { code: "P2002", message: "Unique constraint failed" };
    // Process error through handler
    const response = handleApiError(prismaError, "req-test-456");
    // Extract JSON payload
    const payload = await response.json();

    // Verify HTTP status is 409 Conflict
    assert.equal(response.status, 409);
    // Verify standard CONFLICT error code is returned
    assert.equal(payload.error.code, "CONFLICT");
    // Verify requestId is preserved
    assert.equal(payload.requestId, "req-test-456");
  });

  // Test handleApiError formatting for unknown internal server errors
  it("masks unknown errors as 500 INTERNAL_ERROR without leaking details", async () => {
    // Mock an unexpected runtime exception
    const unexpectedError = new TypeError("Cannot read properties of undefined");
    // Process unexpected error
    const response = handleApiError(unexpectedError, "req-test-789");
    // Extract JSON payload
    const payload = await response.json();

    // Verify HTTP status is 500 Internal Server Error
    assert.equal(response.status, 500);
    // Verify generic error code is returned
    assert.equal(payload.error.code, "INTERNAL_ERROR");
    // Verify generic message does not expose stack trace
    assert.equal(payload.error.message, "An unexpected server error occurred");
    // Verify requestId is returned for correlation
    assert.equal(payload.requestId, "req-test-789");
  });
});

// Group tests for environment variable validation
describe("Backend Foundation - Environment Validation", () => {
  // Test successful validation with valid config
  it("validates valid environment configuration successfully with defaults", () => {
    // Construct valid sample environment variables
    const raw = {
      DATABASE_URL: "postgresql://user:pass@localhost:5432/skyline_test",
      BETTER_AUTH_SECRET: "super-secret-key-that-is-at-least-16-chars-long",
      RECEIPT_TOKEN_ENCRYPTION_KEY: "encryption-key-that-is-at-least-16-chars",
      JOB_RUNNER_SECRET: "cron-secret-123",
    };

    // Run pure validation function
    const env = validateEnv(raw);
    // Verify parsed DATABASE_URL
    assert.equal(env.DATABASE_URL, "postgresql://user:pass@localhost:5432/skyline_test");
    // Verify default value for BETTER_AUTH_URL
    assert.equal(env.BETTER_AUTH_URL, "http://localhost:3000");
    // Verify default value for PAYMENT_MODE
    assert.equal(env.PAYMENT_MODE, "demo");
    // Verify default value for UPLOAD_DIR
    assert.equal(env.UPLOAD_DIR, "./uploads");
  });

  // Test that missing required environment variables cause a descriptive failure
  it("throws descriptive error when required variables are missing", () => {
    // Pass empty object missing required DATABASE_URL and secrets
    assert.throws(
      () => {
        // Run validation expecting failure
        validateEnv({});
      },
      // Verify thrown error message mentions missing fields
      /Environment configuration validation failed/
    );
  });
});

// Group tests for domain status enums
describe("Backend Foundation - Domain Status Enums", () => {
  // Test MembershipStatusSchema validation
  it("validates MembershipStatusSchema states", () => {
    // Verify valid status passes
    assert.equal(MembershipStatusSchema.parse("active"), "active");
    // Verify another valid status passes
    assert.equal(MembershipStatusSchema.parse("pending"), "pending");
    // Verify invalid status throws Zod error
    assert.throws(() => MembershipStatusSchema.parse("invalid_status"));
  });

  // Test ClaimStatusSchema validation
  it("validates ClaimStatusSchema states", () => {
    // Verify valid claim statuses
    assert.equal(ClaimStatusSchema.parse("submitted"), "submitted");
    assert.equal(ClaimStatusSchema.parse("under_review"), "under_review");
    assert.equal(ClaimStatusSchema.parse("approved"), "approved");
    assert.equal(ClaimStatusSchema.parse("rejected"), "rejected");
    assert.equal(ClaimStatusSchema.parse("paid"), "paid");
    // Verify invalid status throws
    assert.throws(() => ClaimStatusSchema.parse("settled"));
  });

  // Test BookingStatusSchema validation
  it("validates BookingStatusSchema states", () => {
    // Verify valid booking statuses
    assert.equal(BookingStatusSchema.parse("pending_payment"), "pending_payment");
    assert.equal(BookingStatusSchema.parse("confirmed"), "confirmed");
    // Verify invalid status throws
    assert.throws(() => BookingStatusSchema.parse("booked"));
  });

  // Test OrderStatusSchema validation
  it("validates OrderStatusSchema states", () => {
    // Verify valid order statuses
    assert.equal(OrderStatusSchema.parse("pending_payment"), "pending_payment");
    assert.equal(OrderStatusSchema.parse("fulfilled"), "fulfilled");
    // Verify invalid status throws
    assert.throws(() => OrderStatusSchema.parse("shipped"));
  });

  // Test TaskStatusSchema validation
  it("validates TaskStatusSchema states", () => {
    // Verify valid task statuses
    assert.equal(TaskStatusSchema.parse("open"), "open");
    assert.equal(TaskStatusSchema.parse("in_progress"), "in_progress");
    assert.equal(TaskStatusSchema.parse("done"), "done");
    // Verify invalid status throws
    assert.throws(() => TaskStatusSchema.parse("finished"));
  });
});
