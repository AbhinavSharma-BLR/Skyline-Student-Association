import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { merchandiseService } from "@/lib/services/MerchandiseService";
import { handleApiError } from "@/lib/api/errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = nanoid();
  try {
    const { id } = await params;
    const product = await merchandiseService.getProduct(id);
    return NextResponse.json({ data: product });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = nanoid();
  try {
    const session = await requireAuth(request);
    await requireRole(session, "officer");
    const { id } = await params;
    const body = await request.json();

    const product = await merchandiseService.getProduct(id);
    return NextResponse.json({ data: { ...product, ...body } });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
