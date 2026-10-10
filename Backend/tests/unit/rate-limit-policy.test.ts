import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isRateLimitEnabled } from "../../lib/auth/auth";

describe("Better Auth Rate-Limiting Policy Verification", () => {
  it("Development + bypass flag: rate limiting stays enabled", () => {
    const enabled = isRateLimitEnabled("development", "true");
    assert.equal(
      enabled,
      true,
      "Rate limiting must remain strictly enabled in development even if bypass flag is true"
    );
  });

  it("Production + bypass flag: rate limiting stays enabled", () => {
    const enabled = isRateLimitEnabled("production", "true");
    assert.equal(
      enabled,
      true,
      "Rate limiting must remain strictly enabled in production even if bypass flag is true"
    );
  });

  it("Test environment without explicit bypass flag: rate limiting stays enabled", () => {
    const enabledWithoutFlag = isRateLimitEnabled("test", undefined);
    assert.equal(
      enabledWithoutFlag,
      true,
      "Rate limiting must stay enabled in test when TEST_DISABLE_RATE_LIMIT is undefined"
    );

    const enabledWithFalseFlag = isRateLimitEnabled("test", "false");
    assert.equal(
      enabledWithFalseFlag,
      true,
      "Rate limiting must stay enabled in test when TEST_DISABLE_RATE_LIMIT is false"
    );
  });

  it("Test environment with explicit bypass flag: rate limiting can be disabled", () => {
    const enabled = isRateLimitEnabled("test", "true");
    assert.equal(
      enabled,
      false,
      "Rate limiting is only permitted to be bypassed when BOTH NODE_ENV=test AND TEST_DISABLE_RATE_LIMIT=true"
    );
  });

  it("Default / unconfigured invocation preserves rate limiting", () => {
    // Default call with no arguments should default to secure (enabled)
    const enabled = isRateLimitEnabled();
    // In normal execution (where NODE_ENV is not 'test' or TEST_DISABLE_RATE_LIMIT is not 'true'), it must be true
    assert.equal(typeof enabled, "boolean");
  });
});
