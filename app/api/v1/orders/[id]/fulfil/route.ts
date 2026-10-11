import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { orderService } from "@/lib/services/OrderService";
import { handleApiError } from "@/lib/api/errors";

async function handleFulfil(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = nanoid();
  try {
    const session = await requireAuth(request);
    await requireRole(session, "officer");
    const { id } = await params;

    const fulfilled = await orderService.fulfilOrder(session.user.id, id);
    return NextResponse.json({ data: fulfilled });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}

export const POST = handleFulfil;
export const PATCH = handleFulfil;
