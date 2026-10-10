import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET as healthGet } from "../../../app/api/v1/health/route";
import { GET as livenessGet } from "../../../app/api/v1/health/liveness/route";
import { POST as demoConfirmPost } from "../../../app/api/v1/payments/demo-confirm/route";
import { GET as meGet } from "../../../app/api/v1/me/route";
import { POST as membershipsPost } from "../../../app/api/v1/memberships/route";

describe("Backend Route Handlers - Real HTTP Statuses Observed", () => {
  it("GET /api/v1/health/liveness observes HTTP 200 OK without database dependency", async () => {
    const response = await livenessGet();
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.ok, true);
    assert.equal(payload.data.status, "alive");
  });

  it("GET /api/v1/health observes readiness probe (200 OK when connected, 503 if disconnected)", async () => {
    const response = await healthGet();
    const payload = await response.json();

    if (response.status === 200) {
      assert.equal(payload.data.ok, true);
      assert.equal(payload.data.db, "connected");
    } else {
      assert.equal(response.status, 503);
      assert.equal(payload.error.code, "SERVICE_UNAVAILABLE");
      assert.equal(payload.data.ok, false);
      assert.equal(payload.data.db, "disconnected");
    }
  });

  it("POST /api/v1/payments/demo-confirm observes HTTP 404 Not Found when PAYMENT_MODE is not demo", async () => {
    process.env.PAYMENT_MODE = "live";

    const request = new NextRequest("http://localhost:3000/api/v1/payments/demo-confirm", {
      method: "POST",
      body: JSON.stringify({ referenceId: "mem-1", category: "membership", amountPaise: 20000 }),
    });

    const response = await demoConfirmPost(request);
    const payload = await response.json();

    assert.equal(response.status, 404);
    assert.equal(payload.error.code, "NOT_FOUND");

    process.env.PAYMENT_MODE = "demo";
  });

  it("POST /api/v1/payments/demo-confirm observes HTTP 401 Unauthorized when session is missing", async () => {
    process.env.PAYMENT_MODE = "demo";

    const request = new NextRequest("http://localhost:3000/api/v1/payments/demo-confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ referenceId: "mem-1", category: "membership", amountPaise: 20000 }),
    });

    const response = await demoConfirmPost(request);
    const payload = await response.json();

    // Unauthenticated request rejected by requireAuth()
    assert.equal(response.status, 401);
    assert.equal(payload.error.code, "UNAUTHORIZED");
  });

  it("GET /api/v1/me observes HTTP 401 Unauthorized when session is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/v1/me");
    const response = await meGet(request);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.error.code, "UNAUTHORIZED");
  });

  it("POST /api/v1/memberships observes HTTP 401 Unauthorized before checking payload", async () => {
    const request = new NextRequest("http://localhost:3000/api/v1/memberships", {
      method: "POST",
      body: JSON.stringify({ periodId: "p-1" }),
    });

    const response = await membershipsPost(request);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.error.code, "UNAUTHORIZED");
  });
});
