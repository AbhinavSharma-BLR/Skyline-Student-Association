import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth } from "@/lib/auth/session";
import { bookingService } from "@/lib/services/BookingService";
import { handleApiError } from "@/lib/api/errors";

export async function GET(request: NextRequest) {
  const requestId = nanoid();
  try {
    const session = await requireAuth(request);
    const tickets = await bookingService.listUserTickets(session.user.id);
    return NextResponse.json({ data: tickets });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
