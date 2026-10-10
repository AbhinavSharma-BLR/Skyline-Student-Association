"use client";

import React, { useState } from "react";
import { useAuth, UserRole } from "@/context/auth-context";

/**
 * PersonaSwitcher Component
 * 
 * Provides an on-screen interactive control to switch roles between:
 * - Student (Active Member)
 * - Student (Non-Member)
 * - Club Officer
 * - Treasurer
 * 
 * Enables immediate evaluation of permissions, pricing discounts, and staff portals.
 */
export function PersonaSwitcher() {
  const { currentUser, loginAs } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const roles: { role: UserRole; label: string; badge: string; desc: string }[] = [
    {
      role: "student_member",
      label: "Adithya (Student Member)",
      badge: "bg-emerald-100 text-emerald-800",
      desc: "Has active pass & member ticket discounts",
    },
    {
      role: "student_guest",
      label: "Abhinav (Guest Student)",
      badge: "bg-slate-100 text-slate-700",
      desc: "Unpaid dues, regular ticket pricing",
    },
    {
      role: "officer",
      label: "Anvitha (Club Officer)",
      badge: "bg-blue-100 text-blue-800",
      desc: "Can access /desk, manage events & check-in",
    },
    {
      role: "treasurer",
      label: "Varsha (Treasurer)",
      badge: "bg-purple-100 text-purple-800",
      desc: "Can review claims & manage cashbook",
    },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="w-80 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-2xl ring-1 ring-black/5 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0047AB]">
                Demo Role Switcher
              </p>
              <p className="text-xs text-[#64748B]">Test different user permissions</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-[#64748B] hover:bg-[#F7F8FA] hover:text-[#0A0A0A] text-sm font-bold"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {roles.map((r) => {
              const isSelected = currentUser?.role === r.role;
              return (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => {
                    loginAs(r.role);
                    setIsOpen(false);
                  }}
                  className={`flex flex-col rounded-xl p-2.5 text-left transition ${
                    isSelected
                      ? "bg-[#E8F0FF] border-2 border-[#0047AB]"
                      : "border border-[#E5E7EB] hover:bg-[#F7F8FA]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0A0A0A]">{r.label}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${r.badge}`}>
                      {r.role.replace("_", " ")}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#64748B] mt-1">{r.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white/95 px-4 py-2 text-xs font-bold text-[#0A0A0A] shadow-lg backdrop-blur transition hover:border-[#0047AB] hover:scale-105 active:scale-95"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Role: <strong>{currentUser ? currentUser.name : "Guest Visitor"}</strong></span>
          <span className="rounded bg-[#E8F0FF] px-1.5 py-0.5 text-[10px] font-bold text-[#0047AB]">
            Switch
          </span>
        </button>
      )}
    </div>
  );
}
