import { prisma } from "@/lib/prisma";
import { emailProvider } from "@/lib/providers/ConsoleEmailAdapter";

export interface JobRunReport {
  expiredBookingsCount: number;
  expiredOrdersCount: number;
  emailsProcessedCount: number;
  emailsSentCount: number;
  emailsFailedCount: number;
}

export class JobRunnerService {
  /**
   * Idempotently expires stale booking holds without affecting confirmed purchases.
   */
  async expireStaleBookings(): Promise<number> {
    const now = new Date();

    const staleBookings = await (prisma as any).booking.findMany({
      where: {
        reservedUntil: { lt: now },
        purchase: { state: "pending" },
      },
      include: { purchase: true },
    });

    let expiredCount = 0;

    for (const b of staleBookings) {
      if (b.purchase) {
        const res = await (prisma as any).purchase.updateMany({
          where: { id: b.purchase.id, state: "pending" },
          data: { state: "expired" },
        });
        if (res.count > 0) {
          if ((prisma as any).booking?.update) {
            await (prisma as any).booking.update({
              where: { id: b.id },
              data: { status: "expired" },
            });
          }
          expiredCount++;
        }
      }
    }

    return expiredCount;
  }

  /**
   * Idempotently expires stale order holds and returns reserved inventory to available stock.
   */
  async expireStaleOrders(): Promise<number> {
    const now = new Date();

    const staleOrders = await (prisma as any).order.findMany({
      where: {
        reservedUntil: { lt: now },
        purchase: { state: "pending" },
      },
      include: {
        purchase: true,
        items: true,
      },
    });

    let expiredCount = 0;

    for (const order of staleOrders) {
      await (prisma as any).$transaction(async (tx: any) => {
        const res = await tx.purchase.updateMany({
          where: { id: order.purchase.id, state: "pending" },
          data: { state: "expired" },
        });

        // Only rollback stock if we were the ones to transition state from pending to expired
        if (res.count > 0) {
          if (tx.order?.update) {
            await tx.order.update({
              where: { id: order.id },
              data: { status: "expired" },
            });
          }
          const sortedItems = [...order.items].sort((a: any, b: any) =>
            a.variantId.localeCompare(b.variantId)
          );
          for (const item of sortedItems) {
            await tx.variant.update({
              where: { id: item.variantId },
              data: {
                stockReserved: { decrement: item.quantity },
              },
            });
          }
          expiredCount++;
        }
      });
    }

    return expiredCount;
  }

  /**
   * Processes queued email notification jobs with backoff retries and idempotency keys.
   */
  async processEmailJobs(): Promise<{ processed: number; sent: number; failed: number }> {
    const now = new Date();

    // Fetch jobs that are either newly queued or ready for retry
    const jobs = await (prisma as any).emailJob.findMany({
      where: {
        OR: [
          { state: "queued" },
          {
            state: "failed",
            attempts: { lt: 5 },
            nextAttemptAt: { lte: now },
          },
        ],
      },
      take: 20,
    });

    let sent = 0;
    let failed = 0;

    for (const job of jobs) {
      const idempotencyKey = `${job.recipientId}_${job.kind}_${job.sourceKey}_attempt_${job.attempts}`;

      const sendResult = await emailProvider.send(
        {
          recipientEmail: job.recipientId,
          subject: `Club Notification: ${job.kind}`,
          body: `Notification regarding ${job.kind} (${job.sourceKey})`,
          kind: job.kind as any,
        },
        idempotencyKey
      );

      if (sendResult.success) {
        await (prisma as any).emailJob.update({
          where: { id: job.id },
          data: {
            state: "sent",
            providerId: sendResult.messageId,
          },
        });
        sent++;
      } else {
        const nextAttempt = job.attempts + 1;
        const terminal = !sendResult.retryable || nextAttempt >= 5;
        // Exponential backoff: 2^attempts minutes
        const backoffMinutes = Math.pow(2, nextAttempt);
        const nextAttemptAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

        await (prisma as any).emailJob.update({
          where: { id: job.id },
          data: {
            state: terminal ? "terminal" : "failed",
            attempts: nextAttempt,
            nextAttemptAt: terminal ? null : nextAttemptAt,
          },
        });
        failed++;
      }
    }

    return { processed: jobs.length, sent, failed };
  }

  /**
   * Runs all background cleanup and dispatch routines.
   */
  async runAllJobs(): Promise<JobRunReport> {
    const expiredBookingsCount = await this.expireStaleBookings();
    const expiredOrdersCount = await this.expireStaleOrders();
    const emailReport = await this.processEmailJobs();

    return {
      expiredBookingsCount,
      expiredOrdersCount,
      emailsProcessedCount: emailReport.processed,
      emailsSentCount: emailReport.sent,
      emailsFailedCount: emailReport.failed,
    };
  }
}

export const jobRunnerService = new JobRunnerService();
