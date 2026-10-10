import { NextResponse } from "next/server";
import { HealthService } from "@/lib/services/HealthService";

/**
 * GET /api/v1/health/liveness
 * Pure liveness probe: indicates whether the Next.js application process is running.
 * Independent of database connectivity. Always returns 200 OK when the process is alive.
 */
export async function GET() {
  const liveness = HealthService.checkLiveness();

  return NextResponse.json(
    {
      data: liveness,
    },
    { status: 200 }
  );
}
