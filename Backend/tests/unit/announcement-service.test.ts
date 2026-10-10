import test from "node:test";
import assert from "node:assert/strict";
import { AnnouncementService } from "@/lib/services/AnnouncementService";
import { SkylineError } from "@/lib/api/errors";

test("AnnouncementService - Audience Scoping & Publication Idempotency", async (t) => {
  const mockAnnouncements: any[] = [];
  const mockEmailJobs: any[] = [];
  const mockMemberships: any[] = [{ userId: "member-1", status: "active" }];
  const mockUsers: any[] = [{ id: "user-1" }, { id: "user-2" }];

  const fakePrisma: any = {
    announcement: {
      findMany: async ({ where }: any) => {
        return mockAnnouncements.filter((a) => {
          if (where.publishedAt && !a.publishedAt) return false;
          if (where.audience && a.audience !== where.audience) return false;
          return true;
        });
      },
      findUnique: async ({ where }: any) => {
        return mockAnnouncements.find((a) => a.id === where.id) || null;
      },
      create: async ({ data }: any) => {
        const item = {
          id: `ann-${mockAnnouncements.length + 1}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockAnnouncements.push(item);
        return item;
      },
      update: async ({ where, data }: any) => {
        const idx = mockAnnouncements.findIndex((a) => a.id === where.id);
        if (idx === -1) throw new Error("Announcement not found");
        mockAnnouncements[idx] = { ...mockAnnouncements[idx], ...data, updatedAt: new Date() };
        return mockAnnouncements[idx];
      },
    },
    membership: {
      findMany: async () => mockMemberships,
    },
    user: {
      findMany: async () => mockUsers,
    },
    emailJob: {
      upsert: async ({ where, create }: any) => {
        const key = `${where.recipientId_kind_sourceKey.recipientId}_${where.recipientId_kind_sourceKey.sourceKey}`;
        const existing = mockEmailJobs.find(
          (j) =>
            j.recipientId === where.recipientId_kind_sourceKey.recipientId &&
            j.sourceKey === where.recipientId_kind_sourceKey.sourceKey
        );
        if (existing) return existing;
        const job = { id: `job-${mockEmailJobs.length + 1}`, ...create };
        mockEmailJobs.push(job);
        return job;
      },
    },
    $transaction: async (fn: any) => fn(fakePrisma),
  };

  const service = new AnnouncementService();
  const originalPrisma = (globalThis as any).prismaGlobal;
  (globalThis as any).prismaGlobal = fakePrisma;

  await t.test("creates draft announcement without notifying users", async () => {
    const draft = await service.createDraft("officer-1", {
      title: "Annual Welcome Mixer",
      body: "Join us in the campus amphitheatre!",
      targetAudience: "all",
    });
    assert.equal(draft.status, "draft");
    assert.equal(draft.publishedAt, null);
    assert.equal(mockEmailJobs.length, 0);
  });

  await t.test("publishes announcement and enqueues notification email jobs", async () => {
    const published = await service.publish("officer-1", "ann-1");
    assert.equal(published.status, "published");
    assert(published.publishedAt !== null);
    assert.equal(mockEmailJobs.length, 2); // 2 users in mockUsers
  });

  await t.test("publishing an already-published announcement is strictly idempotent", async () => {
    const initialJobsCount = mockEmailJobs.length;
    const rePublished = await service.publish("officer-1", "ann-1");
    assert.equal(rePublished.status, "published");
    assert.equal(mockEmailJobs.length, initialJobsCount); // zero duplicate email jobs
  });

  await t.test("non-members can only retrieve public announcements", async () => {
    // Create a members-only announcement
    const membersDraft = await service.createDraft("officer-1", {
      title: "Secret Elections",
      body: "Executive voting starts today.",
      targetAudience: "members_only",
    });
    await service.publish("officer-1", membersDraft.id);

    // Non-member list
    const publicList = await service.listAnnouncements(false);
    assert.equal(publicList.length, 1);
    assert.equal(publicList[0].targetAudience, "all");

    // Member list
    const memberList = await service.listAnnouncements(true);
    assert.equal(memberList.length, 2);
  });

  (globalThis as any).prismaGlobal = originalPrisma;
});
