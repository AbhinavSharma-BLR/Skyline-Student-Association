"use client";

import React from "react";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-[#3E1022] py-24 sm:py-32 text-[#F7F0E6]">
      {/* Subtle Dusty Pink Ambient Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-[#D8A7AD]/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 -left-20 h-72 w-72 rounded-full bg-[#641C32]/30 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D8A7AD]">
          Start a Conversation
        </span>

        <h2 className="mt-6 font-[family-name:var(--font-editorial-serif)] text-4xl font-normal leading-tight text-[#F7F0E6] sm:text-6xl lg:text-7xl">
          Have Something Good{" "}
          <span className="italic font-serif text-[#D8A7AD]">
            in Mind?
          </span>
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#F7F0E6]/80 sm:text-lg">
          Tell us what you're building. Let's explore what we can create
          together to elevate your brand into an unforgettable presence.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#contact"
            className="inline-flex items-center justify-center rounded-full bg-[#F7F0E6] px-8 py-4 text-xs font-semibold uppercase tracking-wider text-[#3E1022] transition duration-300 hover:bg-[#D8A7AD] hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F7F0E6] active:scale-95"
          >
            Let's Talk About Your Project
          </a>

          <a
            href="#services"
            className="inline-flex items-center justify-center rounded-full border border-[#D8A7AD]/40 px-8 py-4 text-xs font-semibold uppercase tracking-wider text-[#F7F0E6] transition duration-300 hover:border-[#F7F0E6] hover:bg-white/5"
          >
            Review Services
          </a>
        </div>
      </div>
    </section>
  );
}
