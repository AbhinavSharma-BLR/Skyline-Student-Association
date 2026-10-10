"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/Button";
import { OfficerDashboard } from "@/components/domain/OfficerDashboard";
import { TreasurerDashboard } from "@/components/domain/TreasurerDashboard";

/**
 * Club Desk (/desk) — Staff Management Workspace Gateway
 * 
 * Strict Role-Based Access Control enforced per PRD §7 and ARCHITECTURE §4:
 * - Unauthenticated visitors are blocked with Staff Authentication Required barrier.
 * - Student roles (Adithya / Abhinav) are stopped with 403 Forbidden barrier.
 * - Club Officers (Anvitha) receive the dedicated Officer Operations Dashboard
 *   (Door QR Scanner, Event capacity, Merch inventory, and Volunteer duties).
 * - Club Treasurers (Varsha) receive the dedicated Treasury & Financial Audit Dashboard
 *   (Reimbursements review queue, Invariant 9 safeguard, Cashbook ledger, and Time Capsule).
 */
export default function ClubDeskPage() {
  const {
    currentUser,
    isAuthenticated,
    canAccessDesk,
    logout,
    loginAs,
  } = useAuth();

  // 1. UNRECOGNIZED / UNAUTHENTICATED SESSION GUARD
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex flex-col font-sans selection:bg-[#E8F0FF] selection:text-[#0047AB]">
        <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-[#0047AB] text-white flex items-center justify-center font-bold text-base">
                S
              </span>
              <span className="text-xl font-bold tracking-tight text-[#0A0A0A]">
                Skyline<span className="text-[#0047AB]">.</span>
              </span>
            </Link>
            <Link href="/" className="text-xs font-semibold text-[#64748B] hover:text-[#0A0A0A]">
              ← Back to Home
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl border border-[#E5E7EB] text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F0FF] text-[#0047AB] text-3xl font-black mb-4">
              🛡️
            </div>
            <span className="inline-block rounded-full bg-[#E8F0FF] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#0047AB]">
              Staff Clearance Required
            </span>
            <h1 className="mt-4 text-2xl font-extrabold text-[#0A0A0A]">
              Club Desk Authentication
            </h1>
            <p className="mt-3 text-xs sm:text-sm text-[#64748B] leading-relaxed">
              The <strong>Club Desk</strong> is strictly restricted to appointed Club Officers and Treasurers. Please sign in with staff credentials to proceed.
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => loginAs("officer")}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0047AB] text-white text-xs font-bold hover:bg-[#003785] transition"
              >
                ⚡ Sign in as Anvitha (Club Officer)
              </button>
              <button
                type="button"
                onClick={() => loginAs("treasurer")}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0A0A0A] text-white text-xs font-bold hover:bg-[#262626] transition"
              >
                ⚡ Sign in as Varsha (Treasurer)
              </button>
              <Link href="/login" className="mt-2">
                <Button variant="outline" className="w-full text-xs">
                  Go to Login Page
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 2. RBAC BARRIER: 403 Forbidden for Students (Adithya / Abhinav)
  if (!canAccessDesk) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex flex-col font-sans selection:bg-[#E8F0FF] selection:text-[#0047AB]">
        <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-[#0047AB] text-white flex items-center justify-center font-bold text-base">
                S
              </span>
              <span className="text-xl font-bold tracking-tight text-[#0A0A0A]">
                Skyline<span className="text-[#0047AB]">.</span>
              </span>
            </Link>
            <Link
              href="/me"
              className="text-xs font-semibold text-[#64748B] hover:text-[#0A0A0A]"
            >
              ← Back to Student Workspace
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl border border-[#E5E7EB] text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 text-3xl font-black mb-4 border border-amber-200">
              🛡️
            </div>
            <span className="inline-block rounded-full bg-amber-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-700 border border-amber-200">
              403 FORBIDDEN · ACCESS CONTROL
            </span>
            <h1 className="mt-4 text-2xl font-extrabold text-[#0A0A0A]">
              Staff Clearance Required
            </h1>
            <p className="mt-3 text-xs sm:text-sm text-[#64748B] leading-relaxed">
              The <strong>Club Desk</strong> is strictly restricted to appointed Club Officers and Treasurers per PRD Role Hierarchy.
            </p>

            <div className="mt-4 rounded-xl bg-[#F7F8FA] p-3.5 text-xs text-[#0A0A0A] border border-[#E5E7EB] text-left">
              <p>Current Account: <strong>{currentUser.name}</strong></p>
              <p className="mt-0.5">Assigned Role: <span className="font-mono text-[#0047AB] font-bold">{currentUser.role.replace("_", " ")}</span></p>
              <p className="mt-1 text-[11px] text-[#64748B]">Student accounts do not hold staff administrative clearance.</p>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Evaluator Instant Switch:
              </p>
              <button
                type="button"
                onClick={() => loginAs("officer")}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0047AB] text-white text-xs font-bold hover:bg-[#003785] transition"
              >
                ⚡ Switch to Anvitha (Club Officer) &amp; Unlock Desk
              </button>
              <button
                type="button"
                onClick={() => loginAs("treasurer")}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0A0A0A] text-white text-xs font-bold hover:bg-[#262626] transition"
              >
                ⚡ Switch to Varsha (Treasurer) &amp; View Ledger
              </button>
              <Link href="/me" className="mt-2">
                <Button variant="outline" className="w-full text-xs">
                  ← Return to Student Workspace (/me)
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 3. VARIANT A: Dedicated Club Officer Operations Dashboard (Door QR Scanner, Events, Merch, Tasks)
  if (currentUser.role === "officer") {
    return <OfficerDashboard currentUser={currentUser} logout={logout} />;
  }

  // 4. VARIANT B: Dedicated Treasury & Financial Audit Dashboard (Claims, Invariant 9, Cashbook, Handover)
  if (currentUser.role === "treasurer") {
    return <TreasurerDashboard currentUser={currentUser} logout={logout} />;
  }

  // Fallback barrier if unexpected role
  return (
    <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center shadow-lg border border-[#E5E7EB]">
        <h2 className="text-xl font-bold text-[#0A0A0A]">Role Undefined</h2>
        <p className="mt-2 text-xs text-[#64748B]">No staff dashboard variant configured for this account.</p>
        <Link href="/login" className="mt-4 inline-block">
          <Button size="sm">Return to Login</Button>
        </Link>
      </div>
    </div>
  );
}
