import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../lib/prisma";
import { jobRunnerService } from "../../lib/services/JobRunnerService";
import { orderService } from "../../lib/services/OrderService";

const BASE_URL = "http://localhost:3000";
const ORIGIN = "http://localhost:3000";

interface AuthSession {
  cookie: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

/**
 * Tracks exact IDs of records created during a test run to guarantee
 * that cleanup deletes strictly owned entities and never sweeps
 * by broad prefix or mutates seeded demo accounts.
 */
class TestResourceTracker {
  readonly runId: string;
  readonly userIds = new Set<string>();
  readonly purchaseIds = new Set<string>();
  readonly paymentAttemptIds = new Set<string>();
  readonly cashbookEntryIds = new Set<string>();
  readonly bookingIds = new Set<string>();
  readonly ticketIds = new Set<string>();
  readonly orderIds = new Set<string>();
  readonly orderItemIds = new Set<string>();
  readonly claimIds = new Set<string>();
  readonly receiptFileIds = new Set<string>();
  readonly membershipIds = new Set<string>();
  readonly activityIds = new Set<string>();
  readonly productIds = new Set<string>();
  readonly variantIds = new Set<string>();

  constructor(runId: string) {
    this.runId = runId;
  }

  trackUser(id?: string) { if (id) this.userIds.add(id); }
  trackPurchase(id?: string) { if (id) this.purchaseIds.add(id); }
  trackPaymentAttempt(id?: string) { if (id) this.paymentAttemptIds.add(id); }
  trackCashbookEntry(id?: string) { if (id) this.cashbookEntryIds.add(id); }
  trackBooking(id?: string) { if (id) this.bookingIds.add(id); }
  trackTicket(id?: string) { if (id) this.ticketIds.add(id); }
  trackOrder(id?: string) { if (id) this.orderIds.add(id); }
  trackOrderItem(id?: string) { if (id) this.orderItemIds.add(id); }
  trackClaim(id?: string) { if (id) this.claimIds.add(id); }
  trackReceiptFile(id?: string) { if (id) this.receiptFileIds.add(id); }
  trackMembership(id?: string) { if (id) this.membershipIds.add(id); }
  trackActivity(id?: string) { if (id) this.activityIds.add(id); }
  trackProduct(id?: string) { if (id) this.productIds.add(id); }
  trackVariant(id?: string) { if (id) this.variantIds.add(id); }

