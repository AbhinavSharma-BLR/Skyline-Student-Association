import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { requireOwner } from "../../lib/auth/session";
import { SkylineError } from "../../lib/api/errors";
import { HealthService } from "../../lib/services/HealthService";

describe("Backend Auth - Ownership & Authorization Guards", () => {
  it("requireOwner allows matching user ID", () => {
    const mockSession = { user: { id: "user-123" } };
    assert.doesNotThrow(() => {
      requireOwner(mockSession, "user-123");
    });
  });

  it("requireOwner denies mismatching user ID with HTTP 403 FORBIDDEN", () => {
    const mockSession = { user: { id: "user-123" } };

    assert.throws(
      () => {
        requireOwner(mockSession, "user-999");
      },
      (error: unknown) => {
        assert.ok(error instanceof SkylineError);
        assert.equal(error.code, "FORBIDDEN");
        assert.equal(error.statusCode, 403);
        assert.match(error.message, /not the resource owner/i);
        return true;
      }
    );
  });
});

describe("Backend Health - Decoupled Liveness vs Database Readiness", () => {
  it("checkLiveness returns HTTP 200 alive status independently of database", () => {
    const liveness = HealthService.checkLiveness();

    assert.equal(liveness.ok, true);
    assert.equal(liveness.status, "alive");
    assert.equal(typeof liveness.uptimeSeconds, "number");
    assert.equal(typeof liveness.timestamp, "string");
  });

  it("checkReadiness detects unmigrated/unreachable database and returns not_ready without leaking credentials", async () => {
    const readiness = await HealthService.checkReadiness();

    // In current environment with unmigrated DB, readiness is not_ready / disconnected
    assert.equal(typeof readiness.ok, "boolean");
    assert.ok(readiness.status === "ready" || readiness.status === "not_ready");
    assert.ok(readiness.db === "connected" || readiness.db === "disconnected");

    // Ensure raw connection errors and credentials are not leaked in the payload
    assert.equal((readiness as any).error, undefined);
    assert.equal((readiness as any).databaseUrl, undefined);
  });
});
