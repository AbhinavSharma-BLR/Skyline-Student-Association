import { prisma } from "@/lib/prisma";
import { SkylineError } from "@/lib/api/errors";
import {
  FinanceSummaryResponse,
  CashbookEntryResponse,
  RecordFundraiserReceiptRequest,
} from "@/lib/schemas/finance";

export class FinanceService {
  /**
   * Calculates real-time financial ledger totals and true available funds.
   */
  async getSummary(): Promise<FinanceSummaryResponse> {
    const entries = await (prisma as any).cashbookEntry.findMany();
    const approvedClaims = await (prisma as any).claim.findMany({
      where: { status: "approved" },
    });

    let totalInflow = 0;
    let totalOutflow = 0;
    let membershipRevenue = 0;
    let ticketRevenue = 0;
    let merchandiseRevenue = 0;
    let fundraiserRevenue = 0;
    let totalExpenditure = 0;

    for (const entry of entries) {
      const amount = Number(entry.amountPaise);
      if (entry.direction === "INFLOW") {
        totalInflow += amount;
        if (entry.category === "dues" || entry.category === "MEMBERSHIP") {
          membershipRevenue += amount;
        } else if (entry.category === "ticket" || entry.category === "TICKET") {
          ticketRevenue += amount;
        } else if (entry.category === "merch" || entry.category === "MERCHANDISE") {
          merchandiseRevenue += amount;
        } else if (entry.category === "fundraiser_cash" || entry.category === "FUNDRAISER") {
          fundraiserRevenue += amount;
        }
      } else if (entry.direction === "OUTFLOW") {
        totalOutflow += amount;
        totalExpenditure += amount;
      }
    }

    const netBalance = totalInflow - totalOutflow;
    const pendingObligations = approvedClaims.reduce(
      (acc: number, c: any) => acc + Number(c.amountPaise),
      0
    );
    const trueAvailable = netBalance - pendingObligations;

    return {
      totalInflowPaise: totalInflow,
      totalOutflowPaise: totalOutflow,
      netBalancePaise: netBalance,
      pendingObligationsPaise: pendingObligations,
      trueAvailablePaise: trueAvailable,
      membershipRevenuePaise: membershipRevenue,
      ticketRevenuePaise: ticketRevenue,
      merchandiseRevenuePaise: merchandiseRevenue,
      fundraiserRevenuePaise: fundraiserRevenue,
      totalExpenditurePaise: totalExpenditure,
      asOf: new Date().toISOString(),
    };
  }

  /**
   * Retrieves paginated cashbook entries for financial audits.
   */
  async listEntries(limit = 50, _cursor?: string): Promise<CashbookEntryResponse[]> {
    const entries = await (prisma as any).cashbookEntry.findMany({
      take: Math.min(100, Math.max(1, limit)),
      orderBy: { occurredAt: "desc" },
    });

    return entries.map((e: any) => {
      let refType: any = "purchase";
      let refId = e.id;
      if (e.paymentAttemptId) {
        refType = "purchase";
        refId = e.paymentAttemptId;
      } else if (e.claimId) {
        refType = "claim";
        refId = e.claimId;
      } else if (e.fundraiserReceiptId) {
        refType = "fundraiser_receipt";
        refId = e.fundraiserReceiptId;
      }

      let categoryUpper: any = "OTHER";
      if (e.category === "dues" || e.category === "MEMBERSHIP") categoryUpper = "MEMBERSHIP";
      else if (e.category === "ticket" || e.category === "TICKET") categoryUpper = "TICKET";
      else if (e.category === "merch" || e.category === "MERCHANDISE") categoryUpper = "MERCHANDISE";
      else if (e.category === "fundraiser_cash" || e.category === "FUNDRAISER") categoryUpper = "FUNDRAISER";
      else if (e.category === "claim_payout" || e.category === "CLAIM_PAYOUT") categoryUpper = "CLAIM_PAYOUT";

      return {
        id: e.id,
        direction: e.direction,
        amountPaise: Number(e.amountPaise),
        category: categoryUpper,
        description: `Cashbook ${e.direction} for ${categoryUpper}`,
        activityId: null,
        referenceType: refType,
        referenceId: refId,
        recordedAt: e.occurredAt.toISOString(),
        recordedById: e.recordedById ?? "system",
      };
    });
  }

  /**
   * Records cash revenue collected at a club fundraiser.
   * Invariant: Writes both the receipt record and the financial cashbook INFLOW entry in a transaction.
   */
  async recordFundraiserReceipt(
    treasurerId: string,
    input: RecordFundraiserReceiptRequest
  ): Promise<CashbookEntryResponse> {
    if (input.amountPaise <= 0) {
      throw new SkylineError("VALIDATION_ERROR", "Amount must be positive", 422);
    }

    const activity = await (prisma as any).activity.findUnique({
      where: { id: input.activityId },
    });

    if (!activity) {
      throw new SkylineError("NOT_FOUND", "Fundraiser activity not found", 404);
    }

    const result = await (prisma as any).$transaction(async (tx: any) => {
      const receipt = await tx.fundraiserReceipt.create({
        data: {
          activityId: input.activityId,
          amountPaise: BigInt(input.amountPaise),
          reference: input.reference,
          recordedById: treasurerId,
        },
      });

      const entry = await tx.cashbookEntry.create({
        data: {
          direction: "INFLOW",
          category: "fundraiser_cash",
          amountPaise: BigInt(input.amountPaise),
          fundraiserReceiptId: receipt.id,
          recordedById: treasurerId,
          occurredAt: new Date(),
        },
      });

      return { receipt, entry };
    });

    return {
      id: result.entry.id,
      direction: "INFLOW",
      amountPaise: Number(result.entry.amountPaise),
      category: "FUNDRAISER",
      description: `Fundraiser collection: ${input.reference}`,
      activityId: input.activityId,
      referenceType: "fundraiser_receipt",
      referenceId: result.receipt.id,
      recordedAt: result.entry.occurredAt.toISOString(),
      recordedById: treasurerId,
    };
  }
}

export const financeService = new FinanceService();
