import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { merchandiseService } from "@/lib/services/MerchandiseService";
import { CreateProductRequestSchema } from "@/lib/schemas/merchandise";
import { handleApiError, SkylineError } from "@/lib/api/errors";

export async function GET() {
  const requestId = nanoid();
  try {
    const products = await merchandiseService.listProducts();
    return NextResponse.json({ data: products });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}

export async function POST(request: NextRequest) {
  const requestId = nanoid();
  try {
    const session = await requireAuth(request);
    await requireRole(session, "officer");

    const body = await request.json();
    const parsed = CreateProductRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new SkylineError(
        "VALIDATION_ERROR",
        "Invalid product payload",
        422,
        parsed.error.flatten().fieldErrors
      );
    }

    const created = await merchandiseService.createProduct(session.user.id, parsed.data);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
