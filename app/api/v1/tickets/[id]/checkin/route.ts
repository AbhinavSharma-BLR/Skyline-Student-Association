import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth, requireActivityStaff } from "@/lib/auth/session";
import { CheckInService } from "@/lib/services/CheckInService";
import { handleApiError } from "@/lib/api/errors";
import { z } from "zod";

const CheckinBodySchema = z.object({
  activityId: z.string().min(1, "activityId is required"),
});

/**
 * POST /api/v1/tickets/:id/checkin
 * Door check-in scanner endpoint.
 * Requires authenticated staff with "checkin" capability for this event.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const requestId = nanoid();

  try {
    const session = await requireAuth(request);
    const { id: ticketId } = await context.params;

    const body = await request.json();
    const parsed = CheckinBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid checkin payload",
            fieldErrors: parsed.error.flatten().fieldErrors,
          },
          requestId,
        },
        { status: 422 }
      );
    }

    // Authorize activity staff capability
    await requireActivityStaff(session, parsed.data.activityId, "checkin");

    const result = await CheckInService.scanTicket({
      activityId: parsed.data.activityId,
      ticketId,
    });

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
