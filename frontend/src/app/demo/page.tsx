"use client";

import React, { useState } from "react";
import Link from "next/link";
import AdmitOneTicketDemo from "@/components/ui/demo";
import AdmitOneTicket from "@/components/ui/admit-one-3-d-holographic-ticket";
import { Ticket, Sparkles, ArrowLeft, ShieldCheck, Flame, Cpu, Music } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function HolographicTicketShowcasePage() {
  const { currentUser, isMember } = useAuth();
  const [selectedTheme, setSelectedTheme] = useState<"cyber" | "skyline" | "cultural">("skyline");

  // Custom configurations aligned with Skyline brand identity
  const themes = {
    skyline: {
      name: currentUser?.name?.toUpperCase() || "ADITHYA SHARMA",
      presenter: "SKYLINE STUDENT ASSOC",
      event: "TECH & INNOVATION SUMMIT 2026",
      venue: "WEST WING • MAIN AUDITORIUM",
      dates: "OCTOBER 24, 2026 • 10:00 AM",
      stubText: isMember ? "MEMBER PASS" : "GUEST PASS",
      watermark: "2026",
      texture: {
        engine: "generative",
        colorBack: "#050b14",
        colorFront: "#0047AB", // Deep Cobalt Blue
        colorHighlight: "#60a5fa",
        shape: "warp",
        type: "random",
        size: 0.6,
        colorSteps: 4,
        scale: 1,
        speed: 0.35,
      },
      gradient: undefined,
    },
    cyber: {
      name: "ALEXANDER VANCE",
      presenter: "CYBERSPACE 2026",
      event: "HACKATHON CASE SPRINT",
      venue: "INNOVATION SANDBOX",
      dates: "NOVEMBER 28, 2026 • 9:00 AM",
      stubText: "VIP ACCESS",
      watermark: "HACK",
      texture: {
        engine: "generative",
        colorBack: "#0a0515",
        colorFront: "#5b21b6",
        colorHighlight: "#a855f7",
        shape: "sphere",
        type: "4x4",
        size: 0.5,
        colorSteps: 4,
        scale: 0.9,
        speed: 0.45,
      },
      gradient: undefined,
    },
    cultural: {
      name: "ANVITHA REDDY",
      presenter: "SKYLINE CULTURAL GALA",
      event: "CAMPUS MUSIC FESTIVAL",
      venue: "OPEN AMPHITHEATRE",
      dates: "NOVEMBER 12, 2026 • 6:00 PM",
      stubText: "ALL ACCESS",
      watermark: "GALA",
      texture: {
        engine: "image",
        colorBack: "#1a0b02",
        colorFront: "#c2410c",
        colorHighlight: "#fb923c",
        shape: "wave",
        type: "8x8",
        size: 0.7,
        colorSteps: 3,
        scale: 1.1,
        speed: 0.5,
      },
      gradient: {
        centreX: 0.5,
        centreY: 0.4,
        radius: 0.65,
        midStop: 0.45,
        colorLight: "#fed7aa",
        colorMid: "#f97316",
        colorDark: "#7c2d12",
      },
    },
  };

  const currentConfig = themes[selectedTheme];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-[#0047AB] selection:text-white">
      {/* Top Header */}
      <header className="border-b border-white/10 px-6 py-4 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/30"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
            <div className="h-4 w-px bg-white/20" />
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Sparkles className="w-4 h-4 text-[#0047AB]" />
              <span>3D Holographic Foil Ticket Showcase</span>
            </div>
          </div>

          <Link
            href="/me"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#0047AB] text-white hover:bg-[#003785] transition"
          >
            My Workspace Passes →
          </Link>
        </div>
      </header>

      {/* Main Interactive Stage */}
      <main className="max-w-6xl mx-auto px-6 py-12 flex flex-col items-center">
        {/* Title & Description */}
        <div className="text-center max-w-2xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-blue-400 mb-4">
            <Ticket className="w-3.5 h-3.5" />
            <span>WebGL2 Shader · Perspective Tilt · Dynamic Hologram</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
            Skyline 3D Holographic Pass
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Move your cursor or pointer over the ticket to experience 3D perspective rotation, specular foil reflection, and procedural dithering shaders.
          </p>
        </div>

        {/* Theme Picker Tabs */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white/5 border border-white/10 mb-10">
          <button
            onClick={() => setSelectedTheme("skyline")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              selectedTheme === "skyline"
                ? "bg-[#0047AB] text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Cobalt Skyline (Default)</span>
          </button>
          <button
            onClick={() => setSelectedTheme("cyber")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              selectedTheme === "cyber"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Cyber Purple</span>
          </button>
          <button
            onClick={() => setSelectedTheme("cultural")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              selectedTheme === "cultural"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Cultural Amber (Image Drift)</span>
          </button>
        </div>

        {/* Rendered Ticket Card */}
        <div className="w-full flex justify-center py-6 overflow-hidden">
          <div className="transform scale-[0.68] sm:scale-90 md:scale-100 origin-center transition-transform">
            <AdmitOneTicket
              name={currentConfig.name}
              presenter={currentConfig.presenter}
              event={currentConfig.event}
              venue={currentConfig.venue}
              dates={currentConfig.dates}
              stubText={currentConfig.stubText}
              watermark={currentConfig.watermark}
              texture={currentConfig.texture}
              gradient={currentConfig.gradient}
              width={640}
            />
          </div>
        </div>

        {/* Technical Specs & Controls */}
        <div className="mt-12 w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <span className="text-slate-400 block mb-1 font-sans font-bold">Shader Engine</span>
            <span className="text-emerald-400">WebGL2 GLSL ES 3.00</span>
            <p className="text-[11px] text-slate-500 mt-2 font-sans">
              Real-time simplex noise, procedural dithering (Bayer matrix 2x2/4x4/8x8), and GPU fragment shaders.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <span className="text-slate-400 block mb-1 font-sans font-bold">Interactive Physics</span>
            <span className="text-blue-400">3D Matrix Tilt + Radial Glare</span>
            <p className="text-[11px] text-slate-500 mt-2 font-sans">
              Calculates pointer delta coordinates, applies perspective matrix transforms, and renders specular highlight overlays.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <span className="text-slate-400 block mb-1 font-sans font-bold">Accessibility &amp; DPI</span>
            <span className="text-amber-400">prefers-reduced-motion</span>
            <p className="text-[11px] text-slate-500 mt-2 font-sans">
              Automatically respects system motion settings, pauses drift, and scales for retina device pixel ratios.
            </p>
          </div>
        </div>

        {/* Original Component Default Demo */}
        <div className="w-full max-w-4xl mt-16 pt-12 border-t border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Original Default Demo View
            </h3>
            <span className="text-xs text-slate-500 font-mono">components/ui/demo.tsx</span>
          </div>
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <AdmitOneTicketDemo />
          </div>
        </div>
      </main>
    </div>
  );
}
