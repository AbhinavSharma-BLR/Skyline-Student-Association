import { prisma } from "@/lib/prisma";
import { SkylineError } from "@/lib/api/errors";
import { CreateClaimRequest, ClaimResponse } from "@/lib/schemas/claims";
import { receiptService } from "./ReceiptService";

export class ClaimService {
  /**
   * Submits a reimbursement claim with non-zero amount.
   */
  async submitClaim(
    claimantId: string,
    input: CreateClaimRequest
  ): Promise<ClaimResponse> {
    if (input.amountPaise <= 0) {
      throw new SkylineError(
        "VALIDATION_ERROR",
        "Claim amount must be greater than zero",
        422
      );
    }

    const claim = await (prisma as any).claim.create({
      data: {
        claimantId,
        activityId: input.activityId ?? null,
        title: input.title,
        reason: input.description,
        amountPaise: BigInt(input.amountPaise),
        status: "submitted",
      },
      include: {
        claimant: { select: { id: true, name: true } },
      },
    });

    return {
      id: claim.id,
      claimantId: claim.claimantId,
      claimant: {
        id: claim.claimant?.id ?? claim.claimantId,
        name: claim.claimant?.name ?? "Claimant",
      },
      activityId: claim.activityId,
      title: claim.title,
      description: claim.reason,
      amountPaise: Number(claim.amountPaise),
      status: claim.status,
      reviewerId: null,
      reviewer: null,
      reviewNote: null,
      payoutRef: null,
      hasReceipt: false,
      reviewedAt: null,
      paidAt: null,
      createdAt: claim.createdAt.toISOString(),
    };
  }

