import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth } from "@/lib/auth/session";
import { claimService } from "@/lib/services/ClaimService";
import { handleApiError, SkylineError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = nanoid();
  try {
    const session = await requireAuth(request);
    const { id } = await params;

    const isTreasurer = Boolean(
      await (prisma as any).role.findFirst({
        where: { userId: session.user.id, role: "treasurer" },
      })
    );

    const file = await claimService.getReceiptFile(session.user.id, isTreasurer, id);

    return new NextResponse(file.buffer as any, {
      status: 200,
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `inline; filename="${file.filename}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = nanoid();
  try {
    const session = await requireAuth(request);
    const { id } = await params;

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      throw new SkylineError(
        "VALIDATION_ERROR",
        "A multipart file named 'file' must be provided",
        422
      );
    }

    const fileBlob = file as Blob & { name?: string };
    const originalFilename = fileBlob.name || "receipt.pdf";
    const arrayBuffer = await fileBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const isTreasurer = Boolean(
      await (prisma as any).role.findFirst({
        where: { userId: session.user.id, role: "treasurer" },
      })
    );

    const updatedClaim = await claimService.uploadReceipt(
      session.user.id,
      id,
      buffer,
      originalFilename,
      isTreasurer
    );

    return NextResponse.json({ data: updatedClaim }, { status: 201 });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