  async cleanup(prismaClient: typeof prisma) {
    // 1. Delete dependent cashbook entries by tracked IDs or linked test entities
    const hasCashbookFilters =
      this.cashbookEntryIds.size > 0 ||
      this.paymentAttemptIds.size > 0 ||
      this.claimIds.size > 0 ||
      this.purchaseIds.size > 0 ||
      this.membershipIds.size > 0 ||
      this.bookingIds.size > 0 ||
      this.orderIds.size > 0 ||
      this.userIds.size > 0;

    if (hasCashbookFilters) {
      await prismaClient.cashbookEntry.deleteMany({
        where: {
          OR: [
            ...(this.cashbookEntryIds.size > 0 ? [{ id: { in: Array.from(this.cashbookEntryIds) } }] : []),
            ...(this.paymentAttemptIds.size > 0 ? [{ paymentAttemptId: { in: Array.from(this.paymentAttemptIds) } }] : []),
            ...(this.claimIds.size > 0 ? [{ claimId: { in: Array.from(this.claimIds) } }] : []),
            ...(this.purchaseIds.size > 0 ? [{ paymentAttempt: { purchaseId: { in: Array.from(this.purchaseIds) } } }] : []),
            ...(this.orderIds.size > 0 ? [{ paymentAttempt: { purchase: { orderId: { in: Array.from(this.orderIds) } } } }] : []),
            ...(this.bookingIds.size > 0 ? [{ paymentAttempt: { purchase: { bookingId: { in: Array.from(this.bookingIds) } } } }] : []),
            ...(this.membershipIds.size > 0 ? [{ paymentAttempt: { purchase: { membershipId: { in: Array.from(this.membershipIds) } } } }] : []),
            ...(this.userIds.size > 0 ? [{ paymentAttempt: { purchase: { userId: { in: Array.from(this.userIds) } } } }] : []),
            ...(this.userIds.size > 0 ? [{ claim: { claimantId: { in: Array.from(this.userIds) } } }] : []),
          ],
        },
      });
    }

    // 2. Delete payment attempts
    const hasPaymentAttemptFilters =
      this.paymentAttemptIds.size > 0 ||
      this.purchaseIds.size > 0 ||
      this.membershipIds.size > 0 ||
      this.bookingIds.size > 0 ||
      this.orderIds.size > 0 ||
      this.userIds.size > 0;

    if (hasPaymentAttemptFilters) {
      await prismaClient.paymentAttempt.deleteMany({
        where: {
          OR: [
            ...(this.paymentAttemptIds.size > 0 ? [{ id: { in: Array.from(this.paymentAttemptIds) } }] : []),
            ...(this.purchaseIds.size > 0 ? [{ purchaseId: { in: Array.from(this.purchaseIds) } }] : []),
            ...(this.orderIds.size > 0 ? [{ purchase: { orderId: { in: Array.from(this.orderIds) } } }] : []),
            ...(this.bookingIds.size > 0 ? [{ purchase: { bookingId: { in: Array.from(this.bookingIds) } } }] : []),
            ...(this.membershipIds.size > 0 ? [{ purchase: { membershipId: { in: Array.from(this.membershipIds) } } }] : []),
            ...(this.userIds.size > 0 ? [{ purchase: { userId: { in: Array.from(this.userIds) } } }] : []),
          ],
        },
      });
    }

    // 3. Delete purchases (must be deleted BEFORE referenced memberships, bookings, orders)
    const hasPurchaseFilters =
      this.purchaseIds.size > 0 ||
      this.membershipIds.size > 0 ||
      this.bookingIds.size > 0 ||
      this.orderIds.size > 0 ||
      this.userIds.size > 0;

    if (hasPurchaseFilters) {
      await prismaClient.purchase.deleteMany({
        where: {
          OR: [
            ...(this.purchaseIds.size > 0 ? [{ id: { in: Array.from(this.purchaseIds) } }] : []),
            ...(this.membershipIds.size > 0 ? [{ membershipId: { in: Array.from(this.membershipIds) } }] : []),
            ...(this.bookingIds.size > 0 ? [{ bookingId: { in: Array.from(this.bookingIds) } }] : []),
            ...(this.orderIds.size > 0 ? [{ orderId: { in: Array.from(this.orderIds) } }] : []),
            ...(this.userIds.size > 0 ? [{ userId: { in: Array.from(this.userIds) } }] : []),
          ],
        },
      });
    }

    // 4. Delete tickets
    if (this.ticketIds.size > 0 || this.bookingIds.size > 0 || this.userIds.size > 0) {
      await prismaClient.ticket.deleteMany({
        where: {
          OR: [
            ...(this.ticketIds.size > 0 ? [{ id: { in: Array.from(this.ticketIds) } }] : []),
            ...(this.bookingIds.size > 0 ? [{ bookingId: { in: Array.from(this.bookingIds) } }] : []),
            ...(this.userIds.size > 0 ? [{ booking: { userId: { in: Array.from(this.userIds) } } }] : []),
          ],
        },
      });
    }

    // 5. Delete bookings
    if (this.bookingIds.size > 0 || this.activityIds.size > 0 || this.userIds.size > 0) {
      await prismaClient.booking.deleteMany({
        where: {
          OR: [
            ...(this.bookingIds.size > 0 ? [{ id: { in: Array.from(this.bookingIds) } }] : []),
            ...(this.activityIds.size > 0 ? [{ activityId: { in: Array.from(this.activityIds) } }] : []),
            ...(this.userIds.size > 0 ? [{ userId: { in: Array.from(this.userIds) } }] : []),
          ],
        },
      });
    }

    // 6. Delete order items & orders
    if (this.orderItemIds.size > 0 || this.orderIds.size > 0 || this.variantIds.size > 0 || this.userIds.size > 0) {
      await prismaClient.orderItem.deleteMany({
        where: {
          OR: [
            ...(this.orderItemIds.size > 0 ? [{ id: { in: Array.from(this.orderItemIds) } }] : []),
            ...(this.orderIds.size > 0 ? [{ orderId: { in: Array.from(this.orderIds) } }] : []),
            ...(this.variantIds.size > 0 ? [{ variantId: { in: Array.from(this.variantIds) } }] : []),
            ...(this.userIds.size > 0 ? [{ order: { userId: { in: Array.from(this.userIds) } } }] : []),
          ],
        },
      });
    }
    if (this.orderIds.size > 0 || this.userIds.size > 0) {
      await prismaClient.order.deleteMany({
        where: {
          OR: [
            ...(this.orderIds.size > 0 ? [{ id: { in: Array.from(this.orderIds) } }] : []),
            ...(this.userIds.size > 0 ? [{ userId: { in: Array.from(this.userIds) } }] : []),
          ],
        },
      });
    }

    // 7. Delete receipts & claims
    if (this.receiptFileIds.size > 0 || this.claimIds.size > 0 || this.userIds.size > 0) {
      await prismaClient.receiptFile.deleteMany({
        where: {
          OR: [
            ...(this.receiptFileIds.size > 0 ? [{ id: { in: Array.from(this.receiptFileIds) } }] : []),
            ...(this.claimIds.size > 0 ? [{ claimId: { in: Array.from(this.claimIds) } }] : []),
            ...(this.userIds.size > 0 ? [{ userId: { in: Array.from(this.userIds) } }] : []),
          ],
        },
      });
    }
    if (this.claimIds.size > 0 || this.userIds.size > 0) {
      await prismaClient.claim.deleteMany({
        where: {
          OR: [
            ...(this.claimIds.size > 0 ? [{ id: { in: Array.from(this.claimIds) } }] : []),
            ...(this.userIds.size > 0 ? [{ claimantId: { in: Array.from(this.userIds) } }] : []),
          ],
        },
      });
    }

    // 8. Delete memberships
    if (this.membershipIds.size > 0 || this.userIds.size > 0) {
      await prismaClient.membership.deleteMany({
        where: {
          OR: [
            ...(this.membershipIds.size > 0 ? [{ id: { in: Array.from(this.membershipIds) } }] : []),
            ...(this.userIds.size > 0 ? [{ userId: { in: Array.from(this.userIds) } }] : []),
          ],
        },
      });
    }

    // 9. Delete activities & products
    if (this.activityIds.size > 0) {
      await prismaClient.booking.deleteMany({
        where: { activityId: { in: Array.from(this.activityIds) } },
      });
      await prismaClient.activityStaff.deleteMany({
        where: { activityId: { in: Array.from(this.activityIds) } },
      });
      await prismaClient.activity.deleteMany({
        where: { id: { in: Array.from(this.activityIds) } },
      });
    }
    if (this.productIds.size > 0 || this.variantIds.size > 0) {
      await prismaClient.orderItem.deleteMany({
        where: { variantId: { in: Array.from(this.variantIds) } },
      });
      await prismaClient.variant.deleteMany({
        where: {
          OR: [
            ...(this.variantIds.size > 0 ? [{ id: { in: Array.from(this.variantIds) } }] : []),
            ...(this.productIds.size > 0 ? [{ productId: { in: Array.from(this.productIds) } }] : []),
          ],
        },
      });
      await prismaClient.product.deleteMany({
        where: { id: { in: Array.from(this.productIds) } },
      });
    }

    // 10. Delete users and their direct auth associations
    if (this.userIds.size > 0) {
      const uIds = Array.from(this.userIds);
      await prismaClient.session.deleteMany({ where: { userId: { in: uIds } } });
      await prismaClient.account.deleteMany({ where: { userId: { in: uIds } } });
      await prismaClient.role.deleteMany({ where: { userId: { in: uIds } } });
      await prismaClient.user.deleteMany({ where: { id: { in: uIds } } });
    }
  }
}

/**
 * Helper to authenticate or sign up via HTTP fetch with Origin header for CSRF
 */
async function authenticateUser(
  email: string,
  password: string,
  name?: string,
  tracker?: TestResourceTracker
): Promise<AuthSession> {
  // First attempt sign-in
  let res = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: ORIGIN,
    },
    body: JSON.stringify({ email, password }),
  });

  // If user doesn't exist, sign up
  if (res.status === 400 || res.status === 401 || res.status === 404) {
    res = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: ORIGIN,
      },
      body: JSON.stringify({
        email,
        password,
        name: name || "Test User",
      }),
    });
  }

  assert.equal(
    res.status,
    200,
    `Expected 200 OK during authentication for ${email}, got ${res.status}`
  );

  const cookie = res.headers.get("set-cookie") || "";
  assert.ok(cookie.includes("better-auth.session_token"), "Must receive session cookie");

  const data = await res.json();
  if (tracker && data.user?.id) {
    tracker.trackUser(data.user.id);
  }
  return {
    cookie,
    user: data.user,
  };
}

