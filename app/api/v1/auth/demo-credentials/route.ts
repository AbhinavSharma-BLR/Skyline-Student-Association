import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/auth/demo-credentials
 * 
 * Secure, local-demo-only helper endpoint for Quick Demo Access cards on /login.
 * 
 * Invariants & Protections:
 * 1. Strictly disabled unless ENABLE_LOCAL_DEMO="true" in server environment.
 * 2. Enforces same-origin request verification.
 * 3. Enforces cache prevention (no-store, no-cache).
 * 4. Restricted to an allowlist of exactly four dedicated demo personas.
 * 5. Does not log passwords or session cookies.
 * 6. Does not create mock sessions; client must perform real Better Auth authentication.
 */
export async function POST(request: NextRequest) {
  // 1. Server-side demo authorization guard
  const isDemoEnabled = process.env.ENABLE_LOCAL_DEMO === "true";
  if (!isDemoEnabled) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Demo credentials are not available in this environment" } },
      {
        status: 404,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
        },
      }
    );
  }

  // 2. Same-origin protection
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "none") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Cross-site access prohibited" } },
      {
        status: 403,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
        },
      }
    );
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json(
          { error: { code: "FORBIDDEN", message: "Cross-site access prohibited" } },
          {
            status: 403,
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
              Pragma: "no-cache",
            },
          }
        );
      }
    } catch {
      // ignore URL parsing error
    }
  }

  // 3. Parse and validate requested persona
  let personaId: string | undefined;
  try {
    const body = await request.json();
    personaId = body?.personaId;
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON payload" } },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  }

  // 4. Strict allowlist mapping
  const DEMO_ALLOWLIST: Record<
    string,
    {
      email: string;
      password: string;
      persona: {
        id: string;
        name: string;
        roleTitle: string;
        workspace: "Member" | "Club Officer" | "Treasurer";
        targetPath: "/me" | "/desk";
      };
    }
  > = {
    student_guest: {
      email: process.env.DEMO_GUEST_EMAIL || "guest@skyline.edu",
      password: process.env.DEMO_GUEST_PASSWORD || "GuestPassword123!",
      persona: {
        id: "student_guest",
        name: "Abhinav",
        roleTitle: "Student Guest",
        workspace: "Member",
        targetPath: "/me",
      },
    },
    student_member: {
      email: process.env.DEMO_STUDENT_EMAIL || "student@skyline.edu",
      password: process.env.DEMO_STUDENT_PASSWORD || "StudentPassword123!",
      persona: {
        id: "student_member",
        name: "Adithya",
        roleTitle: "Student Member",
        workspace: "Member",
        targetPath: "/me",
      },
    },
    officer: {
      email: process.env.DEMO_OFFICER_EMAIL || "officer@skyline.edu",
      password: process.env.DEMO_OFFICER_PASSWORD || "OfficerPassword123!",
      persona: {
        id: "officer",
        name: "Anvitha",
        roleTitle: "Club Officer",
        workspace: "Club Officer",
        targetPath: "/desk",
      },
    },
    treasurer: {
      email: process.env.DEMO_TREASURER_EMAIL || "treasurer@skyline.edu",
      password: process.env.DEMO_TREASURER_PASSWORD || "TreasurerPassword123!",
      persona: {
        id: "treasurer",
        name: "Varsha",
        roleTitle: "Treasurer",
        workspace: "Treasurer",
        targetPath: "/desk",
      },
    },
  };

  const matched = personaId ? DEMO_ALLOWLIST[personaId] : undefined;
  if (!matched) {
    return NextResponse.json(
      { error: { code: "INVALID_PERSONA", message: "Unknown demo persona requested" } },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  }

  // 5. Return credentials without logging
  return NextResponse.json(
    {
      data: {
        email: matched.email,
        password: matched.password,
        persona: matched.persona,
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
      },
    }
  );
}
