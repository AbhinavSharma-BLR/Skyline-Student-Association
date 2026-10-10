import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { HealthService } from "@/lib/services/HealthService";
import { handleApiError } from "@/lib/api/errors";

/**
 * GET /api/v1/health
 * Readiness probe: checks if the application and its PostgreSQL database dependency are ready.
 * - Returns 200 OK when PostgreSQL is reachable.
 * - Returns 503 Service Unavailable when PostgreSQL is offline or unmigrated.
 * Does not expose credentials or internal database errors.
 */
export async function GET() {
  const requestId = nanoid();

  try {
    const readiness = await HealthService.checkReadiness();

    if (!readiness.ok) {
      return NextResponse.json(
        {
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "Database service is not ready",
          },
          data: readiness,
          requestId,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        data: readiness,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
