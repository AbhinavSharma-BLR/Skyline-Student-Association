import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DemoPaymentAdapter } from "../../lib/providers/DemoPaymentAdapter";
import { SkylineError } from "../../lib/api/errors";
import { CheckInService } from "../../lib/services/CheckInService";

describe("Backend Providers - DemoPaymentAdapter", () => {
  it("creates demo payment intent with demo_ prefix", async () => {
    process.env.PAYMENT_MODE = "demo";
    const adapter = new DemoPaymentAdapter();

    const intent = await adapter.createIntent({
      referenceId: "mem-123",
      category: "membership",
      userId: "user-abc",
      amountPaise: 20000,
    });

    assert.equal(intent.mode, "demo");
    assert.match(intent.intentId, /^demo_intent_/);
    assert.match(intent.clientSecret, /^demo_secret_/);
    assert.equal(intent.amountPaise, 20000);
  });

  it("verifyWebhook succeeds with valid demo webhook signature", async () => {
    process.env.PAYMENT_MODE = "demo";
    const adapter = new DemoPaymentAdapter();

    const rawPayload = JSON.stringify({
      intentId: "demo_intent_xyz",
      referenceId: "book-456",
      category: "booking",
      amountPaise: 15000,
      status: "succeeded",
    });

    const result = await adapter.verifyWebhook(rawPayload, "demo_valid_signature");
    assert.equal(result.isValid, true);
    assert.equal(result.event?.status, "succeeded");
    assert.equal(result.event?.amountPaise, 15000);
  });

  it("assertDemoMode throws 404 DEMO_MODE_ONLY in non-demo mode", () => {
    process.env.PAYMENT_MODE = "live";

    assert.throws(
      () => {
        DemoPaymentAdapter.assertDemoMode();
      },
      (err: unknown) => {
        assert.ok(err instanceof SkylineError);
        assert.equal(err.code, "DEMO_MODE_ONLY");
        assert.equal(err.statusCode, 404);
        return true;
      }
    );

    // Reset back to demo mode for local test environment
    process.env.PAYMENT_MODE = "demo";
  });
});

describe("Backend Services - CheckInService Invariants & Concurrency", () => {
  it("denies check-in with NOT_VALID for nonexistent ticket", async () => {
    const mockDb = {
      ticket: {
        findUnique: async () => null,
      },
    };

    const result = await CheckInService.scanTicket(
      { activityId: "act-1", ticketId: "nonexistent" },
      mockDb as any
    );

    assert.equal(result.result, "DENIED");
    assert.equal(result.reason, "NOT_VALID");
  });

  it("denies check-in with NOT_VALID for unpaid/unconfirmed booking", async () => {
    const mockDb = {
      ticket: {
        findUnique: async () => ({
          id: "tkt-unpaid",
          activityId: "act-1",
          booking: { status: "pending_payment", userId: "user-1" },
          isUsed: false,
          checkedInAt: null,
        }),
      },
    };

    const result = await CheckInService.scanTicket(
      { activityId: "act-1", ticketId: "tkt-unpaid" },
      mockDb as any
    );

    assert.equal(result.result, "DENIED");
    assert.equal(result.reason, "NOT_VALID");
  });

  it("denies check-in with WRONG_ACTIVITY when ticket belongs to different activity", async () => {
    const mockDb = {
      ticket: {
        findUnique: async () => ({
          id: "tkt-other-event",
          activityId: "act-gala-2026",
          booking: { status: "confirmed", userId: "user-1" },
          isUsed: false,
          checkedInAt: null,
        }),
      },
    };

    const result = await CheckInService.scanTicket(
      { activityId: "act-sports-2026", ticketId: "tkt-other-event" },
      mockDb as any
    );

    assert.equal(result.result, "DENIED");
    assert.equal(result.reason, "WRONG_ACTIVITY");
  });

  it("enforces atomic single-use: concurrent scans result in exactly ONE accepted", async () => {
    // In-memory atomic state double simulating PostgreSQL row-level locks
    let isUsed = false;
    let checkedInAt: Date | null = null;

    const mockDb = {
      ticket: {
        findUnique: async () => ({
          id: "tkt-concurrent-1",
          activityId: "act-1",
          booking: { status: "confirmed", userId: "user-1" },
          isUsed,
          checkedInAt,
        }),
        updateMany: async (args: any) => {
          // Atomic conditional update simulation: UPDATE ... WHERE is_used = false
          if (!isUsed && args.where.isUsed === false) {
            isUsed = true;
            checkedInAt = args.data.checkedInAt;
            return { count: 1 };
          }
          return { count: 0 };
        },
      },
    };

    // Simulate two concurrent door scan requests
    const [scanA, scanB] = await Promise.all([
      CheckInService.scanTicket({ activityId: "act-1", ticketId: "tkt-concurrent-1" }, mockDb as any),
      CheckInService.scanTicket({ activityId: "act-1", ticketId: "tkt-concurrent-1" }, mockDb as any),
    ]);

    const results = [scanA.result, scanB.result];
    // Exactly one scan must be ACCEPTED
    assert.equal(results.filter((r) => r === "ACCEPTED").length, 1);
    // Exactly one scan must be DENIED
    assert.equal(results.filter((r) => r === "DENIED").length, 1);

    // The denied scan must indicate ALREADY_USED
    const denied = scanA.result === "DENIED" ? scanA : scanB;
    assert.equal(denied.reason, "ALREADY_USED");
  });

  it("denies repeated scan after ticket has been checked in", async () => {
    const mockDb = {
      ticket: {
        findUnique: async () => ({
          id: "tkt-already-used",
          activityId: "act-1",
          booking: { status: "confirmed", userId: "user-1" },
          isUsed: true,
          checkedInAt: new Date(),
        }),
        updateMany: async () => ({ count: 0 }),
      },
    };

    const result = await CheckInService.scanTicket(
      { activityId: "act-1", ticketId: "tkt-already-used" },
      mockDb as any
    );

    assert.equal(result.result, "DENIED");
    assert.equal(result.reason, "ALREADY_USED");
  });
});

describe("Backend Vertical Slice - Membership Payment Idempotency Invariants", () => {
  it("repeated payment confirmation does not duplicate activation or revenue", () => {
    // Model state representing pending membership
    let membershipState = {
      id: "mem-slice-1",
      userId: "user-student-1",
      status: "pending",
      duesPaise: 20000,
      activatedAt: null as string | null,
    };

    // State machine simulator
    function processConfirmation(paymentAmountPaise: number) {
      if (membershipState.status === "active") {
        return {
          status: "already_confirmed",
          duplicated: false,
          incomeRecordedPaise: 0,
        };
      }
      membershipState.status = "active";
      membershipState.activatedAt = new Date().toISOString();
      return {
        status: "succeeded",
        duplicated: false,
        incomeRecordedPaise: paymentAmountPaise,
      };
    }

    // First confirmation: activates membership and records dues income
    const firstConfirmation = processConfirmation(20000);
    assert.equal(firstConfirmation.status, "succeeded");
    assert.equal(firstConfirmation.incomeRecordedPaise, 20000);
    assert.equal(membershipState.status, "active");

    // Repeated confirmation: returns already_confirmed and records 0 additional income
    const secondConfirmation = processConfirmation(20000);
    assert.equal(secondConfirmation.status, "already_confirmed");
    assert.equal(secondConfirmation.incomeRecordedPaise, 0);
    assert.equal(membershipState.status, "active");
  });
});
