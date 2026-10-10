import { prisma } from "@/lib/prisma";
import { SkylineError } from "@/lib/api/errors";
import { SnapshotResponse } from "@/lib/schemas/finance";
import { financeService } from "./FinanceService";

export class SnapshotService {
  /**
   * Generates a frozen, immutable handover snapshot.
   * Runs inside an atomic transaction; resulting JSON is permanent and immutable.
   */
  async generateSnapshot(
    officerId: string,
    notes?: string
  ): Promise<SnapshotResponse> {
    const summary = await financeService.getSummary();

    const snapshot = await (prisma as any).$transaction(async (tx: any) => {
      // 1. Gather club state
      const settings = await tx.clubSettings.findFirst();
      const activeMembersCount = await tx.membership.count({
        where: { status: "active" },
      });
      const publishedActivitiesCount = await tx.activity.count({
        where: { published: true },
      });
      const pendingClaimsCount = await tx.claim.count({
        where: { status: { in: ["submitted", "under_review"] } },
      });

      const snapshotPayload = {
        clubName: settings?.name ?? "Skyline Student Association",
        generatedAt: new Date().toISOString(),
        activeMembersCount,
        publishedActivitiesCount,
        pendingClaimsCount,
        financialSummary: summary,
      };

      // 2. Persist immutable snapshot record
      return tx.handoverSnapshot.create({
        data: {
          generatedById: officerId,
          snapshotJson: snapshotPayload,
          notes: notes ?? null,
          schemaVersion: 1,
        },
      });
    });

    return {
      id: snapshot.id,
      generatedById: snapshot.generatedById,
      generatedAt: snapshot.generatedAt.toISOString(),
      schemaVersion: snapshot.schemaVersion,
      snapshotJson: snapshot.snapshotJson as Record<string, any>,
      notes: snapshot.notes,
    };
  }

  /**
   * Lists handover snapshots.
   */
  async listSnapshots(): Promise<SnapshotResponse[]> {
    const snapshots = await (prisma as any).handoverSnapshot.findMany({
      orderBy: { generatedAt: "desc" },
    });

    return snapshots.map((s: any) => ({
      id: s.id,
      generatedById: s.generatedById,
      generatedAt: s.generatedAt.toISOString(),
      schemaVersion: s.schemaVersion,
      snapshotJson: s.snapshotJson as Record<string, any>,
      notes: s.notes,
    }));
  }

  /**
   * Retrieves single snapshot by ID.
   */
  async getSnapshot(id: string): Promise<SnapshotResponse> {
    const s = await (prisma as any).handoverSnapshot.findUnique({
      where: { id },
    });

    if (!s) {
      throw new SkylineError("NOT_FOUND", "Handover snapshot not found", 404);
    }

    return {
      id: s.id,
      generatedById: s.generatedById,
      generatedAt: s.generatedAt.toISOString(),
      schemaVersion: s.schemaVersion,
      snapshotJson: s.snapshotJson as Record<string, any>,
      notes: s.notes,
    };
  }
}

export const snapshotService = new SnapshotService();