describe("Real PostgreSQL Database Workflows (E2E Integration)", () => {
  const tracker = new TestResourceTracker(`run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

  let studentSession: AuthSession;
  let officerSession: AuthSession;
  let treasurerSession: AuthSession;
  let activePeriodId: string;
  let duesAmountPaise: number;
  let testActivityId: string;
  let testVariantId: string;

  before(async () => {
    // Verify database connectivity
    await prisma.$queryRaw`SELECT 1`;

    // Authenticate demo users (seeded via seed.ts - NOT tracked, never deleted)
    studentSession = await authenticateUser("student@skyline.edu", "StudentPassword123!", "Sam Student");
    officerSession = await authenticateUser("officer@skyline.edu", "OfficerPassword123!", "Olivia Officer");
    treasurerSession = await authenticateUser("treasurer@skyline.edu", "TreasurerPassword123!", "Trevor Treasurer");

    // Fetch active membership period
    const period = await prisma.membershipPeriod.findFirst({
      where: { academicYear: "2026-2027" },
    });
    assert.ok(period, "Seeded membership period 2026-2027 must exist in PostgreSQL");
    activePeriodId = period.id;
    duesAmountPaise = Number(period.duesPaise);

    // Fetch seeded activity
    const activity = await prisma.activity.findFirst({
      where: { title: { contains: "Hackathon" } },
    });
    assert.ok(activity, "Seeded hackathon activity must exist in PostgreSQL");
    testActivityId = activity.id;

    // Fetch seeded merchandise variant
    const variant = await prisma.variant.findFirst({
      where: { size: "M" },
      include: { product: true },
    });
    assert.ok(variant, "Seeded M size variant must exist in PostgreSQL");
    testVariantId = variant.id;
  });

  after(async () => {
    // Clean up ONLY tracked records explicitly registered during this test run.
    // Zero broad prefix searches (no startsWith "test_", "buyer", or "racer").
    await tracker.cleanup(prisma);
  });

  // =========================================================================
  // WORKFLOW A: AUTH
  // =========================================================================
  describe("A. Real Authentication Workflows in PostgreSQL", () => {
    const testEmail = `test_auth_${Date.now()}@skyline.edu`;
    const testPassword = "PasswordSecure999!";
    let testCookie = "";
    let testUserId = "";

    it("Signup creates a real user in PostgreSQL without officer/treasurer permissions", async () => {
      const signupRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: ORIGIN },
        body: JSON.stringify({
          name: "Fresh Student",
          email: testEmail,
          password: testPassword,
        }),
      });

      assert.equal(signupRes.status, 200);
      const signupData = await signupRes.json();
      testUserId = signupData.user.id;
      assert.ok(testUserId, "Must return created user ID");
      tracker.trackUser(testUserId);

      // Verify row persisted directly in PostgreSQL
      const dbUser = await prisma.user.findUnique({ where: { id: testUserId } });
      assert.ok(dbUser, "User row must exist in PostgreSQL users table");
      assert.equal(dbUser.email, testEmail);

      // Verify security rule: Public signup must not grant officer or treasurer permissions
      const dbRoles = await prisma.role.findMany({ where: { userId: testUserId } });
      assert.equal(dbRoles.length, 0, "Public signup must not grant any administrative roles");
    });

    it("Login authenticates against PostgreSQL password hash and issues session cookie", async () => {
      const loginRes = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: ORIGIN },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });

      assert.equal(loginRes.status, 200);
      testCookie = loginRes.headers.get("set-cookie") || "";
      assert.ok(testCookie.includes("better-auth.session_token"));

      // Verify session row exists in PostgreSQL
      const dbSession = await prisma.session.findFirst({
        where: { userId: testUserId },
      });
      assert.ok(dbSession, "Session row must be persisted in PostgreSQL session table");
      assert.ok(dbSession.expiresAt > new Date(), "Session expiration must be in the future");
    });

    it("Authenticated /api/v1/me returns the active session and user data", async () => {
      const meRes = await fetch(`${BASE_URL}/api/v1/me`, {
        headers: { cookie: testCookie },
      });

      assert.equal(meRes.status, 200);
      const meData = await meRes.json();
      assert.equal(meData.data.user.email, testEmail);
      assert.equal(meData.data.user.name, "Fresh Student");
    });

    it("Unauthenticated request to protected endpoint is rejected with 401 Unauthorized", async () => {
      const unauthRes = await fetch(`${BASE_URL}/api/v1/me`);
      assert.equal(unauthRes.status, 401);
      const unauthData = await unauthRes.json();
      assert.equal(unauthData.error.code, "UNAUTHORIZED");
    });

    it("Student without treasurer role is rejected from treasurer endpoint with 403 Forbidden", async () => {
      const forbiddenRes = await fetch(`${BASE_URL}/api/v1/finance/summary`, {
        headers: { cookie: testCookie },
      });

      assert.equal(forbiddenRes.status, 403);
      const forbiddenData = await forbiddenRes.json();
      assert.equal(forbiddenData.error.code, "FORBIDDEN");
    });

    it("Logout invalidates session in PostgreSQL and subsequent requests return 401", async () => {
      const logoutRes = await fetch(`${BASE_URL}/api/auth/sign-out`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: testCookie,
          origin: ORIGIN,
        },
        body: JSON.stringify({}),
      });

      assert.equal(logoutRes.status, 200);

      // Subsequent /me returns 401
      const meAfterLogout = await fetch(`${BASE_URL}/api/v1/me`, {
        headers: { cookie: testCookie },
      });
      assert.equal(meAfterLogout.status, 401);
    });
  });

  // =========================================================================
  // WORKFLOW B: MEMBERSHIP & CASHBOOK IDEMPOTENCY
  // =========================================================================
  describe("B. Real Membership Lifecycle & Financial Invariants", () => {
    let memberUser: AuthSession;
    let membershipId: string;
    let purchaseId: string;

    before(async () => {
      const email = `test_member_${Date.now()}@skyline.edu`;
      memberUser = await authenticateUser(email, "MemberPass123!", "Membership Tester", tracker);
    });

    it("Pending membership registration creates pending membership and purchase rows", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/memberships`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: memberUser.cookie,
        },
        body: JSON.stringify({ periodId: activePeriodId }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      membershipId = data.data.id;
      assert.ok(membershipId);
      tracker.trackMembership(membershipId);

      // Inspect PostgreSQL rows
      const dbMembership = await prisma.membership.findUnique({
        where: { id: membershipId },
      });
      assert.ok(dbMembership);
      assert.equal(dbMembership.status, "pending");
    });

    it("Demo payment confirmation activates membership and creates EXACTLY ONE cashbook INFLOW entry", async () => {
      const confirmRes = await fetch(`${BASE_URL}/api/v1/payments/demo-confirm`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: memberUser.cookie,
        },
        body: JSON.stringify({
          referenceId: membershipId,
          category: "membership",
          amountPaise: duesAmountPaise,
        }),
      });

      assert.equal(confirmRes.status, 200);

      // Verify PostgreSQL database rows
      const dbMembership = await prisma.membership.findUnique({
        where: { id: membershipId },
      });
      assert.equal(dbMembership?.status, "active");

      const dbPurchase = await prisma.purchase.findFirst({
        where: { membershipId },
      });
      assert.ok(dbPurchase);
      assert.equal(dbPurchase.state, "confirmed");
      assert.equal(Number(dbPurchase.amountPaise), duesAmountPaise);
      purchaseId = dbPurchase.id;
      tracker.trackPurchase(purchaseId);

      // Verify exactly ONE paymentAttempt
      const attempts = await prisma.paymentAttempt.findMany({
        where: { purchaseId },
      });
      assert.equal(attempts.length, 1);
      assert.equal(attempts[0].state, "confirmed");
      tracker.trackPaymentAttempt(attempts[0].id);

      // Verify exactly ONE cashbook entry
      const cashbookEntries = await prisma.cashbookEntry.findMany({
        where: { paymentAttemptId: attempts[0].id },
      });
      assert.equal(cashbookEntries.length, 1);
      assert.equal(cashbookEntries[0].direction, "INFLOW");
      assert.equal(cashbookEntries[0].category, "dues");
      assert.equal(Number(cashbookEntries[0].amountPaise), duesAmountPaise);
      tracker.trackCashbookEntry(cashbookEntries[0].id);
    });

    it("Retried / concurrent confirmation is strictly idempotent with ZERO duplicate records", async () => {
      const retryRes = await fetch(`${BASE_URL}/api/v1/payments/demo-confirm`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: memberUser.cookie,
        },
        body: JSON.stringify({
          referenceId: membershipId,
          category: "membership",
          amountPaise: duesAmountPaise,
        }),
      });

      assert.equal(retryRes.status, 200);

      // Invariant: Verify still exactly ONE paymentAttempt and ONE cashbook entry
      const attempts = await prisma.paymentAttempt.findMany({
        where: { purchaseId },
      });
      assert.equal(attempts.length, 1, "Must not create duplicate payment attempt");

      const cashbookCount = await prisma.cashbookEntry.count({
        where: { paymentAttemptId: attempts[0].id },
      });
      assert.equal(cashbookCount, 1, "Must not duplicate cashbook revenue");
    });
  });

  // =========================================================================
  // WORKFLOW C: ACTIVITY BOOKING, CHECK-IN & CONCURRENCY
  // =========================================================================
  describe("C. Real Activity Booking, Ticket Issuance, Check-In & Capacity Concurrency", () => {
    let attendee: AuthSession;
    let bookingId: string;
    let ticketId: string;

    before(async () => {
      const email = `test_attendee_${Date.now()}@skyline.edu`;
      attendee = await authenticateUser(email, "AttendeePass123!", "Alice Attendee", tracker);
    });

    it("Reserving activity creates pending booking with reservedUntil window", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/bookings`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: attendee.cookie,
        },
        body: JSON.stringify({ activityId: testActivityId }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      bookingId = data.data.id;
      assert.ok(bookingId);
      tracker.trackBooking(bookingId);

      const dbBooking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { purchase: true },
      });
      assert.ok(dbBooking);
      assert.equal(dbBooking.status, "pending");
      assert.ok(dbBooking.reservedUntil > new Date(), "Must have future reservedUntil window");
    });

    it("Confirming booking transitions state and issues immutable ticket with tokenHash", async () => {
      const confirmRes = await fetch(`${BASE_URL}/api/v1/bookings/${bookingId}/confirm`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: attendee.cookie,
        },
        body: JSON.stringify({ paymentRef: `pay_book_${Date.now()}` }),
      });

      assert.equal(confirmRes.status, 200);
      const data = await confirmRes.json();
      ticketId = data.data.ticket.id;
      assert.ok(ticketId);
      tracker.trackTicket(ticketId);

      // Verify in PostgreSQL
      const dbTicket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: { booking: true },
      });
      assert.ok(dbTicket);
      assert.equal(dbTicket.booking.status, "confirmed");
      assert.ok(dbTicket.tokenHash, "Ticket must have sha256 tokenHash");
      assert.equal(dbTicket.checkedInAt, null, "Ticket should not be checked in yet");
    });

    it("Door check-in by authorized staff successfully marks ticket checkedInAt", async () => {
      const checkinRes = await fetch(`${BASE_URL}/api/v1/tickets/${ticketId}/checkin`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: officerSession.cookie,
        },
        body: JSON.stringify({ activityId: testActivityId }),
      });

      assert.equal(checkinRes.status, 200);
      const data = await checkinRes.json();
      assert.equal(data.data.result, "ACCEPTED");
      assert.ok(data.data.ticket.checkedInAt);

      // Inspect row in PostgreSQL
      const dbTicket = await prisma.ticket.findUnique({ where: { id: ticketId } });
      assert.ok(dbTicket?.checkedInAt, "PostgreSQL checkedInAt timestamp must be set");
      assert.equal(dbTicket?.isUsed, true);
    });

    it("Duplicate ticket scan is rejected with DENIED and ALREADY_USED", async () => {
      const dupRes = await fetch(`${BASE_URL}/api/v1/tickets/${ticketId}/checkin`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: officerSession.cookie,
        },
        body: JSON.stringify({ activityId: testActivityId }),
      });

      assert.equal(dupRes.status, 200);
      const data = await dupRes.json();
      assert.equal(data.data.result, "DENIED");
      assert.equal(data.data.reason, "ALREADY_USED");
    });

    it("Capacity concurrency: simultaneous requests for the last seat cannot oversell", async () => {
      // Create dedicated activity with capacity = 1
      const limitedActivity = await prisma.activity.create({
        data: {
          title: `Capacity Test ${Date.now()}`,
          description: "Exclusive 1 seat test",
          venue: "Lab 1",
          capacity: 1,
          memberPricePaise: 10000,
          regularPricePaise: 20000,
          startsAt: new Date(Date.now() + 86400000),
          endsAt: new Date(Date.now() + 90000000),
        },
      });
      tracker.trackActivity(limitedActivity.id);

      // Spawn 3 concurrent racers
      const racers = await Promise.all([
        authenticateUser(`racer1_${Date.now()}@skyline.edu`, "Pass123!", undefined, tracker),
        authenticateUser(`racer2_${Date.now()}@skyline.edu`, "Pass123!", undefined, tracker),
        authenticateUser(`racer3_${Date.now()}@skyline.edu`, "Pass123!", undefined, tracker),
      ]);

      const results = await Promise.all(
        racers.map((racer) =>
          fetch(`${BASE_URL}/api/v1/bookings`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              cookie: racer.cookie,
            },
            body: JSON.stringify({ activityId: limitedActivity.id }),
          })
        )
      );

      const statusCodes = results.map((r) => r.status);
      const successCount = statusCodes.filter((s) => s === 201).length;
      const conflictCount = statusCodes.filter((s) => s === 409).length;

      assert.equal(successCount, 1, "Exactly one booking request must succeed for the last seat");
      assert.equal(conflictCount, 2, "Other concurrent requests must receive 409 Conflict");

      // Verify in PostgreSQL: exactly 1 booking exists
      const totalBookings = await prisma.booking.count({
        where: { activityId: limitedActivity.id },
      });
      assert.equal(totalBookings, 1, "Total bookings in DB must be exactly 1");

      // Clean up test activity
      await prisma.booking.deleteMany({ where: { activityId: limitedActivity.id } });
      await prisma.activity.delete({ where: { id: limitedActivity.id } });
    });

    it("Expired reservation cannot be confirmed or revived", async () => {
      // Create a booking with reservedUntil in the past
      const expiredBooking = await prisma.booking.create({
        data: {
          activityId: testActivityId,
          userId: attendee.user.id,
          status: "pending",
          reservedUntil: new Date(Date.now() - 60000), // 1 minute in the past
        },
      });
      tracker.trackBooking(expiredBooking.id);

      const confirmRes = await fetch(`${BASE_URL}/api/v1/bookings/${expiredBooking.id}/confirm`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: attendee.cookie,
        },
        body: JSON.stringify({ paymentRef: "pay_stale_123" }),
      });

      assert.equal(confirmRes.status, 409, "Must reject expired reservation with 409 Conflict");

      // Clean up
      await prisma.booking.delete({ where: { id: expiredBooking.id } });
    });
  });

  // =========================================================================
  // WORKFLOW D: MERCHANDISE, INVENTORY CONCURRENCY & FULFILMENT
  // =========================================================================
  describe("D. Real Merchandise Inventory Concurrency, Expiry & Desk Fulfilment", () => {
    let customer: AuthSession;
    let orderId: string;

    before(async () => {
      const email = `test_customer_${Date.now()}@skyline.edu`;
      customer = await authenticateUser(email, "CustomerPass123!", "Charlie Customer", tracker);
    });

    it("Reserving merchandise increments stockReserved and creates pending order", async () => {
      const initialVariant = await prisma.variant.findUnique({ where: { id: testVariantId } });
      assert.ok(initialVariant);
      const initialReserved = initialVariant.stockReserved;

      const res = await fetch(`${BASE_URL}/api/v1/orders`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: customer.cookie,
        },
        body: JSON.stringify({
          items: [{ variantId: testVariantId, quantity: 1 }],
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      orderId = data.data.id;
      assert.ok(orderId);
      tracker.trackOrder(orderId);

      // Verify in PostgreSQL: stockReserved incremented by 1
      const updatedVariant = await prisma.variant.findUnique({ where: { id: testVariantId } });
      assert.equal(updatedVariant?.stockReserved, initialReserved + 1);

      const dbOrder = await prisma.order.findUnique({ where: { id: orderId } });
      assert.equal(dbOrder?.status, "reserved");
      assert.equal(dbOrder?.fulfilment, "pending");
    });

    it("Confirming order converts reserved stock into sold stock and creates cashbook INFLOW", async () => {
      const initialVariant = await prisma.variant.findUnique({ where: { id: testVariantId } });
      const reservedBefore = initialVariant!.stockReserved;
      const soldBefore = initialVariant!.stockSold;

      const confirmRes = await fetch(`${BASE_URL}/api/v1/orders/${orderId}/confirm`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: customer.cookie,
        },
        body: JSON.stringify({ paymentRef: `pay_order_${Date.now()}` }),
      });

      assert.equal(confirmRes.status, 200);

      // Verify in PostgreSQL: reserved decremented by 1, sold incremented by 1
      const variantAfter = await prisma.variant.findUnique({ where: { id: testVariantId } });
      assert.equal(variantAfter?.stockReserved, reservedBefore - 1);
      assert.equal(variantAfter?.stockSold, soldBefore + 1);

      // Verify cashbook entry created
      const dbOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: { purchase: true },
      });
      assert.equal(dbOrder?.status, "confirmed");

      const attempt = await prisma.paymentAttempt.findFirst({
        where: { purchaseId: dbOrder?.purchase?.id },
      });
      assert.ok(attempt);
      if (dbOrder?.purchase?.id) tracker.trackPurchase(dbOrder.purchase.id);
      if (attempt?.id) tracker.trackPaymentAttempt(attempt.id);

      const cashbook = await prisma.cashbookEntry.findFirst({
        where: { paymentAttemptId: attempt.id },
      });
      assert.ok(cashbook);
      if (cashbook?.id) tracker.trackCashbookEntry(cashbook.id);
      assert.equal(cashbook.direction, "INFLOW");
      assert.equal(cashbook.category, "merch");
    });

    it("Desk pickup fulfilment transitions order to collected status", async () => {
      const fulfilRes = await fetch(`${BASE_URL}/api/v1/orders/${orderId}/fulfil`, {
        method: "PATCH",
        headers: {
          cookie: officerSession.cookie,
        },
      });

      assert.equal(fulfilRes.status, 200);

      // Inspect row in PostgreSQL
      const dbOrder = await prisma.order.findUnique({ where: { id: orderId } });
      assert.equal(dbOrder?.fulfilment, "collected");
    });

    it("Stock concurrency: competing orders for the last item do not oversell", async () => {
      // Create isolated test product and variant with stockTotal = 1
      const testProduct = await prisma.product.create({
        data: {
          name: `Concurrency Merch ${Date.now()}`,
          description: "Test stock limits",
          regularPricePaise: 50000,
          memberPricePaise: 40000,
          variants: {
            create: {
              size: "OneSize",
              stockTotal: 1,
              stockReserved: 0,
              stockSold: 0,
            },
          },
        },
        include: { variants: true },
      });

      const singleVariant = testProduct.variants[0];
      tracker.trackProduct(testProduct.id);
      tracker.trackVariant(singleVariant.id);

      const buyer1 = await authenticateUser(`buyer1_${Date.now()}@skyline.edu`, "Pass123!", undefined, tracker);
      const buyer2 = await authenticateUser(`buyer2_${Date.now()}@skyline.edu`, "Pass123!", undefined, tracker);
      const buyer3 = await authenticateUser(`buyer3_${Date.now()}@skyline.edu`, "Pass123!", undefined, tracker);

      const results = await Promise.all([
        fetch(`${BASE_URL}/api/v1/orders`, {
          method: "POST",
          headers: { "content-type": "application/json", cookie: buyer1.cookie },
          body: JSON.stringify({ items: [{ variantId: singleVariant.id, quantity: 1 }] }),
        }),
        fetch(`${BASE_URL}/api/v1/orders`, {
          method: "POST",
          headers: { "content-type": "application/json", cookie: buyer2.cookie },
          body: JSON.stringify({ items: [{ variantId: singleVariant.id, quantity: 1 }] }),
        }),
        fetch(`${BASE_URL}/api/v1/orders`, {
          method: "POST",
          headers: { "content-type": "application/json", cookie: buyer3.cookie },
          body: JSON.stringify({ items: [{ variantId: singleVariant.id, quantity: 1 }] }),
        }),
      ]);

      const successCount = results.filter((r) => r.status === 201).length;
      const failureCount = results.filter((r) => r.status === 409).length;

      assert.equal(successCount, 1, "Exactly one order must succeed for the single available item");
      assert.equal(failureCount, 2, "Other buyers must be rejected with 409 Conflict (stock exhausted)");

      // Check DB invariant
      const finalVariant = await prisma.variant.findUnique({ where: { id: singleVariant.id } });
      assert.equal(finalVariant?.stockReserved, 1);
      assert.equal(finalVariant?.stockSold, 0);

      // Clean up test product
      await prisma.orderItem.deleteMany({ where: { variantId: singleVariant.id } });
      await prisma.variant.delete({ where: { id: singleVariant.id } });
      await prisma.product.delete({ where: { id: testProduct.id } });
    });

    it("Order expiry job releases reserved stock back to inventory", async () => {
      // Create isolated variant
      const testProd = await prisma.product.create({
        data: {
          name: `Expiry Test Merch ${Date.now()}`,
          regularPricePaise: 30000,
          memberPricePaise: 25000,
          variants: {
            create: {
              size: "L",
              stockTotal: 5,
              stockReserved: 0,
              stockSold: 0,
            },
          },
        },
        include: { variants: true },
      });
      const expVariant = testProd.variants[0];
      tracker.trackProduct(testProd.id);
      tracker.trackVariant(expVariant.id);

      // Create an order via real OrderService
      const expiredOrder = await orderService.createOrder(customer.user.id, {
        items: [{ variantId: expVariant.id, quantity: 2 }],
      });
      tracker.trackOrder(expiredOrder.id);
      // Force reservedUntil into the past
      await prisma.order.update({
        where: { id: expiredOrder.id },
        data: { reservedUntil: new Date(Date.now() - 10000) },
      });

      // Run background expiry job
      const report = await jobRunnerService.expireStaleOrders();
      assert.ok(report >= 1);

      // Verify in PostgreSQL: reserved stock returned to 0
      const restoredVariant = await prisma.variant.findUnique({ where: { id: expVariant.id } });
      assert.equal(restoredVariant?.stockReserved, 0, "Reserved stock must be rolled back to 0");

      const dbOrder = await prisma.order.findUnique({ where: { id: expiredOrder.id } });
      assert.equal(dbOrder?.status, "expired");

      // Clean up
      await prisma.orderItem.deleteMany({ where: { orderId: expiredOrder.id } });
      await prisma.order.delete({ where: { id: expiredOrder.id } });
      await prisma.variant.delete({ where: { id: expVariant.id } });
      await prisma.product.delete({ where: { id: testProd.id } });
    });
  });

  // =========================================================================
  // WORKFLOW E: CLAIMS & FINANCIAL INVARIANTS
  // =========================================================================
  describe("E. Real Reimbursement Claims, Separation of Duties & Ledger Invariants", () => {
    let claimant: AuthSession;
    let claimId: string;

    before(async () => {
      const email = `test_claimant_${Date.now()}@skyline.edu`;
      claimant = await authenticateUser(email, "ClaimantPass123!", "Clara Claimant", tracker);
    });

    it("Submitting claim creates submitted claim row in PostgreSQL", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/claims`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: claimant.cookie,
        },
        body: JSON.stringify({
          title: "Hardware Hackathon Sensors",
          description: "Sensors, jumper wires, and breadboards for hackathon hardware build",
          amountPaise: 18500, // ₹185.00
          category: "event_supplies",
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      claimId = data.data.id;
      assert.ok(claimId);
      tracker.trackClaim(claimId);

      const dbClaim = await prisma.claim.findUnique({ where: { id: claimId } });
      assert.ok(dbClaim);
      assert.equal(dbClaim.status, "submitted");
      assert.equal(Number(dbClaim.amountPaise), 18500);
    });

    it("Claimant cannot self-approve their own claim (even if granted officer role)", async () => {
      // Temporarily give claimant an officer role in DB
      await prisma.role.create({
        data: { userId: claimant.user.id, role: "treasurer" },
      });

      const selfApproveRes = await fetch(`${BASE_URL}/api/v1/claims/${claimId}/approve`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie: claimant.cookie,
        },
        body: JSON.stringify({ reviewNote: "Attempted self-approval" }),
      });

      assert.equal(selfApproveRes.status, 403);
      const err = await selfApproveRes.json();
      assert.equal(err.error.code, "SELF_APPROVAL_FORBIDDEN");

      // Remove temporary role
      await prisma.role.deleteMany({
        where: { userId: claimant.user.id, role: "treasurer" },
      });
    });

    it("Treasurer approval transitions status to approved with ZERO cashbook entries", async () => {
      const approveRes = await fetch(`${BASE_URL}/api/v1/claims/${claimId}/approve`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie: treasurerSession.cookie,
        },
        body: JSON.stringify({ reviewNote: "Receipt verified by treasurer" }),
      });

      assert.equal(approveRes.status, 200);

      // Verify in PostgreSQL
      const dbClaim = await prisma.claim.findUnique({ where: { id: claimId } });
      assert.equal(dbClaim?.status, "approved");
      assert.equal(dbClaim?.reviewerId, treasurerSession.user.id);
      assert.ok(dbClaim?.reviewNote);

      // Financial Invariant: Approval creates NO cash outflow!
      const cashbookEntries = await prisma.cashbookEntry.findMany({
        where: { claimId },
      });
      assert.equal(cashbookEntries.length, 0, "Approval must create ZERO cashbook entries");
    });

    it("Treasurer payout marks claim as paid and creates EXACTLY ONE cashbook OUTFLOW", async () => {
      const payoutRes = await fetch(`${BASE_URL}/api/v1/claims/${claimId}/payout`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie: treasurerSession.cookie,
        },
        body: JSON.stringify({ payoutRef: `upi_ref_${Date.now()}` }),
      });

      assert.equal(payoutRes.status, 200);

      // Verify in PostgreSQL
      const dbClaim = await prisma.claim.findUnique({ where: { id: claimId } });
      assert.equal(dbClaim?.status, "paid");
      assert.ok(dbClaim?.paidAt);

      // Financial Invariant: Payout creates EXACTLY ONE cashbook OUTFLOW!
      const cashbookEntries = await prisma.cashbookEntry.findMany({
        where: { claimId },
      });
      assert.equal(cashbookEntries.length, 1, "Payout must create EXACTLY ONE cashbook entry");
      assert.equal(cashbookEntries[0].direction, "OUTFLOW");
      assert.equal(Number(cashbookEntries[0].amountPaise), 18500);
      tracker.trackCashbookEntry(cashbookEntries[0].id);
    });

    it("Duplicate payout call is rejected with 409 Conflict without duplicate outflow", async () => {
      const dupPayout = await fetch(`${BASE_URL}/api/v1/claims/${claimId}/payout`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie: treasurerSession.cookie,
        },
        body: JSON.stringify({ payoutRef: "upi_dup_test" }),
      });

      assert.equal(dupPayout.status, 409);

      // Verify still exactly one cashbook entry in PostgreSQL
      const cashbookCount = await prisma.cashbookEntry.count({
        where: { claimId },
      });
      assert.equal(cashbookCount, 1, "Must never duplicate cashbook outflow");
    });
  });

  // =========================================================================
  // WORKFLOW F: TRANSACTION ROLLBACK
  // =========================================================================
  describe("F. Real PostgreSQL Transaction Rollback Verification", () => {
    it("Dependent failure inside $transaction completely rolls back prior writes", async () => {
      const canaryTitle = `Canary Activity ${Date.now()}`;

      try {
        await prisma.$transaction(async (tx) => {
          // 1. Write activity
          await tx.activity.create({
            data: {
              title: canaryTitle,
              venue: "Test Rollback Room",
              capacity: 10,
              memberPricePaise: 500,
              regularPricePaise: 1000,
              startsAt: new Date(),
              endsAt: new Date(Date.now() + 3600000),
            },
          });

          // 2. Force an intentional constraint violation (invalid non-existent foreign key)
          await tx.booking.create({
            data: {
              activityId: "non_existent_activity_id_force_fk_violation",
              userId: studentSession.user.id,
              status: "pending",
              reservedUntil: new Date(),
            },
          });
        });
        assert.fail("Transaction should have thrown a foreign key violation");
      } catch (err: any) {
        // Expected transaction rollback
        assert.ok(err);
      }

      // Invariant: Activity must NOT exist in PostgreSQL (atomic rollback succeeded)
      const orphanActivity = await prisma.activity.findFirst({
        where: { title: canaryTitle },
      });
      assert.equal(orphanActivity, null, "Preceding activity write must be rolled back by PostgreSQL");
    });
  });

  // =========================================================================
  // WORKFLOW G: TEST DATA ISOLATION & TARGETED CLEANUP REGRESSION
  // =========================================================================
  describe("G. Targeted Cleanup Ownership & Legacy Prefix Preservation Regression", () => {
    it("Cleanup removes only exact tracked records and strictly preserves untracked legacy-prefix fixtures", async () => {
      // 1. Create unrelated fixture records with names that match old problematic prefixes
      // (prefixes previously swept indiscriminately: buyer, racer, test_)
      const legacyFixture1 = await prisma.user.create({
        data: {
          email: `buyer_fixture_${Date.now()}@skyline.edu`,
          name: "Legacy Buyer Fixture",
        },
      });
      const legacyFixture2 = await prisma.user.create({
        data: {
          email: `racer_fixture_${Date.now()}@skyline.edu`,
          name: "Legacy Racer Fixture",
        },
      });
      const legacyFixture3 = await prisma.user.create({
        data: {
          email: `test_fixture_${Date.now()}@skyline.edu`,
          name: "Legacy Test Fixture",
        },
      });

      const legacyFixtureIds = [legacyFixture1.id, legacyFixture2.id, legacyFixture3.id];

      try {
        // 2. Instantiate an isolated sub-tracker for a simulated test run
        const subTracker = new TestResourceTracker(`sub_run_${Date.now()}`);

        // 3. Create and track a test-owned record
        const trackedUser = await prisma.user.create({
          data: {
            email: `tracked_subuser_${Date.now()}@skyline.edu`,
            name: "Tracked Sub User",
          },
        });
        subTracker.trackUser(trackedUser.id);

        // Verify all 4 users exist prior to cleanup
        const allBefore = await prisma.user.findMany({
          where: { id: { in: [...legacyFixtureIds, trackedUser.id] } },
        });
        assert.equal(allBefore.length, 4, "All 4 records must exist prior to cleanup");

        // 4. Execute cleanup on the sub-tracker
        await subTracker.cleanup(prisma);

        // 5. Verify the tracked user was deleted
        const trackedAfter = await prisma.user.findUnique({
          where: { id: trackedUser.id },
        });
        assert.equal(trackedAfter, null, "Tracked user owned by this run must be deleted");

        // 6. Regression Assertion: All 3 legacy-prefixed fixture records MUST STILL EXIST intact!
        const survivingFixtures = await prisma.user.findMany({
          where: { id: { in: legacyFixtureIds } },
        });
        assert.equal(
          survivingFixtures.length,
          3,
          "Normal cleanup must preserve untracked legacy-prefix fixtures ('buyer*', 'racer*', 'test_*')"
        );
      } finally {
        // 7. Remove those regression fixtures separately and explicitly by their exact IDs
        await prisma.session.deleteMany({ where: { userId: { in: legacyFixtureIds } } });
        await prisma.account.deleteMany({ where: { userId: { in: legacyFixtureIds } } });
        await prisma.role.deleteMany({ where: { userId: { in: legacyFixtureIds } } });
        await prisma.user.deleteMany({ where: { id: { in: legacyFixtureIds } } });

        const finalCheck = await prisma.user.findMany({
          where: { id: { in: legacyFixtureIds } },
        });
        assert.equal(finalCheck.length, 0, "Regression fixtures must be cleanly deleted by exact IDs");
      }
    });
  });
});

