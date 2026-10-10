import { prisma } from "@/lib/prisma";

export interface LivenessResult {
  ok: true;
  status: "alive";
  uptimeSeconds: number;
  timestamp: string;
}

export interface ReadinessResult {
  ok: boolean;
  status: "ready" | "not_ready";
  db: "connected" | "disconnected";
  uptimeSeconds: number;
  timestamp: string;
}

export class HealthService {
  /**
   * Pure liveness probe: verifies that the Next.js Node.js runtime process is responsive.
   * Completely decoupled from database state. Returns HTTP 200 independently of PostgreSQL.
   */
  static checkLiveness(): LivenessResult {
    return {
      ok: true,
      status: "alive",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness probe: checks if the application is prepared to serve traffic by verifying
   * live PostgreSQL connectivity via a fast non-destructive ping.
   * Does NOT expose connection strings, database credentials, or internal query errors.
   */
  static async checkReadiness(): Promise<ReadinessResult> {
    const uptimeSeconds = Math.floor(process.uptime());
    const timestamp = new Date().toISOString();

    try {
      // Execute non-destructive query ping
      await prisma.$queryRaw`SELECT 1`;

      return {
        ok: true,
        status: "ready",
        db: "connected",
        uptimeSeconds,
        timestamp,
      };
    } catch {
      // Database is unavailable, unmigrated, or unreachable.
      // Returns a clean non-ready payload without leaking credentials or raw stack traces.
      return {
        ok: false,
        status: "not_ready",
        db: "disconnected",
        uptimeSeconds,
        timestamp,
      };
    }
  }
}
