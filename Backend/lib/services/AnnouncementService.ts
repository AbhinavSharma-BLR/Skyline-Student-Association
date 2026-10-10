import { prisma } from "@/lib/prisma";
import { SkylineError } from "@/lib/api/errors";
import {
  CreateAnnouncementRequest,
  AnnouncementResponse,
} from "@/lib/schemas/announcements";

export class AnnouncementService {
  /**
   * Lists published announcements. Non-members only see targetAudience="all".
   */
  async listAnnouncements(isMember: boolean): Promise<AnnouncementResponse[]> {
    const whereClause: any = {
      publishedAt: { not: null },
    };

    if (!isMember) {
      whereClause.audience = "public";
    }

    const announcements = await (prisma as any).announcement.findMany({
      where: whereClause,
      include: {
        author: { select: { id: true, name: true } },
      },
      orderBy: { publishedAt: "desc" },
    });

    return announcements.map((a: any) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      authorId: a.authorId,
      author: {
        id: a.author?.id ?? a.authorId,
        name: a.author?.name ?? "Skyline Officer",
      },
      status: a.publishedAt ? "published" : "draft",
      publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
      targetAudience: a.audience === "members" ? "members_only" : "all",
      createdAt: a.createdAt?.toISOString() ?? new Date().toISOString(),
    }));
  }

  /**
   * Retrieves single announcement by ID.
   */
  async getAnnouncement(id: string, isMember: boolean): Promise<AnnouncementResponse> {
    const a = await (prisma as any).announcement.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    if (!a) {
      throw new SkylineError("NOT_FOUND", "Announcement not found", 404);
    }

    if (a.audience === "members" && !isMember) {
      throw new SkylineError(
        "MEMBERSHIP_REQUIRED",
        "This announcement is reserved for active members",
        403
      );
    }

    return {
      id: a.id,
      title: a.title,
      body: a.body,
      authorId: a.authorId,
      author: {
        id: a.author?.id ?? a.authorId,
        name: a.author?.name ?? "Skyline Officer",
      },
      status: a.publishedAt ? "published" : "draft",
      publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
      targetAudience: a.audience === "members" ? "members_only" : "all",
      createdAt: a.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  /**
   * Creates an announcement draft. Restricted to club officers.
   */
  async createDraft(
    authorId: string,
    input: CreateAnnouncementRequest
  ): Promise<AnnouncementResponse> {
    const audienceValue = input.targetAudience === "members_only" ? "members" : "public";

    const announcement = await (prisma as any).announcement.create({
      data: {
        title: input.title,
        body: input.body,
        activityId: input.activityId ?? null,
        audience: audienceValue,
        authorId,
        publishedAt: null,
      },
    });

    return {
      id: announcement.id,
      title: announcement.title,
      body: announcement.body,
      authorId: announcement.authorId,
      author: { id: authorId, name: "Author" },
      status: "draft",
      publishedAt: null,
      targetAudience: input.targetAudience,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Publishes an announcement and generates idempotent EmailJob rows.
   */
  async publish(
    _officerId: string,
    announcementId: string
  ): Promise<AnnouncementResponse> {
    const existing = await (prisma as any).announcement.findUnique({
      where: { id: announcementId },
    });

    if (!existing) {
      throw new SkylineError("NOT_FOUND", "Announcement not found", 404);
    }

    if (existing.publishedAt) {
      // Already published; return existing state idempotently
      return {
        id: existing.id,
        title: existing.title,
        body: existing.body,
        authorId: existing.authorId,
        author: { id: existing.authorId, name: "Officer" },
        status: "published",
        publishedAt: existing.publishedAt.toISOString(),
        targetAudience: existing.audience === "members" ? "members_only" : "all",
        createdAt: existing.createdAt?.toISOString() ?? new Date().toISOString(),
      };
    }

    const publishedAt = new Date();

    // Execute publication and email job enqueuing in transaction
    const updated = await (prisma as any).$transaction(async (tx: any) => {
      const pub = await tx.announcement.update({
        where: { id: announcementId },
        data: { publishedAt },
      });

      // Target users to notify
      const usersToNotify =
        existing.audience === "members"
          ? await tx.membership.findMany({
              where: { status: "active" },
              select: { userId: true },
            })
          : await tx.user.findMany({
              select: { id: true },
            });

      for (const target of usersToNotify) {
        const recipientId = target.userId ?? target.id;
        // Upsert email job with unique constraint (recipientId, kind, sourceKey)
        await tx.emailJob.upsert({
          where: {
            recipientId_kind_sourceKey: {
              recipientId,
              kind: "announcement",
              sourceKey: announcementId,
            },
          },
          create: {
            recipientId,
            kind: "announcement",
            sourceKey: announcementId,
            state: "queued",
          },
          update: {},
        });
      }

      return pub;
    });

    return {
      id: updated.id,
      title: updated.title,
      body: updated.body,
      authorId: updated.authorId,
      author: { id: updated.authorId, name: "Officer" },
      status: "published",
      publishedAt: updated.publishedAt.toISOString(),
      targetAudience: updated.audience === "members" ? "members_only" : "all",
      createdAt: updated.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }
}

export const announcementService = new AnnouncementService();
