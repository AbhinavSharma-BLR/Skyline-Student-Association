import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth } from "@/lib/auth/session";
import { orderService } from "@/lib/services/OrderService";
import { handleApiError } from "@/lib/api/errors";

export async function GET(request: NextRequest) {
  const requestId = nanoid();
  try {
    const session = await requireAuth(request);
    const orders = await orderService.listUserOrders(session.user.id);
    return NextResponse.json({ data: orders });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
