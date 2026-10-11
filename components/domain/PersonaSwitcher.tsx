"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

/**
 * PersonaSwitcher Component (Switch Workspace)
 * 
 * Provides an on-screen interactive control to switch workspaces between:
 * - Student Workspace (/me)
 * - Officer Desk (/desk)
 * - Treasurer Portal (/desk)
 * 
 * Accurately reflects server-verified authenticated identity, derives member
 * eligibility strictly from membership records (not administrative Role rows),
 * and requires real authentication to switch accounts.
 */
export function PersonaSwitcher() {
  const { currentUser, isLoading, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Role permissions strictly derived from server-verified session
  const userRoles = currentUser?.roles || [];
  const isOfficer = userRoles.includes("officer") || currentUser?.role === "officer";
  const isTreasurer = userRoles.includes("treasurer") || currentUser?.role === "treasurer";
  const isMember = Boolean(currentUser?.isMember);

  const workspaces = [
    {
      id: "student",
      label: "Student Workspace",
      path: "/me",
      badge: isMember ? "Active Member" : "Guest Student",
      badgeColor: isMember ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800",
      desc: isMember
        ? "Active member pass, ticket discounts & personal orders"
        : "Guest access, dues payment & ticket reservations",
      hasAccess: Boolean(currentUser),
      lockReason: "Requires signed-in student account",
    },
    {
      id: "officer",
      label: "Officer Desk",
      path: "/desk",
      badge: isOfficer ? "Authorized" : "Locked",
      badgeColor: isOfficer ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600",
      desc: isOfficer
        ? "Activity coordination, ticket check-in scanner & stock"
        : "Requires server-verified Officer role in database",
      hasAccess: Boolean(currentUser && isOfficer),
      lockReason: "Requires server-verified Officer role",
    },
    {
      id: "treasurer",
      label: "Treasurer Portal",
      path: "/desk",
      badge: isTreasurer ? "Authorized" : "Locked",
      badgeColor: isTreasurer ? "bg-purple-100 text-purple-800" : "bg-slate-100 text-slate-600",
      desc: isTreasurer
        ? "Financial cashbook ledger, claim payouts & audit snapshots"
        : "Requires server-verified Treasurer role in database",
      hasAccess: Boolean(currentUser && isTreasurer),
      lockReason: "Requires server-verified Treasurer role",
    },
  ];

  const handleNavigate = (path: string, hasAccess: boolean, lockReason: string) => {
    if (!currentUser) {
      router.push("/login");
      setIsOpen(false);
      return;
    }

    if (!hasAccess) {
      alert(
        `Access Restricted: Your account (${currentUser.email}) does not have permission for this workspace.\n\nReason: ${lockReason}.\n\nTo switch to an authorized account, sign in via /login.`
      );
      return;
    }

    router.push(path);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="w-88 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-2xl ring-1 ring-black/5 animate-in fade-in slide-in-from-bottom-2 max-w-[calc(100vw-2rem)]">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0047AB]">
                Switch Workspace
              </p>
              <p className="text-[11px] text-[#64748B]">
                {isLoading
                  ? "Checking session..."
                  : currentUser
                  ? `Signed in as ${currentUser.name}`
                  : "Sign in to access workspaces"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-[#64748B] hover:bg-[#F7F8FA] hover:text-[#0A0A0A] text-sm font-bold"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          {isLoading ? (
            /* Loading State */
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0047AB] border-t-transparent mb-2" />
              <p className="text-xs font-semibold text-[#0A0A0A]">Checking server session...</p>
              <p className="text-[11px] text-[#64748B]">Verifying role and membership records</p>
            </div>
          ) : !currentUser ? (
            /* Logged Out State */
            <div className="py-4 text-center">
              <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F0FF] text-[#0047AB] text-base font-bold">
                🔒
              </div>
              <h4 className="text-xs font-bold text-[#0A0A0A]">Sign in to continue</h4>
              <p className="mt-1 text-[11px] text-[#64748B] px-2">
                Workspaces are locked to server-verified accounts. Sign in to view your student pass or staff portals.
              </p>
              <a
                href="/login"
                className="mt-3.5 inline-flex w-full items-center justify-center rounded-xl bg-[#0047AB] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#003B8E]"
              >
                Sign in via /login →
              </a>
              <div className="mt-3.5 rounded-xl bg-[#F7F8FA] p-2.5 text-left border border-[#E5E7EB] text-[11px]">
                <p className="font-bold text-[#0A0A0A] mb-1 text-[10px] uppercase tracking-wider text-[#64748B]">
                  Demo Accounts on /login:
                </p>
                <div className="space-y-1 text-[#0A0A0A]">
                  <p>• <strong>Student Member:</strong> student@skyline.edu</p>
                  <p>• <strong>Club Officer:</strong> officer@skyline.edu</p>
                  <p>• <strong>Treasurer:</strong> treasurer@skyline.edu</p>
                </div>
              </div>
            </div>
          ) : (
            /* Logged In State */
            <div className="mt-3 flex flex-col gap-3">
              {/* Active Identity Card */}
              <div className="rounded-xl bg-[#F7F8FA] p-2.5 border border-[#E5E7EB]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0A0A0A] truncate max-w-[180px]">
                    {currentUser.name}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isMember ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {isMember ? "Active Member" : "Guest (Unpaid)"}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-[#64748B]">
                  <span className="truncate max-w-[190px]">{currentUser.email}</span>
                  <span className="font-mono text-[10px]">
                    {currentUser.emailVerified ? "Verified" : "Pending"}
                  </span>
                </div>
              </div>

              {/* Workspaces List */}
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                  Permitted Workspaces
                </p>
                {workspaces.map((ws) => {
                  const isActive = pathname === ws.path;

                  return (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => handleNavigate(ws.path, ws.hasAccess, ws.lockReason)}
                      className={`flex flex-col rounded-xl p-2.5 text-left transition ${
                        isActive
                          ? "bg-[#E8F0FF] border-2 border-[#0047AB]"
                          : ws.hasAccess
                          ? "border border-[#E5E7EB] hover:bg-[#F7F8FA] cursor-pointer"
                          : "border border-slate-200 bg-slate-50/70 opacity-60 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0A0A0A] flex items-center gap-1.5">
                          {!ws.hasAccess && <span>🔒</span>}
                          {ws.label}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ws.badgeColor}`}>
                          {ws.badge}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#64748B] mt-1">
                        {ws.hasAccess ? ws.desc : ws.lockReason}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Switch Account Footer */}
              <div className="border-t border-[#E5E7EB] pt-2.5 flex items-center justify-between">
                <a
                  href="/login"
                  className="text-xs font-bold text-[#0047AB] hover:underline flex items-center gap-1"
                >
                  ⇄ Switch account (/login)
                </a>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    setIsOpen(false);
                    router.push("/");
                  }}
                  className="text-xs font-semibold text-rose-600 hover:underline"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Floating Trigger Button */
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white/95 px-4 py-2 text-xs font-bold text-[#0A0A0A] shadow-lg backdrop-blur transition hover:border-[#0047AB] hover:scale-105 active:scale-95"
        >
          {isLoading ? (
            <>
              <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse"></span>
              <span className="text-[#64748B]">Checking session...</span>
            </>
          ) : currentUser ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>
                Workspace: <strong>{currentUser.name}</strong>
              </span>
              <span className="rounded bg-[#E8F0FF] px-1.5 py-0.5 text-[10px] font-bold text-[#0047AB]">
                Switch workspace
              </span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-slate-400"></span>
              <span>
                Role: <strong>Not signed in</strong>
              </span>
              <span className="rounded bg-[#E8F0FF] px-1.5 py-0.5 text-[10px] font-bold text-[#0047AB]">
                Sign in
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