  /**
   * Lists claims submitted by the current authenticated user.
   */
  async listUserClaims(userId: string): Promise<ClaimResponse[]> {
    const claims = await (prisma as any).claim.findMany({
      where: { claimantId: userId },
      include: {
        claimant: { select: { id: true, name: true } },
        reviewer: { select: { id: true, name: true } },
        receiptFile: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return claims.map((c: any) => this.mapClaimResponse(c));
  }

  /**
   * Lists all claims across the club. Restricted to treasurers.
   */
  async listAllClaims(): Promise<ClaimResponse[]> {
    const claims = await (prisma as any).claim.findMany({
      include: {
        claimant: { select: { id: true, name: true } },
        reviewer: { select: { id: true, name: true } },
        receiptFile: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return claims.map((c: any) => this.mapClaimResponse(c));
  }

  /**
   * Approves a claim. Enforces self-approval prohibition.
   * Invariant: Approval creates an obligation, but does NOT write a cashbook entry.
   */
  async approveClaim(
    reviewerId: string,
    claimId: string,
    reviewNote?: string
  ): Promise<ClaimResponse> {
    const claim = await (prisma as any).claim.findUnique({
      where: { id: claimId },
    });

    if (!claim) {
      throw new SkylineError("NOT_FOUND", "Claim not found", 404);
    }

    // Invariant: Self-approval is strictly forbidden
    if (claim.claimantId === reviewerId) {
      throw new SkylineError(
        "SELF_APPROVAL_FORBIDDEN",
        "Claimants are strictly prohibited from approving their own reimbursement claims",
        403
      );
    }

    if (claim.status !== "submitted" && claim.status !== "under_review") {
      throw new SkylineError(
        "CONFLICT",
        `Cannot approve claim with status '${claim.status}'`,
        409
      );
    }

    const updated = await (prisma as any).claim.update({
      where: { id: claimId },
      data: {
        status: "approved",
        reviewerId,
        reviewNote: reviewNote ?? null,
      },
      include: {
        claimant: { select: { id: true, name: true } },
        reviewer: { select: { id: true, name: true } },
        receiptFile: { select: { id: true } },
      },
    });

    return this.mapClaimResponse(updated);
  }

  /**
   * Rejects a claim with an explanatory note. Enforces self-approval prohibition.
   */
  async rejectClaim(
    reviewerId: string,
    claimId: string,
    reviewNote?: string
  ): Promise<ClaimResponse> {
    const claim = await (prisma as any).claim.findUnique({
      where: { id: claimId },
    });

    if (!claim) {
      throw new SkylineError("NOT_FOUND", "Claim not found", 404);
    }

    if (claim.claimantId === reviewerId) {
      throw new SkylineError(
        "SELF_APPROVAL_FORBIDDEN",
        "Claimants cannot review their own claims",
        403
      );
    }

    const updated = await (prisma as any).claim.update({
      where: { id: claimId },
      data: {
        status: "rejected",
        reviewerId,
        reviewNote: reviewNote ?? null,
      },
      include: {
        claimant: { select: { id: true, name: true } },
        reviewer: { select: { id: true, name: true } },
        receiptFile: { select: { id: true } },
      },
    });

    return this.mapClaimResponse(updated);
  }

  /**
   * Records payout for an approved claim.
   * Invariants:
   * 1. Claimant cannot pay their own claim (strict no self-payout).
   * 2. Reviewer who approved may execute payout provided they are not the claimant.
   * 3. Payout writes a CashbookEntry with OUTFLOW.
   */
  async payoutClaim(
    payerId: string,
    claimId: string,
    payoutRef: string
  ): Promise<ClaimResponse> {
    const claim = await (prisma as any).claim.findUnique({
      where: { id: claimId },
    });

    if (!claim) {
      throw new SkylineError("NOT_FOUND", "Claim not found", 404);
    }

    if (claim.status !== "approved") {
      throw new SkylineError(
        "CONFLICT",
        `Only approved claims can be paid. Current status: '${claim.status}'`,
        409
      );
    }

    if (claim.claimantId === payerId) {
      throw new SkylineError(
        "SELF_PAYOUT_FORBIDDEN",
        "Claimants are strictly prohibited from executing payout for their own claims",
        403
      );
    }

    const paidAt = new Date();

    const updated = await (prisma as any).$transaction(async (tx: any) => {
      // 1. Atomically transition claim state to prevent duplicate payouts from simultaneous calls
      const transitionResult = await tx.claim.updateMany({
        where: { id: claimId, status: "approved" },
        data: {
          status: "paid",
          payoutRef,
          paidAt,
        },
      });

      if (transitionResult.count === 0) {
        throw new SkylineError(
          "CONFLICT",
          "Claim is not approved or has already been paid",
          409
        );
      }

      // 2. Write immutable financial cashbook OUTFLOW
      await tx.cashbookEntry.create({
        data: {
          direction: "OUTFLOW",
          category: "claim_payout",
          amountPaise: claim.amountPaise,
          claimId: claim.id,
          recordedById: payerId,
          occurredAt: paidAt,
        },
      });

      return tx.claim.findUnique({
        where: { id: claimId },
        include: {
          claimant: { select: { id: true, name: true } },
          reviewer: { select: { id: true, name: true } },
          receiptFile: { select: { id: true } },
        },
      });
    });

    return this.mapClaimResponse(updated);
  }

  /**
   * Uploads and associates a receipt file with a claim.
   */
  async uploadReceipt(
    userId: string,
    claimId: string,
    buffer: Buffer,
    filename: string
  ): Promise<ClaimResponse> {
    const claim = await (prisma as any).claim.findUnique({
      where: { id: claimId },
    });

    if (!claim) {
      throw new SkylineError("NOT_FOUND", "Claim not found", 404);
    }

    if (claim.claimantId !== userId) {
      throw new SkylineError(
        "FORBIDDEN",
        "Only the claim creator can attach receipts",
        403
      );
    }

    if (claim.status !== "submitted") {
      throw new SkylineError(
        "CONFLICT",
        "Receipts cannot be modified after a claim has entered review or approval",
        409
      );
    }

    const saved = await receiptService.saveReceipt(buffer, filename);

    const updated = await (prisma as any).$transaction(async (tx: any) => {
      await tx.receiptFile.upsert({
        where: { claimId },
        create: {
          claimId,
          userId,
          storagePath: saved.storagePath,
          mimeType: saved.mimeType,
          sizeBytes: saved.sizeBytes,
        },
        update: {
          storagePath: saved.storagePath,
          mimeType: saved.mimeType,
          sizeBytes: saved.sizeBytes,
        },
      });

      return tx.claim.findUnique({
        where: { id: claimId },
        include: {
          claimant: { select: { id: true, name: true } },
          reviewer: { select: { id: true, name: true } },
          receiptFile: { select: { id: true } },
        },
      });
    });

    return this.mapClaimResponse(updated);
  }

  /**
   * Fetches the receipt file for streaming download.
   */
  async getReceiptFile(
    callerId: string,
    isTreasurer: boolean,
    claimId: string
  ): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    const claim = await (prisma as any).claim.findUnique({
      where: { id: claimId },
      include: { receiptFile: true },
    });

    if (!claim) {
      throw new SkylineError("NOT_FOUND", "Claim not found", 404);
    }

    if (claim.claimantId !== callerId && !isTreasurer) {
      throw new SkylineError(
        "FORBIDDEN",
        "Only the claimant or club treasurers may access receipt files",
        403
      );
    }

    if (!claim.receiptFile) {
      throw new SkylineError("NOT_FOUND", "No receipt file attached to this claim", 404);
    }

    const file = await receiptService.readReceipt(claim.receiptFile.storagePath);
    return {
      buffer: file.buffer,
      mimeType: claim.receiptFile.mimeType,
      filename: file.filename,
    };
  }

  private mapClaimResponse(c: any): ClaimResponse {
    return {
      id: c.id,
      claimantId: c.claimantId,
      claimant: {
        id: c.claimant?.id ?? c.claimantId,
        name: c.claimant?.name ?? "Claimant",
      },
      activityId: c.activityId,
      title: c.title,
      description: c.reason,
      amountPaise: Number(c.amountPaise),
      status: c.status,
      reviewerId: c.reviewerId,
      reviewer: c.reviewer
        ? { id: c.reviewer.id, name: c.reviewer.name }
        : null,
      reviewNote: c.reviewNote ?? null,
      payoutRef: c.payoutRef ?? null,
      hasReceipt: Boolean(c.receiptFile),
      reviewedAt: c.reviewedAt ? c.reviewedAt.toISOString() : null,
      paidAt: c.paidAt ? c.paidAt.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
    };
  }
}

export const claimService = new ClaimService();
