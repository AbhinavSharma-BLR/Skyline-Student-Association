import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth } from "@/lib/auth/session";
import { bookingService } from "@/lib/services/BookingService";
import { handleApiError } from "@/lib/api/errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = nanoid();
  try {
    await requireAuth(request);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const paymentRef = body?.paymentRef || `pay_${nanoid(10)}`;

    const result = await bookingService.confirmBooking(id, paymentRef);
    return NextResponse.json({ data: result });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
