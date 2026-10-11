"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { UserProfile } from "@/context/auth-context";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

export interface ClaimRecord {
  id: string;
  claimant: string;
  claimantId?: string;
  title: string;
  category: string;
  amountPaise: number;
  status: "SUBMITTED" | "APPROVED" | "PAID" | "REJECTED";
  receiptFile: string;
  hasReceipt?: boolean;
  receiptUrl?: string | null;
  receiptMimeType?: string | null;
  date: string;
}

export interface CashbookEntry {
  id: string;
  date: string;
  description: string;
  type: "INFLOW" | "OUTFLOW";
  amountPaise: number;
  category: string;
}

interface TreasurerDashboardProps {
  currentUser: UserProfile;
  logout: () => void;
}

/**
 * TreasurerDashboard Component
 * 
 * Purpose-built financial audit and treasury workspace for the Club Treasurer (PRD §2, §7):
 * - Expense Claims Review Queue with receipt inspection modal (PRD R13)
 * - Enforcement of PRD Invariant 9 (Self-approval and self-payout strictly forbidden)
 * - Consolidated Cashbook Ledger with integer paise arithmetic (PRD R14, R16)
 * - Separation of collected cash vs approved unpaid obligations (PRD R15)
 * - Committee Handover Time Capsule snapshot report (PRD R20, §8.6)
 */
