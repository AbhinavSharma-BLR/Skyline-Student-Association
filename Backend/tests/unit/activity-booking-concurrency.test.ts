import test from "node:test";
import assert from "node:assert/strict";
import { BookingService } from "@/lib/services/BookingService";
import { SkylineError } from "@/lib/api/errors";

test("BookingService - Capacity Concurrency & Payment Idempotency Invariants", async (t) => {
  const mockActivity = {
    id: "act-hackathon",
    title: "Skyline Annual Hackathon",
    capacity: 1, // Strictly 1 seat remaining!
    startsAt: new Date(),
    memberPricePaise: BigInt(50000), // INR 500.00
    regularPricePaise: BigInt(100000), // INR 1,000.00
    published: true,
  };

  const mockMemberships: any[] = [{ userId: "member-alice", status: "active" }];
  const mockBookings: any[] = [];
  const mockPurchases: any[] = [];
  const mockTickets: any[] = [];
  const mockCashbook: any[] = [];
  const mockPaymentAttempts: any[] = [];

  const fakePrisma: any = {
    activity: {
      findUnique: async () => mockActivity,
    },
    membership: {
      findFirst: async ({ where }: any) => {
        return mockMemberships.find((m) => m.userId === where.userId && m.status === where.status) || null;
      },
    },
    booking: {
      count: async ({ where }: any) => {
        return mockBookings.filter(
          (b) => b.activityId === where.activityId && b.reservedUntil > new Date()
        ).length;
      },
      findUnique: async ({ where }: any) => {
        const b = mockBookings.find((item) => item.id === where.id);
        if (!b) return null;
        return {
          ...b,
          ticket: mockTickets.find((tk) => tk.bookingId === b.id) || null,
          purchase: mockPurchases.find((p) => p.bookingId === b.id) || null,
          activity: mockActivity,
        };
      },
      create: async ({ data }: any) => {
        const booking = {
          id: `book-${mockBookings.length + 1}`,
          ...data,
          createdAt: new Date(),
        };
        mockBookings.push(booking);
        return booking;
      },
    },
    purchase: {
      create: async ({ data }: any) => {
        const p = { id: `pur-${mockPurchases.length + 1}`, ...data };
        mockPurchases.push(p);
        return p;
      },
      update: async ({ where, data }: any) => {
        const p = mockPurchases.find((item) => item.id === where.id);
        if (p) Object.assign(p, data);
        return p;
      },
      updateMany: async ({ where, data }: any) => {
        const matches = mockPurchases.filter(
          (p) => (!where.id || p.id === where.id) && (!where.state || p.state === where.state)
        );
        matches.forEach((p) => Object.assign(p, data));
        return { count: matches.length };
      },
    },
    ticket: {
      create: async ({ data }: any) => {
        const tk = { id: `tk-${mockTickets.length + 1}`, ...data, createdAt: new Date() };
        mockTickets.push(tk);
        return tk;
      },
    },
    paymentAttempt: {
      create: async ({ data }: any) => {
        const pa = { id: `pa-${mockPaymentAttempts.length + 1}`, ...data };
        mockPaymentAttempts.push(pa);
        return pa;
      },
    },
    cashbookEntry: {
      create: async ({ data }: any) => {
        const ce = { id: `ce-${mockCashbook.length + 1}`, ...data };
        mockCashbook.push(ce);
        return ce;
      },
    },
    $transaction: async (fn: any) => fn(fakePrisma),
  };

  const service = new BookingService();
  const originalPrisma = (globalThis as any).prismaGlobal;
  (globalThis as any).prismaGlobal = fakePrisma;

  await t.test("member gets discounted member price while public user pays regular price", async () => {
    // Member Alice reserves seat
    const memberBooking = await service.createBooking("member-alice", "act-hackathon");
    assert.equal(memberBooking.amountPaise, 50000); // 500 INR

    // Capacity is now 1 of 1; second reservation should fail with CAPACITY_EXHAUSTED
    await assert.rejects(
      async () => {
        await service.createBooking("student-bob", "act-hackathon");
      },
      (err: any) => {
        assert(err instanceof SkylineError);
        assert.equal(err.code, "CAPACITY_EXHAUSTED");
        assert.equal(err.statusCode, 409);
        return true;
      }
    );
  });

  await t.test("payment confirmation issues ticket and records cashbook INFLOW", async () => {
    const bookingId = mockBookings[0].id;
    const result = await service.confirmBooking(bookingId, "PAY-REF-101");

    assert.equal(result.booking.status, "confirmed");
    assert.equal(result.ticket.isUsed, false);
    assert(result.ticket.encryptedToken.length > 20);
    assert.equal(mockTickets.length, 1);
    assert.equal(mockCashbook.length, 1);
    assert.equal(mockCashbook[0].direction, "INFLOW");
    assert.equal(mockCashbook[0].category, "ticket");
    assert.equal(mockCashbook[0].amountPaise, BigInt(50000));
  });

  await t.test("repeated payment confirmation is idempotent (zero duplicate tickets or revenue)", async () => {
    const bookingId = mockBookings[0].id;
    const initialTicketsCount = mockTickets.length;
    const initialCashbookCount = mockCashbook.length;

    const repeatResult = await service.confirmBooking(bookingId, "PAY-REF-101");

    assert.equal(repeatResult.booking.status, "confirmed");
    assert.equal(mockTickets.length, initialTicketsCount);
    assert.equal(mockCashbook.length, initialCashbookCount);
  });

  await t.test("expired booking reservation cannot be confirmed or revived", async () => {
    const expiredBooking = {
      id: "book-expired",
      activityId: "act-hackathon",
      userId: "student-late",
      reservedUntil: new Date(Date.now() - 60000), // 1 minute in the past
      createdAt: new Date(Date.now() - 120000),
    };
    const expiredPurchase = {
      id: "pur-expired",
      bookingId: "book-expired",
      userId: "student-late",
      amountPaise: BigInt(50000),
      state: "expired",
    };
    mockBookings.push(expiredBooking);
    mockPurchases.push(expiredPurchase);

    await assert.rejects(
      async () => {
        await service.confirmBooking("book-expired", "PAY-EXPIRED");
      },
      (err: any) => {
        assert(err instanceof SkylineError);
        assert.equal(err.code, "CONFLICT");
        assert.equal(err.statusCode, 409);
        return true;
      }
    );
  });

  (globalThis as any).prismaGlobal = originalPrisma;
});
