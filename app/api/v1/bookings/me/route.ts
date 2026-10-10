import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth } from "@/lib/auth/session";
import { bookingService } from "@/lib/services/BookingService";
import { handleApiError } from "@/lib/api/errors";

export async function GET(request: NextRequest) {
  const requestId = nanoid();
  try {
    const session = await requireAuth(request);
    const bookings = await bookingService.listUserBookings(session.user.id);
    return NextResponse.json({ data: bookings });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