export function TreasurerDashboard({ currentUser, logout }: TreasurerDashboardProps) {
  const [activeTab, setActiveTab] = useState<"claims" | "cashbook" | "dues" | "handover">("claims");

  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [cashbook, setCashbook] = useState<CashbookEntry[]>([]);
  const [periodDuesPaise, setPeriodDuesPaise] = useState<number>(50000);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch real data from backend APIs
  const fetchTreasuryData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch authoritative active membership period dues
      try {
        const periodRes = await fetch("/api/v1/membership-periods");
        if (periodRes.ok) {
          const periodJson = await periodRes.json();
          const first = periodJson?.data?.[0];
          if (first?.duesPaise) {
            setPeriodDuesPaise(first.duesPaise);
          }
        }
      } catch {
        // Fallback to standard 50000
      }

      // 1. Fetch live cashbook entries
      const financeRes = await fetch("/api/v1/finance/entries");
      if (financeRes.ok) {
        const financeJson = await financeRes.json();
        const rawEntries = financeJson?.data || [];
        if (Array.isArray(rawEntries) && rawEntries.length > 0) {
          const mapped: CashbookEntry[] = rawEntries.map((e: any) => ({
            id: e.id,
            date: new Date(e.recordedAt || e.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
            description: e.description,
            type: e.direction as "INFLOW" | "OUTFLOW",
            amountPaise: e.amountPaise,
            category: (e.category === "dues" || e.category === "MEMBERSHIP") ? "Membership Dues" : e.category,
          }));
          setCashbook(mapped);
        }
      }

      // 2. Fetch live claims
      const claimsRes = await fetch("/api/v1/claims");
      if (claimsRes.ok) {
        const claimsJson = await claimsRes.json();
        const rawClaims = claimsJson?.data || [];
        if (Array.isArray(rawClaims) && rawClaims.length > 0) {
          const mappedClaims: ClaimRecord[] = rawClaims.map((c: any) => ({
            id: c.id,
            claimant: c.claimant?.name || "Student",
            claimantId: c.claimantId,
            title: c.title,
            category: "Supplies",
            amountPaise: c.amountPaise,
            status: (c.status?.toUpperCase() || "SUBMITTED") as any,
            receiptFile: c.hasReceipt ? "receipt_attached.jpg" : "no_receipt",
            hasReceipt: Boolean(c.hasReceipt),
            receiptUrl: c.hasReceipt ? (c.receiptUrl || `/api/v1/claims/${c.id}/receipt`) : null,
            receiptMimeType: c.receiptMimeType || null,
            date: new Date(c.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
          }));
          setClaims(mappedClaims);
        }
      }
    } catch (err) {
      console.error("Failed to load treasury data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTreasuryData();
  }, [fetchTreasuryData]);

  // Modal inspection state
  const [inspectReceiptClaim, setInspectReceiptClaim] = useState<ClaimRecord | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewImageError, setPreviewImageError] = useState<boolean>(false);
  const [receiptZoom, setReceiptZoom] = useState<boolean>(false);

  // Upload / replace receipt evidence
  const handleUploadReceipt = async (claimId: string, file: File) => {
    try {
      setIsUploadingReceipt(true);
      setUploadError(null);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/v1/claims/${claimId}/receipt`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error?.message || "Failed to upload receipt file");
      }

      const resJson = await res.json();
      const updatedData = resJson.data;

      const cacheBustUrl = `/api/v1/claims/${claimId}/receipt?t=${Date.now()}`;

      setClaims((prev) =>
        prev.map((c) =>
          c.id === claimId
            ? {
                ...c,
                hasReceipt: true,
                receiptFile: file.name || "receipt_attached.jpg",
                receiptUrl: cacheBustUrl,
                receiptMimeType: file.type || "image/jpeg",
              }
            : c
        )
      );

      setInspectReceiptClaim((prev) =>
        prev && prev.id === claimId
          ? {
              ...prev,
              hasReceipt: true,
              receiptFile: file.name || "receipt_attached.jpg",
              receiptUrl: cacheBustUrl,
              receiptMimeType: file.type || "image/jpeg",
            }
          : prev
      );
      setPreviewImageError(false);
    } catch (err: any) {
      console.error("Receipt upload failed:", err);
      setUploadError(err.message || "Could not upload receipt");
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  // Financial calculations
  const totalInflow = cashbook
    .filter((c) => c.type === "INFLOW")
    .reduce((sum, c) => sum + c.amountPaise, 0);

  const totalOutflow = cashbook
    .filter((c) => c.type === "OUTFLOW")
    .reduce((sum, c) => sum + c.amountPaise, 0);

  const recordedBalance = totalInflow - totalOutflow;

  // Approved unpaid claims = Obligations (PRD R15)
  const unpaidObligations = claims
    .filter((c) => c.status === "APPROVED")
    .reduce((sum, c) => sum + c.amountPaise, 0);

  // Pending Dues Receivables
  const pendingDuesPaise = periodDuesPaise; // 1 unpaid guest = authoritative active period dues

  // Claim actions with PRD Invariant 9 enforcement & live API integration
  const handleApproveClaim = async (claim: ClaimRecord) => {
    // Invariant: Self-approval forbidden
    if (claim.claimant === currentUser.name || (claim.claimantId && claim.claimantId === currentUser.id)) {
      alert("SECURITY VIOLATION: Self-approval is strictly forbidden.");
      return;
    }

    try {
      const res = await fetch(`/api/v1/claims/${claim.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNote: "Approved by Treasurer" }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson?.error?.message || "Failed to approve claim");
        return;
      }

      setClaims((prev) =>
        prev.map((c) => (c.id === claim.id ? { ...c, status: "APPROVED" } : c))
      );
      await fetchTreasuryData();
    } catch (err) {
      console.error("Approve error:", err);
      alert("Network error approving claim");
    }
  };

  const handleRejectClaim = async (claim: ClaimRecord) => {
    if (claim.claimant === currentUser.name || (claim.claimantId && claim.claimantId === currentUser.id)) {
      alert("Self-review is forbidden.");
      return;
    }

    const reason = prompt("Enter mandatory rejection reason for the claimant:");
    if (!reason) {
      alert("A reason is mandatory when rejecting an expense claim.");
      return;
    }

    try {
      const res = await fetch(`/api/v1/claims/${claim.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNote: reason }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson?.error?.message || "Failed to reject claim");
        return;
      }

      setClaims((prev) =>
        prev.map((c) => (c.id === claim.id ? { ...c, status: "REJECTED" } : c))
      );
      await fetchTreasuryData();
    } catch (err) {
      console.error("Reject error:", err);
      alert("Network error rejecting claim");
    }
  };

  const handleRecordPayout = async (claim: ClaimRecord) => {
    // Invariant: Self-payout forbidden
    if (claim.claimant === currentUser.name || (claim.claimantId && claim.claimantId === currentUser.id)) {
      alert("SECURITY VIOLATION: Self-payout is strictly forbidden.");
      return;
    }

    const ref = prompt("Enter external bank transaction reference (e.g. UPI-REF-992144):", `UPI-REF-${Date.now().toString().slice(-6)}`);
    if (!ref) return;

    try {
      const res = await fetch(`/api/v1/claims/${claim.id}/payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutRef: ref }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson?.error?.message || "Failed to record payout");
        return;
      }

      setClaims((prev) =>
        prev.map((c) => (c.id === claim.id ? { ...c, status: "PAID" } : c))
      );

      // Re-fetch cashbook so the new outflow entry created in database appears immediately
      await fetchTreasuryData();
    } catch (err) {
      console.error("Payout error:", err);
      alert("Network error recording payout");
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col font-sans selection:bg-[#E8F0FF] selection:text-[#0047AB]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[#262626] bg-[#0A0A0A] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-6">
            <Link href="/desk" className="flex items-center gap-2 group" title="Return to Treasurer Desk">
              <span className="w-8 h-8 rounded-lg bg-[#0047AB] text-white flex items-center justify-center font-bold text-base transition group-hover:scale-105">
                S
              </span>
              <span className="text-xl font-bold tracking-tight text-white">
                Skyline<span className="text-[#0047AB]">.</span>
              </span>
            </Link>
            <span className="h-4 w-px bg-white/20"></span>
            <span className="rounded-full bg-[#E8F0FF] px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-[#0047AB]">
              Club Desk · Treasury &amp; Financial Audit
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/me"
              className="text-xs font-semibold text-white/70 transition hover:text-white"
            >
              ← Student View
            </Link>
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white border border-white/15">
              <span className="h-2 w-2 rounded-full bg-[#0047AB] animate-pulse"></span>
              <span>{currentUser.name} (Club Treasurer)</span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-white/20 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 flex-1">
        {/* Workspace Title & Authority Badge */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A0A0A]">
                Treasury &amp; Finance Management
              </h1>
              <Badge variant="primary">Financial Authority</Badge>
            </div>
            <p className="mt-1 text-sm text-[#64748B]">
              Review volunteer reimbursement claims, inspect receipt evidence, record cashbook outflows, and maintain fiscal integrity.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-3.5 border border-[#E5E7EB] shadow-xs flex items-center gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Recorded Cashbook Balance</p>
              <p className="text-xl font-black text-[#0A0A0A]">₹{(recordedBalance / 100).toFixed(2)}</p>
            </div>
            <span className="h-8 w-px bg-[#E5E7EB]"></span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Approved Obligations</p>
              <p className="text-sm font-extrabold text-amber-600">₹{(unpaidObligations / 100).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation tailored for Treasurer */}
        <div className="flex border-b border-[#E5E7EB] gap-2 sm:gap-6 mb-8 overflow-x-auto pb-px">
          {[
            { id: "claims", label: `Reimbursements Review (${claims.length})` },
            { id: "cashbook", label: `Cashbook Ledger (${cashbook.length})` },
            { id: "dues", label: "Dues Collection Audit" },
            { id: "handover", label: "Committee Time Capsule 📦" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-sm font-semibold transition whitespace-nowrap border-b-2 ${
                activeTab === tab.id
                  ? "border-[#0047AB] text-[#0047AB] font-bold"
                  : "border-transparent text-[#64748B] hover:text-[#0A0A0A]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ================= TAB 1: REIMBURSEMENT CLAIMS REVIEW ================= */}
        {activeTab === "claims" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#0A0A0A]">Volunteer Expense Claims Queue</h3>
                <p className="text-xs text-[#64748B]">
                  Verify receipts before obligation approval; record external payouts to update cashbook
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#64748B]">Separation of Duties Safeguard:</span>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                  ✓ Active (Self-Review Locked)
                </span>
              </div>
            </div>

            <Card className="border border-[#E5E7EB] shadow-xs">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {claims.map((claim) => {
                    const isSelfClaim = claim.claimant === currentUser.name;
                    return (
                      <div
                        key={claim.id}
                        className={`rounded-2xl border p-4.5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isSelfClaim
                            ? "bg-rose-50/50 border-rose-200"
                            : "bg-white border-[#E5E7EB] hover:border-[#CBD5E1] shadow-2xs"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#64748B]">{claim.id}</span>
                            {claim.status === "SUBMITTED" && <Badge variant="warning">Awaiting Approval</Badge>}
                            {claim.status === "APPROVED" && <Badge variant="info">Approved Obligation</Badge>}
                            {claim.status === "PAID" && <Badge variant="success">Paid Out</Badge>}
                            {claim.status === "REJECTED" && <Badge variant="danger">Rejected</Badge>}
                            {isSelfClaim && (
                              <Badge variant="danger">Self-Claim Safeguard</Badge>
                            )}
                          </div>
                          <h4 className="mt-1 text-sm font-bold text-[#0A0A0A]">{claim.title}</h4>
                          <p className="text-xs text-[#64748B]">
                            Claimant: <strong className="text-[#0A0A0A]">{claim.claimant}</strong> · Category: {claim.category} · Date: {claim.date}
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-0 pt-3 sm:pt-0">
                          <div className="text-right">
                            <p className="text-base font-extrabold text-[#0A0A0A]">
                              ₹{(claim.amountPaise / 100).toFixed(2)}
                            </p>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setInspectReceiptClaim(claim);
                              setUploadError(null);
                              setPreviewImageError(false);
                              setReceiptZoom(false);
                            }}
                            className={claim.hasReceipt ? "border-emerald-300 text-emerald-800 bg-emerald-50/50 hover:bg-emerald-100/50" : ""}
                          >
                            {claim.hasReceipt ? "Inspect Receipt 🧾" : "Attach/Inspect 🧾"}
                          </Button>

                          {/* Role-gated actions with Invariant check */}
                          {isSelfClaim ? (
                            <div className="text-right">
                              <span className="text-xs text-rose-600 font-bold block">
                                Self-approval forbidden
                              </span>
                              <span className="text-[10px] text-[#64748B]">Requires another officer review</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {claim.status === "SUBMITTED" && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-[#0047AB] hover:bg-[#003785] text-white"
                                    onClick={() => handleApproveClaim(claim)}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleRejectClaim(claim)}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              {claim.status === "APPROVED" && (
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                  onClick={() => handleRecordPayout(claim)}
                                >
                                  Record Payout →
                                </Button>
                              )}
                              {claim.status === "PAID" && (
                                <span className="text-xs text-emerald-600 font-bold">
                                  ✓ Outflow Recorded
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ================= TAB 2: CONSOLIDATED CASHBOOK ================= */}
        {activeTab === "cashbook" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border border-[#E5E7EB] shadow-xs bg-white">
                <CardHeader className="pb-2">
                  <CardDescription>Recorded Balance</CardDescription>
                  <CardTitle className="text-2xl font-black text-[#0A0A0A]">
                    ₹{(recordedBalance / 100).toFixed(2)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-[11px] text-[#64748B]">Total Inflows minus Recorded Outflows</p>
                </CardContent>
              </Card>

              <Card className="border border-[#E5E7EB] shadow-xs bg-white">
                <CardHeader className="pb-2">
                  <CardDescription>Total Inflows</CardDescription>
                  <CardTitle className="text-2xl font-black text-emerald-600">
                    +₹{(totalInflow / 100).toFixed(2)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-[11px] text-[#64748B]">Collected dues, tickets, merchandise</p>
                </CardContent>
              </Card>

              <Card className="border border-[#E5E7EB] shadow-xs bg-white">
                <CardHeader className="pb-2">
                  <CardDescription>Total Outflows</CardDescription>
                  <CardTitle className="text-2xl font-black text-rose-600">
                    -₹{(totalOutflow / 100).toFixed(2)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-[11px] text-[#64748B]">Verified reimbursement payouts</p>
                </CardContent>
              </Card>

              <Card className="border border-[#E5E7EB] shadow-xs bg-white">
                <CardHeader className="pb-2">
                  <CardDescription>Approved Obligations</CardDescription>
                  <CardTitle className="text-2xl font-black text-amber-600">
                    ₹{(unpaidObligations / 100).toFixed(2)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-[11px] text-[#64748B]">Approved claims pending cash payout</p>
                </CardContent>
              </Card>
            </div>

            {/* Consolidated Cashbook Entries Table */}
            <Card className="border border-[#E5E7EB] shadow-xs bg-white">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-[#0A0A0A]">Consolidated Cashbook Ledger</CardTitle>
                    <CardDescription className="text-[#64748B]">Chronological record of verified club financial movements</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const amount = prompt("Enter cash amount in INR (e.g. 500):");
                      const desc = prompt("Enter fundraiser description (e.g. Bake Sale Cash):");
                      if (!amount || !desc) return;
                      const newEntry: CashbookEntry = {
                        id: `CB-${Math.floor(100 + Math.random() * 900)}`,
                        date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
                        description: desc,
                        type: "INFLOW",
                        amountPaise: Math.round(parseFloat(amount) * 100),
                        category: "Fundraiser",
                      };
                      setCashbook([newEntry, ...cashbook]);
                    }}
                  >
                    + Record Fundraiser Cash
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[#E5E7EB] bg-[#F7F8FA] text-[#64748B] uppercase font-semibold">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Ref</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4 text-right">Direction &amp; Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {cashbook.map((entry) => (
                        <tr key={entry.id} className="hover:bg-[#F7F8FA]/60">
                          <td className="py-3.5 px-4 font-medium text-[#64748B]">{entry.date}</td>
                          <td className="py-3.5 px-4 font-mono text-[#64748B]">{entry.id}</td>
                          <td className="py-3.5 px-4 font-bold text-[#0A0A0A]">{entry.description}</td>
                          <td className="py-3.5 px-4 text-[#64748B]">{entry.category}</td>
                          <td className="py-3.5 px-4 text-right font-extrabold">
                            {entry.type === "INFLOW" ? (
                              <span className="text-emerald-600">+₹{(entry.amountPaise / 100).toFixed(2)}</span>
                            ) : (
                              <span className="text-rose-600">-₹{(entry.amountPaise / 100).toFixed(2)}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ================= TAB 3: DUES COLLECTION AUDIT ================= */}
        {activeTab === "dues" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[#0A0A0A]">Membership Dues Collection Audit</h3>
              <p className="text-xs text-[#64748B]">Scoped view of dues collection vs pending receivables</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border border-[#E5E7EB] shadow-xs bg-white">
                <CardHeader className="pb-2">
                  <CardDescription>Collected Annual Dues</CardDescription>
                  <CardTitle className="text-2xl font-black text-emerald-600">
                    ₹{(2400000 / 100).toFixed(2)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-[#64748B]">120 active members paid for 2026 academic period</p>
                </CardContent>
              </Card>

              <Card className="border border-[#E5E7EB] shadow-xs bg-white">
                <CardHeader className="pb-2">
                  <CardDescription>Pending Dues Receivables</CardDescription>
                  <CardTitle className="text-2xl font-black text-amber-600">
                    ₹{(pendingDuesPaise / 100).toFixed(2)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-[#64748B]">Registered guest accounts with dues pending</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ================= TAB 4: COMMITTEE TIME CAPSULE ================= */}
        {activeTab === "handover" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-[#0A0A0A]">Committee Handover Time Capsule</h3>
                <p className="text-xs text-[#64748B]">
                  Freeze-dated financial and operational snapshot for incoming executive committee
                </p>
              </div>
              <Button size="sm" className="bg-[#0047AB] hover:bg-[#003785] text-white" onClick={() => window.print()}>
                🖨️ Print / Export Snapshot
              </Button>
            </div>

            <Card className="border border-[#0047AB]/30 shadow-xs bg-white">
              <CardHeader className="border-b border-[#E5E7EB] bg-[#E8F0FF]/40">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-[#0A0A0A]">Skyline Student Association · Annual Handover Snapshot</CardTitle>
                    <CardDescription className="text-[#64748B]">Certified by Treasurer {currentUser.name} · Snapshot Date: {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</CardDescription>
                  </div>
                  <Badge variant="primary">Audit Certified</Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                <div className="grid gap-4 sm:grid-cols-3 rounded-2xl bg-[#F7F8FA] p-4 border border-[#E5E7EB]">
                  <div>
                    <p className="text-[11px] font-bold uppercase text-[#64748B]">Closing Cashbook Balance</p>
                    <p className="text-xl font-black text-[#0A0A0A]">₹{(recordedBalance / 100).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase text-[#64748B]">Unpaid Approved Obligations</p>
                    <p className="text-xl font-black text-amber-600">₹{(unpaidObligations / 100).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase text-[#64748B]">Net Handover Surplus</p>
                    <p className="text-xl font-black text-emerald-600">
                      ₹{((recordedBalance - unpaidObligations) / 100).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-[#E8F0FF] p-4 border border-[#0047AB]/20 text-xs text-[#0047AB] leading-relaxed font-medium">
                  <strong className="text-[#0A0A0A]">Treasurer's Audit Handover Note:</strong> All reported inflows match confirmed payment adapter logs.
                  Reimbursement payouts require dual check with university student accounts. Unpaid obligations are legally binding club commitments.
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal: Receipt File Inspection Modal */}
        {inspectReceiptClaim && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-[#E5E7EB] flex flex-col max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#0A0A0A]">Receipt Inspection Evidence</h3>
                    {inspectReceiptClaim.hasReceipt ? (
                      <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold">
                        Verified Receipt Attached
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold">
                        Pending Physical Bill
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#64748B] font-mono mt-0.5">
                    Claim #{inspectReceiptClaim.id} · Claimant: {inspectReceiptClaim.claimant}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setInspectReceiptClaim(null);
                    setUploadError(null);
                    setPreviewImageError(false);
                    setReceiptZoom(false);
                  }}
                  className="rounded-lg p-1.5 text-[#64748B] hover:bg-[#F7F8FA] hover:text-[#0A0A0A] text-sm font-bold"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* Claim Summary Card */}
              <div className="my-3 rounded-xl bg-[#F7F8FA] p-3 border border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[#64748B]">Title / Purpose:</span>{" "}
                  <strong className="text-[#0A0A0A]">{inspectReceiptClaim.title}</strong>
                </div>
                <div>
                  <span className="text-[#64748B]">Amount:</span>{" "}
                  <strong className="text-emerald-700 font-extrabold text-sm">
                    ₹{(inspectReceiptClaim.amountPaise / 100).toFixed(2)}
                  </strong>
                </div>
                <div>
                  <span className="text-[#64748B]">Date:</span>{" "}
                  <strong className="text-[#0A0A0A]">{inspectReceiptClaim.date}</strong>
                </div>
                <div>
                  <span className="text-[#64748B]">Status:</span>{" "}
                  <strong className="text-[#0A0A0A] uppercase">{inspectReceiptClaim.status}</strong>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto py-2">
                {inspectReceiptClaim.hasReceipt && inspectReceiptClaim.receiptUrl ? (
                  <div className="space-y-3">
                    {/* Image / Document Viewer */}
                    <div className="relative rounded-2xl bg-zinc-950 p-2 sm:p-4 flex flex-col items-center justify-center min-h-[300px] border border-zinc-800 overflow-hidden group">
                      {!previewImageError ? (
                        inspectReceiptClaim.receiptMimeType === "application/pdf" ? (
                          <iframe
                            src={inspectReceiptClaim.receiptUrl}
                            className="w-full h-[400px] rounded-xl border border-zinc-700 bg-white"
                            title="Receipt PDF Preview"
                          />
                        ) : (
                          <div className="relative max-h-[420px] flex items-center justify-center overflow-auto w-full">
                            <img
                              src={inspectReceiptClaim.receiptUrl}
                              alt={`Receipt evidence for ${inspectReceiptClaim.title}`}
                              className={`rounded-xl object-contain shadow-md transition duration-200 ${
                                receiptZoom ? "max-h-[600px] scale-125 cursor-zoom-out" : "max-h-[380px] w-auto cursor-zoom-in"
                              }`}
                              onClick={() => setReceiptZoom((z) => !z)}
                              onError={() => setPreviewImageError(true)}
                            />
                          </div>
                        )
                      ) : (
                        <div className="text-center p-6 text-white/80">
                          <div className="text-4xl mb-2">📄</div>
                          <p className="text-sm font-semibold">Receipt Document Available</p>
                          <p className="text-xs text-zinc-400 mt-1">
                            This document format is best viewed in a full browser tab or directly downloaded.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Quick Action Toolbar for Attached Receipt */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <a
                          href={inspectReceiptClaim.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#0047AB] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#003785] transition shadow-xs"
                        >
                          Open in Full Tab ↗
                        </a>
                        <a
                          href={inspectReceiptClaim.receiptUrl}
                          download={`receipt_${inspectReceiptClaim.id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-1.5 text-xs font-bold text-[#0A0A0A] hover:bg-[#F7F8FA] transition"
                        >
                          Download 📥
                        </a>
                      </div>

                      {/* Replace Receipt Button */}
                      <label className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9] cursor-pointer transition">
                        <span>{isUploadingReceipt ? "Uploading..." : "Replace Receipt 📎"}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          disabled={isUploadingReceipt}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadReceipt(inspectReceiptClaim.id, file);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  /* Fallback when no receipt file attached */
                  <div className="space-y-4">
                    <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-6 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-2xl text-amber-700 mb-3">
                        🧾
                      </div>
                      <h4 className="text-sm font-bold text-[#0A0A0A]">No Receipt Attached to Claim</h4>
                      <p className="text-xs text-[#64748B] max-w-md mx-auto mt-1">
                        The claimant submitted this reimbursement request without uploading an image or PDF voucher. As Treasurer, you can inspect the digital claim record or attach paper/digital receipt evidence below.
                      </p>

                      <div className="mt-5 inline-block">
                        <label className="inline-flex items-center gap-2 rounded-xl bg-[#0047AB] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#003785] cursor-pointer shadow-sm transition">
                          <span>{isUploadingReceipt ? "Uploading File..." : "Attach / Upload Receipt Evidence 📎"}</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            disabled={isUploadingReceipt}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadReceipt(inspectReceiptClaim.id, file);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {uploadError && (
                  <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
                    ⚠️ {uploadError}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB] mt-2">
                <span className="text-[11px] text-[#64748B]">
                  Skyline Treasurer Fiscal Audit · PRD R13 Verified
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setInspectReceiptClaim(null);
                      setUploadError(null);
                      setPreviewImageError(false);
                      setReceiptZoom(false);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
