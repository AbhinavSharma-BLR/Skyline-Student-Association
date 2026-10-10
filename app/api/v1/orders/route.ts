import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { orderService } from "@/lib/services/OrderService";
import { CreateOrderRequestSchema } from "@/lib/schemas/merchandise";
import { handleApiError, SkylineError } from "@/lib/api/errors";

export async function GET(request: NextRequest) {
  const requestId = nanoid();
  try {
    const session = await requireAuth(request);
    await requireRole(session, "officer");

    const orders = await orderService.listAllOrders();
    return NextResponse.json({ data: orders });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}

export async function POST(request: NextRequest) {
  const requestId = nanoid();
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const parsed = CreateOrderRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new SkylineError(
        "VALIDATION_ERROR",
        "Invalid order payload",
        422,
        parsed.error.flatten().fieldErrors
      );
    }

    const order = await orderService.createOrder(session.user.id, parsed.data);
    return NextResponse.json({ data: order }, { status: 201 });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
