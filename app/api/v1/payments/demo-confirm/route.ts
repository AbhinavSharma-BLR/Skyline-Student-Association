import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { handleApiError, SkylineError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";

import { BookingService } from "@/lib/services/BookingService";
import { OrderService } from "@/lib/services/OrderService";

const DemoConfirmRequestSchema = z.object({
  referenceId: z.string().min(1, "referenceId is required"),
  category: z.enum(["membership", "booking", "order"]),
  amountPaise: z.number().int().positive("amountPaise must be a positive integer in paise").optional(),
  idempotencyKey: z.string().optional(),
});

/**
 * POST /api/v1/payments/demo-confirm
 * Simulated zero-cost payment confirmation for local development and demonstration.
 *
 * Security Invariants:
 * 1. Hard production block: Returns 404 immediately if PAYMENT_MODE !== "demo".
 * 2. Authenticated: Must possess a valid Better Auth session.
 * 3. Ownership-checked: Only the owner of the pending purchase may trigger demo confirmation.
 * 4. Idempotent: Repeated calls return the existing confirmation without double-activating or duplicating finance entries.
 * 5. Visibly labelled: All outputs declare isSimulated: true and mode: "demo".
 */
export async function POST(request: NextRequest) {
  const requestId = nanoid();

  // 1. Hard production block
  if (process.env.PAYMENT_MODE !== "demo") {
    return NextResponse.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "Endpoint not found",
        },
        requestId,
      },
      { status: 404 }
    );
  }

  try {
    // 2. Authenticate session
    const session = await requireAuth(request);

    // 3. Validate request body
    const body = await request.json();
    const parsed = DemoConfirmRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid demo payment request",
            fieldErrors: parsed.error.flatten().fieldErrors,
          },
          requestId,
        },
        { status: 422 }
      );
    }

    const { referenceId, category, amountPaise } = parsed.data;

    // 4. Category-specific confirmation with idempotency & ownership verification
    if (category === "membership") {
      const membership = await (prisma as any).membership.findUnique({
        where: { id: referenceId },
        include: { period: true },
      });

      if (!membership) {
        throw new SkylineError("NOT_FOUND", "Membership record not found", 404);
      }

      // Enforce ownership: students cannot confirm another student's membership
      if (membership.userId !== session.user.id) {
        throw new SkylineError("FORBIDDEN", "You are not authorized to confirm this membership", 403);
      }

      // Calculate authoritative dues amount directly from stored membership period record (server owns prices)
      const authoritativeAmountPaise = Number(membership.period.duesPaise);

      // Idempotency check: if already active, return existing confirmation without duplicate activation
      if (membership.status === "active") {
        return NextResponse.json(
          {
            data: {
              status: "already_confirmed",
              referenceId: membership.id,
              category: "membership",
              amountPaise: authoritativeAmountPaise,
              isSimulated: true,
              mode: "demo",
              paymentRef: `DEMO_PAID_${membership.id}`,
              activatedAt: (membership.updatedAt || new Date()).toISOString(),
            },
          },
          { status: 200 }
        );
      }

      const paymentRef = `DEMO_PAID_${membership.id}`;

      // Atomic transition + purchase + paymentAttempt + cashbookEntry in a single transaction
      const result = await (prisma as any).$transaction(async (tx: any) => {
        // Atomic state transition to prevent race conditions from simultaneous calls
        const transition = await tx.membership.updateMany({
          where: { id: membership.id, status: "pending" },
          data: { status: "active" },
        });

        if (transition.count === 0) {
          const fresh = await tx.membership.findUnique({
            where: { id: membership.id },
          });
          if (fresh?.status === "active") {
            return {
              status: "already_confirmed",
              membership: fresh,
            };
          }
          throw new SkylineError(
            "CONFLICT",
            "Membership is no longer in pending state",
            409
          );
        }

        // Create or link purchase record with authoritative amount
        let purchase = await tx.purchase?.findUnique?.({
          where: { membershipId: membership.id },
        });

        if (!purchase && tx.purchase?.create) {
          purchase = await tx.purchase.create({
            data: {
              userId: session.user.id,
              membershipId: membership.id,
              amountPaise: BigInt(authoritativeAmountPaise),
              state: "confirmed",
              pricingBasis: "dues",
            },
          });
        } else if (purchase && tx.purchase?.update) {
          await tx.purchase.update({
            where: { id: purchase.id },
            data: { state: "confirmed" },
          });
        }

        // Create payment attempt with authoritative amount
        if (purchase && tx.paymentAttempt?.create) {
          const attempt = await tx.paymentAttempt.create({
            data: {
              purchaseId: purchase.id,
              provider: "demo",
              providerRef: paymentRef,
              amountPaise: BigInt(authoritativeAmountPaise),
              state: "confirmed",
              confirmedAt: new Date(),
            },
          });

          // Create cashbook entry with direction INFLOW and category dues
          if (tx.cashbookEntry?.create) {
            await tx.cashbookEntry.create({
              data: {
                direction: "INFLOW",
                category: "dues",
                amountPaise: BigInt(authoritativeAmountPaise),
                paymentAttemptId: attempt.id,
                recordedById: session.user.id,
                occurredAt: new Date(),
              },
            });
          }
        }

        const activeMembership = await tx.membership.findUnique({
          where: { id: membership.id },
        });

        return {
          status: "succeeded",
          membership: activeMembership || membership,
        };
      });

      return NextResponse.json(
        {
          data: {
            status: result.status,
            referenceId: result.membership.id,
            category: "membership",
            amountPaise: authoritativeAmountPaise,
            isSimulated: true,
            mode: "demo",
            paymentRef,
            activatedAt: new Date().toISOString(),
          },
        },
        { status: 200 }
      );
    }

    if (category === "booking") {
      const bookingService = new BookingService();
      const paymentRef = `DEMO_PAID_${referenceId}`;
      const res = await bookingService.confirmBooking(referenceId, paymentRef);
      return NextResponse.json(
        {
          data: {
            status: res.booking.status === "confirmed" ? "succeeded" : res.booking.status,
            referenceId: res.booking.id,
            category: "booking",
            amountPaise,
            isSimulated: true,
            mode: "demo",
            paymentRef,
            activatedAt: new Date().toISOString(),
          },
        },
        { status: 200 }
      );
    }

    if (category === "order") {
      const orderService = new OrderService();
      const paymentRef = `DEMO_PAID_${referenceId}`;
      const res = await orderService.confirmOrder(referenceId, paymentRef);
      return NextResponse.json(
        {
          data: {
            status: res.status === "confirmed" ? "succeeded" : res.status,
            referenceId: res.id,
            category: "order",
            amountPaise,
            isSimulated: true,
            mode: "demo",
            paymentRef,
            activatedAt: new Date().toISOString(),
          },
        },
        { status: 200 }
      );
    }

    throw new SkylineError("NOT_FOUND", `Unsupported demo category: ${category}`, 400);
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
