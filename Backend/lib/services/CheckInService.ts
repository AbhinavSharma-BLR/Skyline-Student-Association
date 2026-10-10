import { prisma } from "@/lib/prisma";

export interface CheckinInput {
  activityId: string;
  ticketId: string;
}

export interface CheckinResult {
  result: "ACCEPTED" | "DENIED";
  reason: "ALREADY_USED" | "NOT_VALID" | "WRONG_ACTIVITY" | null;
  ticket?: {
    id: string;
    userId: string;
    checkedInAt: string | null;
  };
}

export class CheckInService {
  /**
   * Evaluates and records a QR ticket scan at the event door.
   * Atomically verifies ticket existence, confirmed status, event matching,
   * and single-use constraints.
   *
   * Security & QR Sharing Note:
   * Atomic check-in guarantees that a ticket can only be admitted once across all doors.
   * However, digital screenshot sharing prior to check-in cannot be stopped by software alone:
   * the first scan will be ACCEPTED and any subsequent scans will be DENIED with ALREADY_USED.
   */
  static async scanTicket(input: CheckinInput, dbClient: any = prisma): Promise<CheckinResult> {
    // 1. Fetch ticket and booking details
    const ticket = await dbClient.ticket.findUnique({
      where: { id: input.ticketId },
      include: { booking: true },
    });

    // 2. Validate ticket existence and confirmed payment status
    if (!ticket || ticket.booking?.status !== "confirmed") {
      return {
        result: "DENIED",
        reason: "NOT_VALID",
      };
    }

    // 3. Validate activity ID matches the door scanner's event
    if (ticket.activityId !== input.activityId) {
      return {
        result: "DENIED",
        reason: "WRONG_ACTIVITY",
        ticket: {
          id: ticket.id,
          userId: ticket.booking.userId,
          checkedInAt: ticket.checkedInAt ? ticket.checkedInAt.toISOString() : null,
        },
      };
    }

    // 4. Enforce single-use atomically: update only if isUsed is false and checkedInAt is null
    const now = new Date();
    const updated = await dbClient.ticket.updateMany({
      where: {
        id: ticket.id,
        isUsed: false,
        checkedInAt: null,
      },
      data: {
        isUsed: true,
        checkedInAt: now,
      },
    });

    // If updated.count === 0, a concurrent scan already admitted this ticket
    if (updated.count === 0) {
      const current = await dbClient.ticket.findUnique({
        where: { id: ticket.id },
      });

      return {
        result: "DENIED",
        reason: "ALREADY_USED",
        ticket: {
          id: ticket.id,
          userId: ticket.booking.userId,
          checkedInAt: current?.checkedInAt ? current.checkedInAt.toISOString() : null,
        },
      };
    }

    return {
      result: "ACCEPTED",
      reason: null,
      ticket: {
        id: ticket.id,
        userId: ticket.booking.userId,
        checkedInAt: now.toISOString(),
      },
    };
  }
}
