"use client";

import React, { useState } from "react";
import AdmitOneTicket, { SkylineHolographicTicket } from "@/components/ui/admit-one-3-d-holographic-ticket";

export default function AdmitOneTicketDemo() {
  const [view, setView] = useState<"skyline" | "shader">("skyline");

  return (
    <div className="flex min-h-[600px] w-full flex-col items-center justify-center bg-zinc-950 p-6 sm:p-12 text-white">
      <div className="mb-8 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
        <button
          onClick={() => setView("skyline")}
          className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
            view === "skyline"
              ? "bg-[#0047AB] text-white shadow-xs"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          ✦ Official Skyline Holographic Pass
        </button>
        <button
          onClick={() => setView("shader")}
          className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
            view === "shader"
              ? "bg-[#0047AB] text-white shadow-xs"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          WebGL2 Matrix Shader Ticket
        </button>
      </div>

      <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
        {view === "skyline" ? (
          <SkylineHolographicTicket
            ticketId="TKT-8841-TECH"
            eventName="INNOVATION & TECH SUMMIT 2026"
            attendeeName="ALEXANDER VANCE"
            venue="MAINFRAME AUDITORIUM"
            date="OCTOBER 24-26, 2026"
            stubText="VIP PASS"
            barcodeNumber="912215"
            glow={true}
          />
        ) : (
          <AdmitOneTicket
            name="ALEXANDER VANCE"
            presenter="SKYLINE STUDENT ASSOC"
            event="TECH INNOVATION SUMMIT"
            venue="SECTOR 07 • MAINFRAME AUDITORIUM"
            dates="OCTOBER 24-26, 2026 • SAN FRANCISCO"
            stubText="VIP ACCESS"
            watermark="2026"
            width={580}
          />
        )}
        <p className="text-xs font-mono text-zinc-400 text-center">
          Move your cursor over the pass to experience interactive 3D perspective tilt, specular rainbow glare, and neon reflection.
        </p>
      </div>
    </div>
  );
}
