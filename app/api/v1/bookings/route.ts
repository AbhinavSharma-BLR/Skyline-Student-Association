import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth } from "@/lib/auth/session";
import { bookingService } from "@/lib/services/BookingService";
import { CreateBookingRequestSchema } from "@/lib/schemas/activities";
import { handleApiError, SkylineError } from "@/lib/api/errors";

export async function POST(request: NextRequest) {
  const requestId = nanoid();
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const parsed = CreateBookingRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new SkylineError(
        "VALIDATION_ERROR",
        "Invalid booking request",
        422,
        parsed.error.flatten().fieldErrors
      );
    }

    const booking = await bookingService.createBooking(
      session.user.id,
      parsed.data.activityId
    );

    return NextResponse.json({ data: booking }, { status: 201 });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
