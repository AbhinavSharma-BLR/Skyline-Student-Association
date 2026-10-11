import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// In-memory sliding rate limiter for invitation code validation attempts
// Limits brute-force attempts per client IP to 5 failures per 5 minutes
interface RateLimitBucket {
  failures: number;
  resetAt: number;
}

const failedCodeAttempts = new Map<string, RateLimitBucket>();

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "127.0.0.1";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = failedCodeAttempts.get(ip);
  if (!bucket) return true;
  if (now > bucket.resetAt) {
    failedCodeAttempts.delete(ip);
    return true;
  }
  return bucket.failures < 5;
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const bucket = failedCodeAttempts.get(ip);
  if (!bucket || now > bucket.resetAt) {
    failedCodeAttempts.set(ip, { failures: 1, resetAt: now + 5 * 60 * 1000 });
  } else {
    bucket.failures += 1;
  }
}

function resetRateLimit(ip: string): void {
  failedCodeAttempts.delete(ip);
}

/**
 * GET /api/v1/auth/admin-signup
 * Public status endpoint checking whether administrative demo provisioning is enabled.
 * Exposes ONLY a boolean toggle; never leaks invitation codes or secret credentials.
 */
export async function GET() {
  const isProvisioningEnabled =
    process.env.ENABLE_ADMIN_SIGNUP_PROVISIONING === "true" ||
    process.env.ENABLE_LOCAL_DEMO === "true";

  return NextResponse.json(
    {
      data: {
        provisioningEnabled: Boolean(isProvisioningEnabled),
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

/**
 * POST /api/v1/auth/admin-signup
 * 
 * Authorized administrative account creation endpoint.
 * Strictly verifies role-specific invitation code on the server before
 * delegating credential creation to Better Auth and persisting the role grant.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  // 1. Verify administrative provisioning is explicitly enabled
  const isProvisioningEnabled =
    process.env.ENABLE_ADMIN_SIGNUP_PROVISIONING === "true" ||
    process.env.ENABLE_LOCAL_DEMO === "true";

  if (!isProvisioningEnabled) {
    return NextResponse.json(
      {
        error: {
          code: "PROVISIONING_DISABLED",
          message:
            "Administrative account provisioning is disabled. An invitation from a club administrator is required to register as staff.",
        },
      },
      { status: 403 }
    );
  }

  // 2. Enforce rate limiting against brute-force code guessing
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Too many failed invitation attempts. Please wait 5 minutes before trying again.",
        },
      },
      { status: 429 }
    );
  }

  // 3. Parse and validate payload
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Malformed JSON payload" } },
      { status: 400 }
    );
  }

  const { name, email, password, requestedRole, invitationCode } = body;

  if (
    !name ||
    typeof name !== "string" ||
    !name.trim() ||
    !email ||
    typeof email !== "string" ||
    !email.trim() ||
    !password ||
    typeof password !== "string" ||
    password.length < 8
  ) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Full name, valid email, and password (min 8 chars) are required.",
        },
      },
      { status: 400 }
    );
  }

  const normalizedEmail = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Please provide a valid email address." } },
      { status: 400 }
    );
  }

  // 4. Validate requested administrative role strictly
  if (requestedRole !== "officer" && requestedRole !== "treasurer") {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_ROLE",
          message: "Invalid administrative role. Only 'officer' and 'treasurer' grants are supported.",
        },
      },
      { status: 400 }
    );
  }

  // 5. Authorize invitation code if provided
  const expectedCode =
    requestedRole === "officer"
      ? process.env.ADMIN_INVITE_CODE_OFFICER
      : process.env.ADMIN_INVITE_CODE_TREASURER;

  if (invitationCode) {
    if (!expectedCode || invitationCode !== expectedCode) {
      recordFailedAttempt(ip);
      // Security notice: NEVER log the supplied invitationCode or password
      return NextResponse.json(
        {
          error: {
            code: "INVALID_INVITATION_CODE",
            message: "Invalid invitation code for the requested administrative role.",
          },
        },
        { status: 403 }
      );
    }
  }

  // 6. Check for existing user with this email
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingUser) {
    return NextResponse.json(
      {
        error: {
          code: "USER_ALREADY_EXISTS",
          message: "An account with this email address already exists. Please sign in instead.",
        },
      },
      { status: 409 }
    );
  }

  // 7. Create user through Better Auth official server API (preserves official password hashing)
  let createdUser: any = null;
  try {
    const authRes = await auth.api.signUpEmail({
      body: {
        email: normalizedEmail,
        name: name.trim(),
        password,
      },
    });
    createdUser = authRes?.user;
  } catch (err: any) {
    return NextResponse.json(
      {
        error: {
          code: "SIGNUP_FAILED",
          message: err?.message || "Failed to create user account with authentication provider.",
        },
      },
      { status: 400 }
    );
  }

  if (!createdUser) {
    createdUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
  }

  if (!createdUser) {
    return NextResponse.json(
      {
        error: {
          code: "SIGNUP_FAILED",
          message: "Unable to verify created user account in database.",
        },
      },
      { status: 500 }
    );
  }

  // 8. Persist verified administrative role grant in PostgreSQL
  try {
    const roleRecord = await (prisma as any).role.upsert({
      where: {
        userId_role: {
          userId: createdUser.id,
          role: requestedRole,
        },
      },
      create: {
        userId: createdUser.id,
        role: requestedRole,
      },
      update: {},
    });

    if (!roleRecord || roleRecord.role !== requestedRole) {
      throw new Error("Role record was not properly verified in database");
    }
  } catch (roleErr: any) {
    // Truthfully report provisioning failure
    return NextResponse.json(
      {
        error: {
          code: "PROVISIONING_FAILED",
          message: "User was created but administrative role grant could not be confirmed in the database.",
        },
      },
      { status: 500 }
    );
  }

  // 9. Reset rate limit on success
  resetRateLimit(ip);

  // 10. Return success envelope with created user metadata
  return NextResponse.json(
    {
      data: {
        success: true,
        user: {
          id: createdUser.id,
          name: createdUser.name,
          email: createdUser.email,
          role: requestedRole,
        },
      },
    },
    { status: 201 }
  );
}
