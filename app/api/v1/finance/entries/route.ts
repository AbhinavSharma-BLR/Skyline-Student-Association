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

    const role = await (prisma as any).role.findFirst({
      where: {
        userId: session.user.id,
        role: { in: ["officer", "treasurer"] },
      },
    });

    if (!role) {
      throw new SkylineError(
        "FORBIDDEN",
        "Cashbook entries are restricted to club officers and treasurers",
        403
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") || "50");
    const cursor = searchParams.get("cursor") || undefined;

    const entries = await financeService.listEntries(limit, cursor);
    return NextResponse.json({
      data: entries,
      nextCursor: null,
      hasMore: false,
    });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
