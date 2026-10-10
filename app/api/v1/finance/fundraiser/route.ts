import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { financeService } from "@/lib/services/FinanceService";
import { RecordFundraiserReceiptRequestSchema } from "@/lib/schemas/finance";
import { handleApiError, SkylineError } from "@/lib/api/errors";

export async function POST(request: NextRequest) {
  const requestId = nanoid();
  try {
    const session = await requireAuth(request);
    await requireRole(session, "treasurer");

    const body = await request.json();
    const parsed = RecordFundraiserReceiptRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new SkylineError(
        "VALIDATION_ERROR",
        "Invalid fundraiser receipt payload",
        422,
        parsed.error.flatten().fieldErrors
      );
    }

    const entry = await financeService.recordFundraiserReceipt(
      session.user.id,
      parsed.data
    );

    return NextResponse.json({ data: entry }, { status: 201 });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
