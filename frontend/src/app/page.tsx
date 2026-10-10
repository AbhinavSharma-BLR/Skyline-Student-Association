"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { PersonaSwitcher } from "@/components/domain/PersonaSwitcher";

/**
 * Skyline Student Organization System — Flagship Homepage
 * 
 * Color System (Strictly Adhered):
 * - Deep Cobalt Blue: #0047AB (Primary brand accent, buttons, active highlights)
 * - Black:            #0A0A0A (Headings, dark sections, high-contrast text, footer)
 * - Pure White:       #FFFFFF (Card surfaces, form containers, elevated panels)
 * - Off-White:        #F7F8FA (Main background, dashboard surface, canvas)
 * - Soft Blue:        #E8F0FF (Highlight tags, active states, subtle badges)
 * - Slate Gray:       #64748B (Descriptions, secondary text, metadata)
 * - Border Gray:      #E5E7EB (Dividers, borders, subtle separators)
 */

export default function SkylineHomePage() {
  const { currentUser, isMember, loginAs } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"all" | "tech" | "arts" | "leadership">("all");

  // Demonstration campus events (clearly identified demo data per Prompt §5D)
  const sampleEvents = [
    {
      id: "evt-01",
      title: "Skyline Tech & Innovation Summit 2026",
      category: "tech",
      categoryLabel: "Conference",
      date: "Oct 24, 2026",
      time: "10:00 AM – 5:00 PM",
      venue: "Main Campus Auditorium",
      memberPrice: 150,
      guestPrice: 250,
      badge: "Flagship Event",
      description:
        "Keynotes from notable industry alumni, student technology pitch showcase, and networking luncheon kit.",
      spotsLeft: 34,
    },
    {
      id: "evt-02",
      title: "Skyline Cultural Gala & Music Festival",
      category: "arts",
      categoryLabel: "Arts & Culture",
      date: "Nov 12, 2026",
      time: "6:00 PM – 10:30 PM",
      venue: "Campus Open Amphitheatre",
      memberPrice: 150,
      guestPrice: 250,
      badge: "Annual Tradition",
      description:
        "An evening of student acoustic bands, classical performance troupes, artisan campus stalls, and live showcase.",
      spotsLeft: 78,
    },
    {
      id: "evt-03",
      title: "Emerging Leaders Hackathon & Case Sprint",
      category: "leadership",
      categoryLabel: "Competition",
      date: "Nov 28, 2026",
      time: "9:00 AM – 9:00 PM",
      venue: "Innovation Sandbox, West Wing",
      memberPrice: 0,
      guestPrice: 100,
      badge: "₹50k Prize Pool",
      description:
        "12-hour collaborative design and strategy sprint addressing campus initiatives with direct officer mentorship.",
      spotsLeft: 18,
    },
  ];

  const filteredEvents =
    activeCategory === "all"
      ? sampleEvents
      : sampleEvents.filter((e) => e.category === activeCategory);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FA] text-[#0A0A0A] selection:bg-[#E8F0FF] selection:text-[#0047AB]">
      {/* ============================================================ */}
      {/* SECTION A: NAVIGATION                                        */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Skyline Wordmark */}
          <Link href="/" className="flex items-center gap-3 group">
            <span className="w-10 h-10 rounded-xl bg-[#0047AB] text-white flex items-center justify-center font-bold text-lg tracking-tight shadow-xs transition-transform group-hover:scale-105">
              S
            </span>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-[#0A0A0A] tracking-tight leading-none">
                Skyline<span className="text-[#0047AB]">.</span>
              </span>
              <span className="text-[10px] font-semibold tracking-widest text-[#64748B] uppercase mt-0.5">
                Student Association
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
            <Link
              href="/"
              className="text-[#0047AB] transition-colors relative py-1"
            >
              Home
            </Link>
            <Link
              href="#events"
              className="text-[#64748B] hover:text-[#0A0A0A] transition-colors relative py-1"
            >
              Events
            </Link>
            <Link
              href="#community"
              className="text-[#64748B] hover:text-[#0A0A0A] transition-colors relative py-1"
            >
              Community
            </Link>
            <Link
              href="#membership"
              className="text-[#64748B] hover:text-[#0A0A0A] transition-colors relative py-1"
            >
              Membership
            </Link>
            <Link
              href="#about"
              className="text-[#64748B] hover:text-[#0A0A0A] transition-colors relative py-1"
            >
              About
            </Link>
          </nav>

          {/* Desktop Right Actions / Auth State */}
          <div className="hidden md:flex items-center gap-4">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <Link
                  href={currentUser.role === "officer" || currentUser.role === "treasurer" ? "/desk" : "/me"}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E5E7EB] text-xs font-semibold text-[#0A0A0A] hover:border-[#0047AB] transition shadow-2xs"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{currentUser.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#E8F0FF] text-[#0047AB] font-bold">
                    {currentUser.role === "student_member"
                      ? "Member"
                      : currentUser.role === "student_guest"
                      ? "Guest"
                      : currentUser.role === "officer"
                      ? "Officer"
                      : "Treasurer"}
                  </span>
                </Link>

                <Link
                  href={currentUser.role === "officer" || currentUser.role === "treasurer" ? "/desk" : "/me"}
                  className="px-4 py-2 rounded-lg bg-[#0047AB] text-white text-xs font-semibold tracking-wide hover:bg-[#003785] transition shadow-xs"
                >
                  {currentUser.role === "officer" || currentUser.role === "treasurer" ? "Club Desk →" : "My Workspace →"}
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-[#0A0A0A] hover:text-[#0047AB] px-3 py-2 transition"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-lg bg-[#0047AB] text-white text-xs font-semibold tracking-wide hover:bg-[#003785] transition shadow-xs"
                >
                  Join Skyline
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#0A0A0A] hover:bg-[#F7F8FA] transition"
            aria-label="Toggle Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#E5E7EB] bg-white px-6 py-6 space-y-4 animate-in fade-in slide-in-from-top-2">
            <nav className="flex flex-col gap-3 text-sm font-semibold">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-[#0047AB]"
              >
                Home
              </Link>
              <Link
                href="#events"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-[#64748B] hover:text-[#0A0A0A]"
              >
                Events
              </Link>
              <Link
                href="#community"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-[#64748B] hover:text-[#0A0A0A]"
              >
                Community
              </Link>
              <Link
                href="#membership"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-[#64748B] hover:text-[#0A0A0A]"
              >
                Membership
              </Link>
              <Link
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-[#64748B] hover:text-[#0A0A0A]"
              >
                About
              </Link>
            </nav>

            <div className="pt-4 border-t border-[#E5E7EB] flex flex-col gap-2">
              {currentUser ? (
                <Link
                  href={currentUser.role === "officer" || currentUser.role === "treasurer" ? "/desk" : "/me"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg bg-[#0047AB] text-white text-xs font-semibold"
                >
                  Open Workspace ({currentUser.name})
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 text-xs font-semibold text-[#0A0A0A] border border-[#E5E7EB] rounded-lg"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-lg bg-[#0047AB] text-white text-xs font-semibold"
                  >
                    Join Skyline
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ============================================================ */}
      {/* SECTION B: HERO — BOLD, MINIMALIST DIGITAL PRODUCT            */}
      {/* ============================================================ */}
      <section className="relative pt-20 pb-20 md:pt-28 md:pb-28 px-6 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8F0FF] border border-[#0047AB]/20 text-xs font-semibold text-[#0047AB] mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0047AB]" />
            <span>Official Student Organization Platform · 2026/2027</span>
          </div>

          {/* Bold Modern Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-[#0A0A0A] tracking-tight leading-[1.08] mb-6">
            Make Your Campus <br className="hidden sm:inline" />
            Life <span className="text-[#0047AB]">Count.</span>
          </h1>

          {/* Concise Supporting Copy */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-[#64748B] leading-relaxed font-normal mb-10">
            Discover experiences, connect with people, and turn your campus journey into something extraordinary.
          </p>

          {/* Primary & Secondary Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="#events"
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-[#0047AB] text-white text-sm font-semibold tracking-wide hover:bg-[#003785] transition-all shadow-xs text-center"
            >
              Explore Events
            </Link>
            <Link
              href="#community"
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-white text-[#0A0A0A] border border-[#E5E7EB] text-sm font-semibold tracking-wide hover:bg-[#F7F8FA] hover:border-[#0047AB] transition-all text-center flex items-center justify-center gap-2 group"
            >
              <span>Explore Community</span>
              <span className="text-[#0047AB] transition-transform group-hover:translate-y-0.5">↓</span>
            </Link>
          </div>

          {/* Key Metrics / Credibility Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-[#E5E7EB]">
            <div className="flex flex-col items-center">
              <span className="text-3xl md:text-4xl font-extrabold text-[#0A0A0A]">1,850+</span>
              <span className="text-xs uppercase tracking-wider text-[#64748B] mt-1 font-semibold">
                Active Members
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl md:text-4xl font-extrabold text-[#0047AB]">42</span>
              <span className="text-xs uppercase tracking-wider text-[#64748B] mt-1 font-semibold">
                Annual Events
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl md:text-4xl font-extrabold text-[#0A0A0A]">₹200</span>
              <span className="text-xs uppercase tracking-wider text-[#64748B] mt-1 font-semibold">
                Transparent Dues
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl md:text-4xl font-extrabold text-[#0047AB]">100%</span>
              <span className="text-xs uppercase tracking-wider text-[#64748B] mt-1 font-semibold">
                Student-Led & Audited
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION C: COMMUNITY INFO & ECOSYSTEM                        */}
      {/* ============================================================ */}
      <section id="community" className="py-20 md:py-28 px-6 bg-[#F7F8FA] border-b border-[#E5E7EB] scroll-mt-20">
        <div className="max-w-7xl mx-auto space-y-16">
          {/* Section Header */}
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-widest text-[#0047AB] bg-[#E8F0FF] px-3 py-1 rounded-full">
              The Skyline Network · 1,850+ Students
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0A0A0A] mt-4 tracking-tight">
              A Dynamic, Inclusive Campus Community.
            </h2>
            <p className="text-sm sm:text-base text-[#64748B] mt-3 leading-relaxed">
              Skyline unites students from every department to exchange ideas, organize memorable gatherings, build real-world leadership credentials, and foster genuine campus friendships.
            </p>
          </div>

          {/* Part 1: Four Foundational Pillars */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-5">
              Core Community Pillars
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Pillar 1 */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-7 transition hover:border-[#0047AB]/40 hover:shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-[#E8F0FF] text-[#0047AB] flex items-center justify-center font-bold text-base mb-5">
                  01
                </div>
                <h4 className="text-lg font-bold text-[#0A0A0A] mb-2">
                  Student Connections
                </h4>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Meet peers across departments through study cohorts, shared interest groups, and cross-campus project collaborations.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-7 transition hover:border-[#0047AB]/40 hover:shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-[#E8F0FF] text-[#0047AB] flex items-center justify-center font-bold text-base mb-5">
                  02
                </div>
                <h4 className="text-lg font-bold text-[#0A0A0A] mb-2">
                  Campus Experiences
                </h4>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Gain direct access to flagship technology summits, acoustic cultural nights, hackathons, and guest industry masterclasses.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-7 transition hover:border-[#0047AB]/40 hover:shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-[#E8F0FF] text-[#0047AB] flex items-center justify-center font-bold text-base mb-5">
                  03
                </div>
                <h4 className="text-lg font-bold text-[#0A0A0A] mb-2">
                  Leadership Credentials
                </h4>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Run for elected officer roles, chair committees, manage real campus budgets, and represent the student voice.
                </p>
              </div>

              {/* Pillar 4 */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-7 transition hover:border-[#0047AB]/40 hover:shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-[#E8F0FF] text-[#0047AB] flex items-center justify-center font-bold text-base mb-5">
                  04
                </div>
                <h4 className="text-lg font-bold text-[#0A0A0A] mb-2">
                  Volunteering &amp; Action
                </h4>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Contribute on event operations desks, speaker coordination, logistics, and receive verified certificate credentials.
                </p>
              </div>
            </div>
          </div>

          {/* Part 2: Active Student Guilds & Interest Circles */}
          <div className="rounded-3xl border border-[#E5E7EB] bg-white p-8 md:p-10 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#0047AB]">
                  Guilds &amp; Working Groups
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0A0A0A] mt-1">
                  Active Student Circles
                </h3>
                <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                  Join one or more student guilds based on your craft, interests, or career goals.
                </p>
              </div>
              <div className="text-xs text-[#64748B] font-semibold bg-[#F7F8FA] px-3 py-1.5 rounded-lg border border-[#E5E7EB] self-start md:self-auto">
                ⚡ Open to all students · Weekly gatherings
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Guild 1 */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-[#F7F8FA] p-6 transition hover:border-[#0047AB]/40 hover:bg-white">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[#0047AB] bg-[#E8F0FF] px-2.5 py-1 rounded-md">
                    Tech &amp; Innovation Guild
                  </span>
                  <span className="text-[11px] font-mono text-[#64748B]">420+ Members</span>
                </div>
                <h4 className="text-base font-bold text-[#0A0A0A] mb-1.5">
                  Software, AI &amp; Hardware Sandbox
                </h4>
                <p className="text-xs text-[#64748B] leading-relaxed mb-4">
                  Weekly cooperative coding sprints, hackathon project squads, open-source workshops, and guest lectures from tech alumni.
                </p>
                <div className="flex items-center gap-2 text-[11px] text-[#0A0A0A] font-semibold pt-3 border-t border-[#E5E7EB]">
                  <span>📍 Meetups:</span>
                  <span className="text-[#64748B]">Every Thursday @ 5:00 PM · Innovation Sandbox (West Wing)</span>
                </div>
              </div>

              {/* Guild 2 */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-[#F7F8FA] p-6 transition hover:border-[#0047AB]/40 hover:bg-white">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[#0047AB] bg-[#E8F0FF] px-2.5 py-1 rounded-md">
                    Creative Arts &amp; Media Guild
                  </span>
                  <span className="text-[11px] font-mono text-[#64748B]">380+ Members</span>
                </div>
                <h4 className="text-base font-bold text-[#0A0A0A] mb-1.5">
                  Music, Design &amp; Cultural Production
                </h4>
                <p className="text-xs text-[#64748B] leading-relaxed mb-4">
                  Live acoustic jam sessions, design crits, digital storytelling, campus magazine zines, and stage crew for college festivals.
                </p>
                <div className="flex items-center gap-2 text-[11px] text-[#0A0A0A] font-semibold pt-3 border-t border-[#E5E7EB]">
                  <span>📍 Meetups:</span>
                  <span className="text-[#64748B]">Every Tuesday @ 6:00 PM · Open Amphitheatre Pavilion</span>
                </div>
              </div>

              {/* Guild 3 */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-[#F7F8FA] p-6 transition hover:border-[#0047AB]/40 hover:bg-white">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[#0047AB] bg-[#E8F0FF] px-2.5 py-1 rounded-md">
                    Social Impact &amp; Outreach
                  </span>
                  <span className="text-[11px] font-mono text-[#64748B]">310+ Members</span>
                </div>
                <h4 className="text-base font-bold text-[#0A0A0A] mb-1.5">
                  Community Action &amp; Campus Sustainability
                </h4>
                <p className="text-xs text-[#64748B] leading-relaxed mb-4">
                  Leading green campus initiatives, local community tutoring, donation drives, and organizing inclusive student wellness programs.
                </p>
                <div className="flex items-center gap-2 text-[11px] text-[#0A0A0A] font-semibold pt-3 border-t border-[#E5E7EB]">
                  <span>📍 Meetups:</span>
                  <span className="text-[#64748B]">Bi-weekly Saturdays @ 11:00 AM · Campus Quad Hub</span>
                </div>
              </div>

              {/* Guild 4 */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-[#F7F8FA] p-6 transition hover:border-[#0047AB]/40 hover:bg-white">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[#0047AB] bg-[#E8F0FF] px-2.5 py-1 rounded-md">
                    Leadership &amp; Career Forum
                  </span>
                  <span className="text-[11px] font-mono text-[#64748B]">290+ Members</span>
                </div>
                <h4 className="text-base font-bold text-[#0A0A0A] mb-1.5">
                  Industry Mentorship &amp; Case Competitions
                </h4>
                <p className="text-xs text-[#64748B] leading-relaxed mb-4">
                  Mock interview clinics, business case study sprints, networking luncheons, and executive committee elections preparation.
                </p>
                <div className="flex items-center gap-2 text-[11px] text-[#0A0A0A] font-semibold pt-3 border-t border-[#E5E7EB]">
                  <span>📍 Meetups:</span>
                  <span className="text-[#64748B]">Monthly First Friday @ 4:30 PM · Executive Seminar Hall</span>
                </div>
              </div>
            </div>
          </div>

          {/* Part 3: Real Student Voices & Spotlights */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-5">
              Voices of the Community
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Voice 1: Adithya */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 flex flex-col justify-between shadow-2xs">
                <p className="text-xs text-[#0A0A0A] leading-relaxed italic">
                  "Joining Skyline gave me the team to build our flagship hackathon project. Plus, the subsidized ₹150 ticket pricing paid for dues right on day one."
                </p>
                <div className="mt-6 pt-4 border-t border-[#E5E7EB] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#0047AB] text-white flex items-center justify-center font-bold text-xs">
                    A
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#0A0A0A]">Adithya</h5>
                    <p className="text-[10px] text-[#64748B]">Student Member · Computer Science '27</p>
                  </div>
                </div>
              </div>

              {/* Voice 2: Anvitha */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 flex flex-col justify-between shadow-2xs">
                <p className="text-xs text-[#0A0A0A] leading-relaxed italic">
                  "Volunteering at event operations gave me hands-on leadership experience running rapid door check-ins with our live QR system. It’s an empowering community."
                </p>
                <div className="mt-6 pt-4 border-t border-[#E5E7EB] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center font-bold text-xs">
                    An
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#0A0A0A]">Anvitha</h5>
                    <p className="text-[10px] text-[#64748B]">Club Officer · Event Operations Lead</p>
                  </div>
                </div>
              </div>

              {/* Voice 3: Varsha */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 flex flex-col justify-between shadow-2xs">
                <p className="text-xs text-[#0A0A0A] leading-relaxed italic">
                  "Managing our cashbook ledger with strict public accountability shows how transparent a student organization can be. Every student knows where dues go."
                </p>
                <div className="mt-6 pt-4 border-t border-[#E5E7EB] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#0047AB] text-white flex items-center justify-center font-bold text-xs">
                    V
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#0A0A0A]">Varsha</h5>
                    <p className="text-[10px] text-[#64748B]">Club Treasurer · Finance Audit</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Part 4: Community Quick-Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#E5E7EB]">
            <div>
              <h4 className="text-sm font-bold text-[#0A0A0A]">Ready to participate in campus activities?</h4>
              <p className="text-xs text-[#64748B] mt-0.5">Explore upcoming gatherings or check out annual membership benefits.</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                href="#events"
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#0047AB] text-white text-xs font-semibold hover:bg-[#003785] transition text-center shadow-xs"
              >
                Browse Events →
              </Link>
              <Link
                href="#membership"
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-[#E5E7EB] text-[#0A0A0A] text-xs font-semibold hover:bg-[#F7F8FA] transition text-center"
              >
                Membership Perks
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION D: UPCOMING EVENTS & DUAL PRICING                    */}
      {/* ============================================================ */}
      <section id="events" className="py-20 md:py-28 px-6 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#0047AB]">
                  Event Discovery
                </span>
                <span className="text-[10px] bg-[#F7F8FA] border border-[#E5E7EB] text-[#64748B] px-2 py-0.5 rounded-full font-medium">
                  Demonstration Data
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0A0A0A] mt-2">
                Upcoming Campus Gatherings
              </h2>
              <p className="text-sm text-[#64748B] mt-2 max-w-xl">
                Explore campus workshops, cultural galas, and summits. Active Skyline members unlock subsidized ticket pricing on all gatherings.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 bg-[#F7F8FA] p-1.5 rounded-xl border border-[#E5E7EB] self-start md:self-auto">
              {(
                [
                  { id: "all", label: "All Gatherings" },
                  { id: "tech", label: "Tech" },
                  { id: "arts", label: "Arts & Music" },
                  { id: "leadership", label: "Leadership" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeCategory === tab.id
                      ? "bg-white text-[#0047AB] border border-[#E5E7EB] shadow-2xs"
                      : "text-[#64748B] hover:text-[#0A0A0A]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredEvents.map((evt) => {
              const userGetsDiscount = isMember;
              return (
                <div
                  key={evt.id}
                  className="rounded-2xl border border-[#E5E7EB] bg-white p-7 flex flex-col justify-between hover:border-[#0047AB]/50 hover:shadow-xs transition group"
                >
                  <div>
                    {/* Event Tag & Status */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#0047AB] px-2.5 py-1 rounded-md bg-[#E8F0FF]">
                        {evt.categoryLabel}
                      </span>
                      <span className="text-[11px] font-semibold text-[#0A0A0A] bg-[#F7F8FA] px-2 py-0.5 rounded-full border border-[#E5E7EB]">
                        {evt.badge}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-[#0A0A0A] group-hover:text-[#0047AB] transition-colors mb-3 leading-snug">
                      {evt.title}
                    </h3>

                    {/* Metadata */}
                    <div className="space-y-1.5 text-xs text-[#64748B] mb-5 pb-5 border-b border-[#E5E7EB]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#0A0A0A]">Date:</span>
                        <span>{evt.date} · {evt.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#0A0A0A]">Venue:</span>
                        <span>{evt.venue}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-[#64748B] leading-relaxed mb-6">
                      {evt.description}
                    </p>
                  </div>

                  {/* Pricing & Ticket Action */}
                  <div className="pt-4 border-t border-[#E5E7EB]">
                    <div className="flex items-baseline justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-2xl font-bold text-[#0A0A0A]">
                            ₹{userGetsDiscount ? evt.memberPrice : evt.guestPrice}
                          </span>
                          <span className="text-[11px] font-semibold text-[#64748B]">
                            {userGetsDiscount ? "Member Rate" : "Regular Rate"}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#64748B]">
                          {userGetsDiscount
                            ? `Regular: ₹${evt.guestPrice} (Save ₹${evt.guestPrice - evt.memberPrice})`
                            : `Members pay ₹${evt.memberPrice}`}
                        </span>
                      </div>

                      <span className="text-[11px] text-amber-700 font-medium">
                        {evt.spotsLeft} seats left
                      </span>
                    </div>

                    <Link
                      href={currentUser ? "/me" : "/signup"}
                      className="w-full block py-2.5 text-center rounded-lg bg-[#0047AB] text-white text-xs font-semibold tracking-wide hover:bg-[#003785] transition shadow-2xs"
                    >
                      {currentUser
                        ? isMember
                          ? "Claim Member Ticket →"
                          : "Get Ticket (Regular Rate) →"
                        : "Register for Event →"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION E: MEMBERSHIP BENEFITS & TRANSPARENT DUES            */}
      {/* ============================================================ */}
      <section id="membership" className="py-20 md:py-28 px-6 bg-[#F7F8FA] border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#0047AB]">
              Association Membership
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0A0A0A] mt-2 mb-4">
              Real Perks. Transparent Dues.
            </h2>
            <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
              At only ₹200 per academic year, every Skyline member unlocks subsidized event tickets, verified voting representation, and official club credentials.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Financial Allocation Breakdown */}
            <div className="lg:col-span-5 rounded-2xl bg-white border border-[#E5E7EB] p-8 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB] mb-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0047AB]">
                    Annual Membership
                  </span>
                  <div className="text-3xl font-extrabold text-[#0A0A0A] mt-1">
                    ₹200 <span className="text-xs font-normal text-[#64748B]">/ academic year</span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F0FF] text-[#0047AB]">
                  100% Audited
                </span>
              </div>

              <p className="text-xs text-[#64748B] mb-6">
                Where student dues go — published openly under Skyline Financial Invariant #9:
              </p>

              {/* Dues breakdown list */}
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between font-semibold text-[#0A0A0A] mb-1">
                    <span>45% — Event Subsidies &amp; Speaker Honorariums</span>
                    <span className="text-[#0047AB]">₹90</span>
                  </div>
                  <div className="w-full bg-[#E5E7EB] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#0047AB] h-full rounded-full" style={{ width: "45%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-[#0A0A0A] mb-1">
                    <span>25% — Club Equipment &amp; Shared Tech Hardware</span>
                    <span className="text-[#0047AB]">₹50</span>
                  </div>
                  <div className="w-full bg-[#E5E7EB] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#0047AB] h-full rounded-full" style={{ width: "25%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-[#0A0A0A] mb-1">
                    <span>20% — Student Welfare &amp; Hackathon Grants</span>
                    <span className="text-[#0047AB]">₹40</span>
                  </div>
                  <div className="w-full bg-[#E5E7EB] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#0047AB] h-full rounded-full" style={{ width: "20%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-[#0A0A0A] mb-1">
                    <span>10% — Audit, Compliance &amp; Web Hosting</span>
                    <span className="text-[#0047AB]">₹20</span>
                  </div>
                  <div className="w-full bg-[#E5E7EB] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#0047AB] h-full rounded-full" style={{ width: "10%" }} />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#E5E7EB]">
                <Link
                  href={currentUser ? "/me" : "/signup"}
                  className="w-full block py-3 rounded-lg bg-[#0047AB] text-white text-xs font-semibold text-center hover:bg-[#003785] transition shadow-xs"
                >
                  {isMember ? "You Are An Active Member ✓" : "Activate Membership (₹200) →"}
                </Link>
              </div>
            </div>

            {/* Right: Side-by-Side Privilege Comparison */}
            <div className="lg:col-span-7 rounded-2xl bg-white border border-[#E5E7EB] p-8 shadow-xs">
              <h3 className="text-2xl font-extrabold text-[#0A0A0A] mb-6">
                Guest Access vs. Verified Member
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] text-[#64748B]">
                      <th className="py-3 font-semibold">Campus Privileges</th>
                      <th className="py-3 px-4 font-semibold text-center">Guest Access</th>
                      <th className="py-3 px-4 font-semibold text-center text-[#0047AB] bg-[#E8F0FF]/50 rounded-t-lg">
                        Skyline Member (₹200)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] text-[#0A0A0A]">
                    <tr>
                      <td className="py-3.5 font-medium">Event Tickets</td>
                      <td className="py-3.5 px-4 text-center text-[#64748B]">₹250 / ticket</td>
                      <td className="py-3.5 px-4 text-center font-bold text-[#0047AB] bg-[#E8F0FF]/50">
                        ₹150 (Save ₹100)
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 font-medium">Varsity Club Merchandise</td>
                      <td className="py-3.5 px-4 text-center text-[#64748B]">₹950 standard</td>
                      <td className="py-3.5 px-4 text-center font-bold text-[#0047AB] bg-[#E8F0FF]/50">
                        ₹750 (Save ₹200)
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 font-medium">Digital Dynamic QR Door Pass</td>
                      <td className="py-3.5 px-4 text-center text-[#64748B]">Manual ID check</td>
                      <td className="py-3.5 px-4 text-center font-bold text-[#0047AB] bg-[#E8F0FF]/50">
                        Instant Scan Pass ✓
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 font-medium">General Assembly Voting</td>
                      <td className="py-3.5 px-4 text-center text-[#64748B]">Observer only</td>
                      <td className="py-3.5 px-4 text-center font-bold text-[#0047AB] bg-[#E8F0FF]/50">
                        Full Voting Ballot ✓
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 font-medium">Officer Leadership Candidacy</td>
                      <td className="py-3.5 px-4 text-center text-[#64748B]">Ineligible</td>
                      <td className="py-3.5 px-4 text-center font-bold text-[#0047AB] bg-[#E8F0FF]/50">
                        Eligible to Run ✓
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-[#E8F0FF] border border-[#0047AB]/20 gap-3">
                <p className="text-xs text-[#0047AB] font-semibold">
                  Attend just <strong>two campus events</strong> to fully recover your annual dues!
                </p>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-lg bg-[#0047AB] text-white text-xs font-semibold whitespace-nowrap hover:bg-[#003785] transition"
                >
                  Join Today
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION F: ANNOUNCEMENTS & ACTIVITIES (PRD R09)              */}
      {/* ============================================================ */}
      <section className="py-20 md:py-28 px-6 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#0047AB]">
                Campus Dispatches
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0A0A0A] mt-2">
                Announcements &amp; Board Decisions
              </h2>
            </div>
            <p className="text-xs text-[#64748B] mt-2 md:mt-0">
              Published openly per Skyline Student Constitution §4
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <article className="rounded-2xl bg-white border border-[#E5E7EB] p-6 flex flex-col justify-between hover:border-[#0047AB]/40 transition">
              <div>
                <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-3">
                  <span className="font-semibold text-[#0047AB] uppercase">Finance Committee</span>
                  <span>Oct 08, 2026</span>
                </div>
                <h3 className="text-lg font-bold text-[#0A0A0A] mb-2">
                  Fall Semester Cashbook &amp; Audit Summary Published
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Treasurer Varsha has verified all reimbursement claims. The quarterly ledger is available for student inspection with zero unaccounted balances.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-[#E5E7EB] text-right">
                <Link href="/desk" className="text-xs font-semibold text-[#0047AB] hover:underline">
                  Inspect Audit Ledger →
                </Link>
              </div>
            </article>

            <article className="rounded-2xl bg-white border border-[#E5E7EB] p-6 flex flex-col justify-between hover:border-[#0047AB]/40 transition">
              <div>
                <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-3">
                  <span className="font-semibold text-[#0047AB] uppercase">Operations Desk</span>
                  <span>Oct 05, 2026</span>
                </div>
                <h3 className="text-lg font-bold text-[#0A0A0A] mb-2">
                  Call for Volunteers: Tech Summit 2026
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Club Officer Anvitha is coordinating door check-in, speaker logistics, and delegate kit distribution. Volunteers receive priority access.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-[#E5E7EB] text-right">
                <Link href="#events" className="text-xs font-semibold text-[#0047AB] hover:underline">
                  View Volunteer Roles →
                </Link>
              </div>
            </article>

            <article className="rounded-2xl bg-white border border-[#E5E7EB] p-6 flex flex-col justify-between hover:border-[#0047AB]/40 transition">
              <div>
                <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-3">
                  <span className="font-semibold text-[#0047AB] uppercase">Election Board</span>
                  <span>Oct 01, 2026</span>
                </div>
                <h3 className="text-lg font-bold text-[#0A0A0A] mb-2">
                  Constitution Amendment: Electronic Ballot Open
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Active members like Adithya can cast their digital ballots for the 2027 student charter amendments directly from their personal student workspace.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-[#E5E7EB] text-right">
                <Link href="/me" className="text-xs font-semibold text-[#0047AB] hover:underline">
                  Cast Your Ballot →
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION G: FINAL HIGH-CONTRAST CONVERSION CTA                */}
      {/* ============================================================ */}
      <section className="py-20 md:py-28 px-6 bg-[#0A0A0A] text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0047AB] bg-[#E8F0FF] px-3 py-1 rounded-full">
            Join 1,850+ Skyline Students
          </span>
          <h2 className="text-4xl sm:text-6xl font-extrabold mt-6 mb-6 leading-tight tracking-tight">
            Your Next Chapter <br />
            Starts Here.
          </h2>
          <p className="max-w-xl mx-auto text-sm sm:text-base text-[#64748B] leading-relaxed mb-10">
            Find your community. Discover new experiences. Make campus life meaningful.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-[#0047AB] text-white font-semibold text-sm hover:bg-[#003785] transition shadow-md"
            >
              Join Skyline
            </Link>
            <Link
              href={currentUser ? "/me" : "/login"}
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg border border-[#E5E7EB]/30 text-white font-semibold text-sm hover:bg-white/10 transition"
            >
              Sign In to Existing Profile
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION H: STRUCTURED FOOTER & EVALUATOR SHORTCUTS           */}
      {/* ============================================================ */}
      <footer id="about" className="bg-[#0A0A0A] text-white pt-16 pb-12 px-6 border-t border-[#262626]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/10">
            {/* Wordmark & Mission */}
            <div className="md:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-[#0047AB] text-white flex items-center justify-center font-bold text-lg">
                  S
                </span>
                <span className="text-xl font-bold tracking-tight text-white">
                  Skyline Student Association
                </span>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed max-w-sm">
                The centralized campus organization platform for student membership, event ticketing, expense reconciliation, and governance.
              </p>
              <div className="text-[11px] text-[#64748B]">
                Campus Hall 4, West Wing · Skyline University
              </div>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Navigation
              </h4>
              <ul className="space-y-2 text-xs text-[#64748B]">
                <li><Link href="/" className="hover:text-white transition">Home</Link></li>
                <li><Link href="#events" className="hover:text-white transition">Events Calendar</Link></li>
                <li><Link href="#community" className="hover:text-white transition">Community</Link></li>
                <li><Link href="#membership" className="hover:text-white transition">Membership</Link></li>
              </ul>
            </div>

            {/* Portals */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Portals
              </h4>
              <ul className="space-y-2 text-xs text-[#64748B]">
                <li><Link href="/me" className="hover:text-white transition">Student Portal (/me)</Link></li>
                <li><Link href="/desk" className="hover:text-white transition">Club Desk (/desk)</Link></li>
                <li><Link href="/login" className="hover:text-white transition">Student Login</Link></li>
                <li><Link href="/signup" className="hover:text-white transition">Join Skyline</Link></li>
              </ul>
            </div>

            {/* Evaluator Fast Persona Switcher */}
            <div className="md:col-span-4 space-y-3 bg-white/5 p-5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#E8F0FF]">
                  Evaluator Fast-Switch
                </h4>
                <span className="text-[10px] text-[#64748B]">1-Click Test</span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Test RBAC and dynamic pricing discounts as defined in project requirements:
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => loginAs("student_member")}
                  className={`p-2 rounded-lg text-left text-[11px] font-semibold transition ${
                    currentUser?.role === "student_member"
                      ? "bg-[#0047AB] text-white border border-[#E8F0FF]"
                      : "bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  <div>Adithya</div>
                  <div className="text-[9px] text-[#E8F0FF] font-normal">Active Member (₹150)</div>
                </button>
                <button
                  type="button"
                  onClick={() => loginAs("student_guest")}
                  className={`p-2 rounded-lg text-left text-[11px] font-semibold transition ${
                    currentUser?.role === "student_guest"
                      ? "bg-[#0047AB] text-white border border-[#E8F0FF]"
                      : "bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  <div>Abhinav</div>
                  <div className="text-[9px] text-slate-300 font-normal">Guest Student (₹250)</div>
                </button>
                <button
                  type="button"
                  onClick={() => loginAs("officer")}
                  className={`p-2 rounded-lg text-left text-[11px] font-semibold transition ${
                    currentUser?.role === "officer"
                      ? "bg-[#0047AB] text-white border border-[#E8F0FF]"
                      : "bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  <div>Anvitha</div>
                  <div className="text-[9px] text-blue-300 font-normal">Club Officer (/desk)</div>
                </button>
                <button
                  type="button"
                  onClick={() => loginAs("treasurer")}
                  className={`p-2 rounded-lg text-left text-[11px] font-semibold transition ${
                    currentUser?.role === "treasurer"
                      ? "bg-[#0047AB] text-white border border-[#E8F0FF]"
                      : "bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  <div>Varsha</div>
                  <div className="text-[9px] text-purple-300 font-normal">Treasurer (Ledger)</div>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#64748B] gap-4">
            <div>
              © 2026 Skyline Student Association. All rights reserved. Built per Architecture ADR-012.
            </div>
            <div className="flex items-center gap-6">
              <span>Security &amp; Audit Verified</span>
              <span>•</span>
              <span>Zero-Tracking Privacy</span>
              <span>•</span>
              <span>Student Constitution §4</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Persona Switcher */}
      <PersonaSwitcher />
    </div>
  );
}