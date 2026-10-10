import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { merchandiseService } from "@/lib/services/MerchandiseService";
import { UpdateVariantStockSchema } from "@/lib/schemas/merchandise";
import { handleApiError, SkylineError } from "@/lib/api/errors";

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
    const parsed = UpdateVariantStockSchema.safeParse(body);

    if (!parsed.success) {
      throw new SkylineError(
        "VALIDATION_ERROR",
        "Invalid variant stock payload",
        422,
        parsed.error.flatten().fieldErrors
      );
    }

    const updated = await merchandiseService.updateVariantStock(
      session.user.id,
      id,
      parsed.data.stockTotal
    );

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
