// Import Next.js server response primitive for HTTP JSON responses
import { NextResponse } from "next/server";

// Custom domain application error class representing predictable API failures
export class SkylineError extends Error {
  // Machine-readable uppercase error code conforming to docs/INTEGRATION_CONTRACT.md
  public code: string;
  // HTTP status code to return to the client (e.g. 400, 401, 403, 404, 409, 422, 503)
  public statusCode: number;
  // Optional dictionary of field-specific validation errors from Zod schemas
  public fieldErrors?: Record<string, string[]>;

  // Constructor initializing error code, human-readable message, status code, and field errors
  constructor(
    // Specific error code such as "UNAUTHORIZED", "FORBIDDEN", or "NOT_FOUND"
    code: string,
    // Clear human-readable message describing the business rule violation
    message: string,
    // HTTP response status code defaulting to 400 Bad Request
    statusCode: number = 400,
    // Optional field-level error messages
    fieldErrors?: Record<string, string[]>
  ) {
    // Pass the message to the native Error super constructor
    super(message);
    // Set custom error name for debugging identification
    this.name = "SkylineError";
    // Assign the error code property
    this.code = code;
    // Assign the HTTP status code property
    this.statusCode = statusCode;
    // Assign field errors when provided
    this.fieldErrors = fieldErrors;
  }
}

// Standardized error payload structure conforming to docs/INTEGRATION_CONTRACT.md
export interface ApiErrorResponse {
  // Nested error object containing code and message
  error: {
    // Machine-readable uppercase error string
    code: string;
    // Human-readable message explaining the failure
    message: string;
    // Optional field-level breakdown for validation failures
    fieldErrors?: Record<string, string[]>;
  };
  // Unique request correlation identifier for tracing without logging PII
  requestId: string;
}

// Global API error handler converting errors into standardized JSON responses
export function handleApiError(
  // The caught unknown error object from try/catch blocks
  error: unknown,
  // The unique per-request nanoid identifier
  requestId: string
): NextResponse<ApiErrorResponse> {
  // 1. Check if the error is an expected application SkylineError instance
  if (error instanceof SkylineError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
        },
        requestId,
      },
      { status: error.statusCode }
    );
  }

  // 2. Check for database dependency or unmigrated client error
  if (
    error instanceof Error &&
    (error.name === "DatabaseDependencyError" || error.message.includes("Prisma schema and migrations"))
  ) {
    return NextResponse.json(
      {
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Database service unavailable. Database migrations pending.",
        },
        requestId,
      },
      { status: 503 }
    );
  }

  // 3. Check for Prisma unique constraint violation error code (P2002)
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "P2002"
  ) {
    return NextResponse.json(
      {
        error: {
          code: "CONFLICT",
          message: "A record with this unique identifier already exists",
        },
        requestId,
      },
      { status: 409 }
    );
  }

  // 4. Log unknown internal error with request ID and error code without exposing PII or credentials
  console.error("[API_ERROR]", {
    requestId,
    name: error instanceof Error ? error.name : "UnknownError",
    message: error instanceof Error ? error.message : String(error),
  });

  // 5. Return generic 500 Internal Server Error without leaking internal stack details
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected server error occurred",
      },
      requestId,
    },
    { status: 500 }
  );
}
