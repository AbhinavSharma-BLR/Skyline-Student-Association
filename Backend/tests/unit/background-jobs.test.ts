import test from "node:test";
import assert from "node:assert/strict";
import { JobRunnerService } from "@/lib/services/JobRunnerService";

test("JobRunnerService - Idempotent Expiry & Email Retry Backoff", async (t) => {
  const pastDate = new Date(Date.now() - 30 * 60 * 1000); // 30 mins ago
  const futureDate = new Date(Date.now() + 30 * 60 * 1000); // 30 mins from now

  const mockPurchases: any[] = [
    { id: "pur-stale-book", state: "pending" },
    { id: "pur-stale-order", state: "pending" },
    { id: "pur-active-book", state: "pending" },
    { id: "pur-confirmed", state: "confirmed" },
  ];

  const mockBookings: any[] = [
    { id: "book-stale", reservedUntil: pastDate, purchase: mockPurchases[0] },
    { id: "book-active", reservedUntil: futureDate, purchase: mockPurchases[2] },
  ];

  const mockVariants: any[] = [
    { id: "var-1", stockReserved: 2 },
  ];

  const mockOrders: any[] = [
    {
      id: "ord-stale",
      reservedUntil: pastDate,
      purchase: mockPurchases[1],
      items: [{ variantId: "var-1", quantity: 2 }],
    },
  ];

  const mockEmailJobs: any[] = [
    {
      id: "ej-1",
      recipientId: "alice@campus.edu",
      kind: "announcement",
      sourceKey: "ann-1",
      state: "queued",
      attempts: 0,
    },
    {
      id: "ej-2",
      recipientId: "bad-email", // Will simulate retryable failure
      kind: "renewal_reminder",
      sourceKey: "rem-1",
      state: "failed",
      attempts: 4,
      nextAttemptAt: pastDate,
    },
  ];

  const fakePrisma: any = {
    booking: {
      findMany: async ({ where }: any) => {
        return mockBookings.filter((b) => {
          if (where.reservedUntil?.lt && b.reservedUntil >= where.reservedUntil.lt) return false;
          if (where.purchase?.state && b.purchase?.state !== where.purchase.state) return false;
          return true;
        });
      },
    },
    order: {
      findMany: async ({ where }: any) => {
        return mockOrders.filter((o) => {
          if (where.reservedUntil?.lt && o.reservedUntil >= where.reservedUntil.lt) return false;
          if (where.purchase?.state && o.purchase?.state !== where.purchase.state) return false;
          return true;
        });
      },
    },
    purchase: {
      updateMany: async ({ where, data }: any) => {
        const item = mockPurchases.find((p) => p.id === where.id && p.state === where.state);
        if (item) {
          item.state = data.state;
          return { count: 1 };
        }
        return { count: 0 };
      },
    },
    variant: {
      update: async ({ where, data }: any) => {
        const v = mockVariants.find((v) => v.id === where.id);
        if (v && data.stockReserved?.decrement) {
          v.stockReserved -= data.stockReserved.decrement;
        }
        return v;
      },
    },
    emailJob: {
      findMany: async () => mockEmailJobs,
      update: async ({ where, data }: any) => {
        const j = mockEmailJobs.find((j) => j.id === where.id);
        if (j) Object.assign(j, data);
        return j;
      },
    },
    $transaction: async (fn: any) => fn(fakePrisma),
  };

  const service = new JobRunnerService();
  const originalPrisma = (globalThis as any).prismaGlobal;
  (globalThis as any).prismaGlobal = fakePrisma;

  await t.test("expires stale bookings without touching active holds or confirmed records", async () => {
    const expiredCount = await service.expireStaleBookings();
    assert.equal(expiredCount, 1);
    assert.equal(mockPurchases[0].state, "expired"); // Stale hold expired
    assert.equal(mockPurchases[2].state, "pending"); // Active hold untouched
    assert.equal(mockPurchases[3].state, "confirmed"); // Confirmed record untouched
  });

  await t.test("expires stale orders and rolls back reserved variant stock", async () => {
    const expiredCount = await service.expireStaleOrders();
    assert.equal(expiredCount, 1);
    assert.equal(mockPurchases[1].state, "expired");
    assert.equal(mockVariants[0].stockReserved, 0); // Reserved inventory returned to pool
  });

  await t.test("processes email jobs: marks valid sent and transitions max-retried to terminal", async () => {
    const report = await service.processEmailJobs();
    assert.equal(report.processed, 2);
    assert.equal(report.sent, 1); // ej-1 sent
    assert.equal(mockEmailJobs[0].state, "sent");

    // ej-2 had 4 attempts, failing attempt 5 transitions to terminal
    assert.equal(mockEmailJobs[1].state, "terminal");
  });

  (globalThis as any).prismaGlobal = originalPrisma;
});
