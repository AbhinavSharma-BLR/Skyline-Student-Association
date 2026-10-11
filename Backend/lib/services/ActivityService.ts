import { prisma } from "@/lib/prisma";
import { SkylineError } from "@/lib/api/errors";
import {
  CreateActivityRequest,
  UpdateActivityRequest,
  ActivityResponse,
} from "@/lib/schemas/activities";

import { getEventImageUrl } from "../events/eventImages";

export class ActivityService {
  /**
   * Lists activities. Public users only see published activities.
   */
  async listActivities(isOfficer = false): Promise<ActivityResponse[]> {
    const whereClause: any = {};
    if (!isOfficer) {
      whereClause.published = true;
    }

    const activities = await (prisma as any).activity.findMany({
      where: whereClause,
      include: {
        bookings: {
          select: { id: true },
        },
      },
      orderBy: { startsAt: "asc" },
    });

    const now = new Date();
    const upcoming = activities.filter((a: any) => new Date(a.startsAt) >= now);
    const concluded = activities.filter((a: any) => new Date(a.startsAt) < now);
    // Sort concluded events newest past event first
    concluded.sort((a: any, b: any) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());

    const sortedActivities = [...upcoming, ...concluded];
    return sortedActivities.map((a: any) => this.mapActivityResponse(a));
  }

  /**
   * Retrieves single activity detail by ID.
   */
  async getActivity(id: string, isOfficer = false): Promise<ActivityResponse> {
    const activity = await (prisma as any).activity.findUnique({
      where: { id },
      include: {
        bookings: {
          select: { id: true },
        },
      },
    });

    if (!activity) {
      throw new SkylineError("NOT_FOUND", "Activity not found", 404);
    }

    if (!activity.published && !isOfficer) {
      throw new SkylineError("NOT_FOUND", "Activity not found", 404);
    }

    return this.mapActivityResponse(activity);
  }

  /**
   * Creates an event activity. Restricted to club officers.
   */
  async createActivity(
    officerId: string,
    input: CreateActivityRequest
  ): Promise<ActivityResponse> {
    const created = await (prisma as any).activity.create({
      data: {
        kind: "event",
        title: input.title,
        description: input.description,
        venue: input.location,
        startsAt: new Date(input.startsAt),
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        capacity: input.capacity ?? null,
        memberPricePaise: BigInt(input.memberPricePaise),
        regularPricePaise: BigInt(input.publicPricePaise),
        published: true,
        ticketed: true,
        createdById: officerId,
      },
      include: {
        bookings: { select: { id: true } },
      },
    });

    return this.mapActivityResponse(created);
  }

  /**
   * Updates an existing activity.
   */
  async updateActivity(
    activityId: string,
    input: UpdateActivityRequest
  ): Promise<ActivityResponse> {
    const existing = await (prisma as any).activity.findUnique({
      where: { id: activityId },
    });

    if (!existing) {
      throw new SkylineError("NOT_FOUND", "Activity not found", 404);
    }

    const updated = await (prisma as any).activity.update({
      where: { id: activityId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.location !== undefined ? { venue: input.location } : {}),
        ...(input.startsAt !== undefined ? { startsAt: new Date(input.startsAt) } : {}),
        ...(input.endsAt !== undefined ? { endsAt: input.endsAt ? new Date(input.endsAt) : null } : {}),
        ...(input.capacity !== undefined ? { capacity: input.capacity } : {}),
        ...(input.memberPricePaise !== undefined ? { memberPricePaise: BigInt(input.memberPricePaise) } : {}),
        ...(input.publicPricePaise !== undefined ? { regularPricePaise: BigInt(input.publicPricePaise) } : {}),
        ...(input.status !== undefined ? { published: input.status === "published" } : {}),
      },
      include: {
        bookings: { select: { id: true } },
      },
    });

    return this.mapActivityResponse(updated);
  }

  /**
   * Retrieves attendance roster for door staff and officers.
   */
  async getAttendance(activityId: string): Promise<any[]> {
    const bookings = await (prisma as any).booking.findMany({
      where: { activityId },
      include: {
        ticket: true,
      },
    });

    return bookings.map((b: any) => ({
      bookingId: b.id,
      userId: b.userId,
      ticketId: b.ticket?.id ?? null,
      isCheckedIn: Boolean(b.ticket?.checkedInAt),
      checkedInAt: b.ticket?.checkedInAt ? b.ticket.checkedInAt.toISOString() : null,
    }));
  }

  private mapActivityResponse(a: any): ActivityResponse {
    const totalBookings = a.bookings?.length ?? 0;
    const remaining = a.capacity !== null ? Math.max(0, a.capacity - totalBookings) : null;

    return {
      id: a.id,
      title: a.title,
      description: a.description ?? "",
      location: a.venue ?? "Skyline Campus",
      startsAt: a.startsAt ? a.startsAt.toISOString() : new Date().toISOString(),
      endsAt: a.endsAt ? a.endsAt.toISOString() : null,
      status: a.published ? "published" : "draft",
      capacity: a.capacity,
      seatsRemaining: remaining,
      memberPricePaise: Number(a.memberPricePaise ?? 0),
      publicPricePaise: Number(a.regularPricePaise ?? 0),
      coverImageUrl: getEventImageUrl(a.id),
      createdAt: a.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }
}

export const activityService = new ActivityService();
