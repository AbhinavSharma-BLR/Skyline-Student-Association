import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { SkylineError } from "@/lib/api/errors";
import { Role } from "@/lib/schemas/enums";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image?: string | null;
}

export interface AuthenticatedSession {
  user: AuthenticatedUser;
  session: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
  };
}

/**
 * Validates that the current incoming HTTP request possesses an active, valid Better Auth session.
 * Throws SkylineError("UNAUTHORIZED", ..., 401) if absent, invalid, or expired.
 */
export async function requireAuth(
  requestOrHeaders?: NextRequest | Headers
): Promise<AuthenticatedSession> {
  let requestHeaders: Headers;

  if (requestOrHeaders instanceof Headers) {
    requestHeaders = requestOrHeaders;
  } else if (requestOrHeaders && "headers" in requestOrHeaders) {
    requestHeaders = requestOrHeaders.headers;
  } else {
    try {
      requestHeaders = await headers();
    } catch {
      // In isolated test environments outside Next.js request context
      requestHeaders = new Headers();
    }
  }

  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session || !session.user) {
    throw new SkylineError("UNAUTHORIZED", "Authentication required", 401);
  }

  return session as unknown as AuthenticatedSession;
}

/**
 * Verifies that the authenticated user holds a specific management or finance role.
 * Enforces role isolation in PostgreSQL.
 */
export async function requireRole(
  session: { user: { id: string } },
  role: Role
): Promise<{ id: string; userId: string; role: string }> {
  const userRole = await (prisma as any).role?.findFirst({
    where: {
      userId: session.user.id,
      role: role,
    },
  });

  if (!userRole) {
    throw new SkylineError("FORBIDDEN", `Insufficient permissions: requires ${role} role`, 403);
  }

  return userRole;
}

/**
 * Enforces resource ownership; prevents students from modifying or viewing other members' data.
 */
export function requireOwner(
  session: { user: { id: string } },
  resourceUserId: string
): void {
  if (session.user.id !== resourceUserId) {
    throw new SkylineError("FORBIDDEN", "Access denied: not the resource owner", 403);
  }
}

/**
 * Verifies that an officer or volunteer is designated as staff for a specific activity
 * with the necessary operational capability (e.g. "checkin").
 */
export async function requireActivityStaff(
  session: { user: { id: string } },
  activityId: string,
  capability: string
): Promise<{ id: string; activityId: string; userId: string; capability: string }> {
  const staff = await (prisma as any).activityStaff?.findFirst({
    where: {
      activityId,
      userId: session.user.id,
      capability,
    },
  });

  if (!staff) {
    throw new SkylineError(
      "FORBIDDEN",
      `Not authorized as staff for this activity with ${capability} capability`,
      403
    );
  }

  return staff;
}
