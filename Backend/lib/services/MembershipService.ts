import { prisma } from "@/lib/prisma";
import { SkylineError } from "@/lib/api/errors";
import { MembershipPeriodResponse, MembershipResponse } from "@/lib/schemas/memberships";

export class MembershipService {
  /**
   * Lists available membership periods.
   * Public query: students can browse current and upcoming periods.
   */
  static async listPeriods(): Promise<MembershipPeriodResponse[]> {
    const periods = await (prisma as any).membershipPeriod.findMany({
      orderBy: { startsAt: "desc" },
    });

    return periods.map((p: any) => ({
      id: p.id,
      name: p.label,
      startDate: p.startsAt.toISOString(),
      endDate: p.endsAt.toISOString(),
      duesPaise: Number(p.duesPaise),
    }));
  }

  /**
   * Retrieves current active membership for a user.
   * Computes `isMember` boolean invariant: status === "active" && now < period.endsAt.
   */
  static async getCurrentMembership(userId: string): Promise<MembershipResponse | null> {
    const membership = await (prisma as any).membership.findFirst({
      where: {
        userId,
        status: "active",
      },
      include: {
        period: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!membership) {
      return null;
    }

    const now = new Date();
    const isMember = membership.status === "active" && now < new Date(membership.period.endsAt);

    return {
      id: membership.id,
      userId: membership.userId,
      periodId: membership.periodId,
      period: {
        id: membership.period.id,
        name: membership.period.label,
        startDate: membership.period.startsAt.toISOString(),
        endDate: membership.period.endsAt.toISOString(),
        duesPaise: Number(membership.period.duesPaise),
      },
      status:
        membership.status === "active" && !isMember
          ? "expired"
          : (membership.status as any),
      activatedAt: membership.createdAt ? membership.createdAt.toISOString() : null,
      expiresAt: membership.period.endsAt.toISOString(),
      isMember,
      createdAt: membership.createdAt.toISOString(),
    };
  }

  /**
   * Determines whether a user qualifies for member discounts on tickets and merchandise.
   */
  static async isMember(userId: string): Promise<boolean> {
    const active = await this.getCurrentMembership(userId);
    return Boolean(active?.isMember);
  }

  /**
   * Initiates a new membership subscription or renewal.
   * Enforces business invariant: cannot renew if active membership in same period already exists.
   */
  static async initiateMembership(userId: string, periodId: string): Promise<MembershipResponse> {
    const period = await (prisma as any).membershipPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      throw new SkylineError("NOT_FOUND", "Membership period not found", 404);
    }

    // Check for existing active membership for this period
    const existing = await (prisma as any).membership.findUnique({
      where: {
        userId_periodId: {
          userId,
          periodId,
        },
      },
      include: { period: true },
    });

    if (existing && existing.status === "active") {
      throw new SkylineError(
        "MEMBERSHIP_ALREADY_ACTIVE",
        "You already have an active membership for this period",
        400
      );
    }

    // Create or update pending membership record
    const membership = await (prisma as any).membership.upsert({
      where: {
        userId_periodId: {
          userId,
          periodId,
        },
      },
      create: {
        userId,
        periodId,
        status: "pending",
      },
      update: {
        status: "pending",
      },
      include: {
        period: true,
      },
    });

    return {
      id: membership.id,
      userId: membership.userId,
      periodId: membership.periodId,
      period: {
        id: period.id,
        name: period.label,
        startDate: period.startsAt.toISOString(),
        endDate: period.endsAt.toISOString(),
        duesPaise: Number(period.duesPaise),
      },
      status: membership.status,
      activatedAt: null,
      expiresAt: period.endsAt.toISOString(),
      isMember: false,
      createdAt: membership.createdAt.toISOString(),
    };
  }
}
