import test from "node:test";
import assert from "node:assert/strict";
import { FinanceService } from "@/lib/services/FinanceService";
import { SnapshotService } from "@/lib/services/SnapshotService";

test("FinanceService & SnapshotService - Ledger Formulas & Handover Immutability", async (t) => {
  const mockCashbookEntries: any[] = [
    { direction: "INFLOW", category: "dues", amountPaise: BigInt(500000), occurredAt: new Date() }, // 5,000 INR
    { direction: "INFLOW", category: "ticket", amountPaise: BigInt(200000), occurredAt: new Date() }, // 2,000 INR
    { direction: "INFLOW", category: "merch", amountPaise: BigInt(300000), occurredAt: new Date() }, // 3,000 INR
    { direction: "INFLOW", category: "fundraiser_cash", amountPaise: BigInt(100000), occurredAt: new Date() }, // 1,000 INR
    { direction: "OUTFLOW", category: "claim_payout", amountPaise: BigInt(250000), occurredAt: new Date() }, // 2,500 INR
  ];

  const mockApprovedClaims: any[] = [
    { id: "claim-1", status: "approved", amountPaise: BigInt(150000) }, // 1,500 INR pending obligation
  ];

  const mockSnapshots: any[] = [];

  const fakePrisma: any = {
    cashbookEntry: {
      findMany: async () => mockCashbookEntries,
      create: async ({ data }: any) => {
        const item = { id: `ce-${mockCashbookEntries.length + 1}`, ...data };
        mockCashbookEntries.push(item);
        return item;
      },
    },
    claim: {
      findMany: async () => mockApprovedClaims,
      count: async () => 1,
    },
    activity: {
      findUnique: async () => ({ id: "act-bake-sale", title: "Campus Bake Sale" }),
      count: async () => 3,
    },
    fundraiserReceipt: {
      create: async ({ data }: any) => ({ id: "fr-1", ...data }),
    },
    clubSettings: {
      findFirst: async () => ({ name: "Skyline Student Association" }),
    },
    membership: {
      count: async () => 25,
    },
    handoverSnapshot: {
      create: async ({ data }: any) => {
        const item = { id: `snap-${mockSnapshots.length + 1}`, ...data, generatedAt: new Date() };
        mockSnapshots.push(item);
        return item;
      },
      findMany: async () => mockSnapshots,
    },
    $transaction: async (fn: any) => fn(fakePrisma),
  };

  const financeService = new FinanceService();
  const snapshotService = new SnapshotService();
  const originalPrisma = (globalThis as any).prismaGlobal;
  (globalThis as any).prismaGlobal = fakePrisma;

  await t.test("calculates accurate financial totals, pending obligations, and true available funds", async () => {
    const summary = await financeService.getSummary();

    // Inflow: 5000 + 2000 + 3000 + 1000 = 11000 INR = 1,100,000 paise
    assert.equal(summary.totalInflowPaise, 1100000);
    // Outflow: 2500 INR = 250,000 paise
    assert.equal(summary.totalOutflowPaise, 250000);
    // Net balance: 1100000 - 250000 = 850,000 paise (8,500 INR)
    assert.equal(summary.netBalancePaise, 850000);
    // Pending obligations: approved claim = 150,000 paise (1,500 INR)
    assert.equal(summary.pendingObligationsPaise, 150000);
    // True available: 850000 - 150000 = 700,000 paise (7,000 INR)
    assert.equal(summary.trueAvailablePaise, 700000);
    // Category checks
    assert.equal(summary.membershipRevenuePaise, 500000);
    assert.equal(summary.ticketRevenuePaise, 200000);
    assert.equal(summary.merchandiseRevenuePaise, 300000);
    assert.equal(summary.fundraiserRevenuePaise, 100000);
  });

  await t.test("recording a fundraiser receipt generates both a receipt and a cashbook INFLOW", async () => {
    const entry = await financeService.recordFundraiserReceipt("treasurer-1", {
      activityId: "act-bake-sale",
      amountPaise: 50000, // 500 INR
      reference: "BAKE-SALE-BOX-A",
    });

    assert.equal(entry.direction, "INFLOW");
    assert.equal(entry.category, "FUNDRAISER");
    assert.equal(entry.amountPaise, 50000);
  });

  await t.test("generates immutable handover snapshot with serialized club state", async () => {
    const snapshot = await snapshotService.generateSnapshot(
      "officer-pres",
      "Outgoing 2025-26 Committee Handover"
    );

    assert.equal(snapshot.generatedById, "officer-pres");
    assert.equal(snapshot.notes, "Outgoing 2025-26 Committee Handover");
    assert.equal(snapshot.snapshotJson.activeMembersCount, 25);
    assert.equal(snapshot.snapshotJson.publishedActivitiesCount, 3);
    assert(snapshot.snapshotJson.financialSummary !== undefined);
  });

  (globalThis as any).prismaGlobal = originalPrisma;
});
