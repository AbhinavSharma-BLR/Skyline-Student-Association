import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth } from "@/lib/auth/session";
import { financeService } from "@/lib/services/FinanceService";
import { handleApiError, SkylineError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const requestId = nanoid();
  try {
    const session = await requireAuth(request);

    // Finance totals are restricted to officers and treasurers
    const role = await (prisma as any).role.findFirst({
      where: {
        userId: session.user.id,
        role: { in: ["officer", "treasurer"] },
      },
    });

    if (!role) {
      throw new SkylineError(
        "FORBIDDEN",
        "Financial summaries are restricted to club officers and treasurers",
        403
      );
    }

    const summary = await financeService.getSummary();
    return NextResponse.json({ data: summary });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
