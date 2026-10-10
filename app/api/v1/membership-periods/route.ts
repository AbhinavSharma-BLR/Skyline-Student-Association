import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { MembershipService } from "@/lib/services/MembershipService";
import { handleApiError } from "@/lib/api/errors";

/**
 * GET /api/v1/membership-periods
 * Public endpoint: lists available membership periods for registration.
 */
export async function GET() {
  const requestId = nanoid();

  try {
    const periods = await MembershipService.listPeriods();
    return NextResponse.json({ data: periods }, { status: 200 });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
