"use client";

import React from "react";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32 lg:pt-48 lg:pb-36 bg-[#F7F0E6]">
      {/* Background Subtle Editorial Element */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-[#EAD0D1]/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 -left-20 h-80 w-80 rounded-full bg-[#D8A7AD]/25 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        {/* Editorial Eyebrow Tag */}
        <div className="mb-6 flex items-center gap-3">
          <span className="h-px w-8 bg-[#641C32]"></span>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#641C32]">
            Brand Strategy &amp; Digital Experience Agency
          </span>
        </div>

        {/* Hero Grid with Intentional Editorial Composition */}
        <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
          {/* Main Headline */}
          <div className="lg:col-span-8">
            <h1 className="font-[family-name:var(--font-editorial-serif)] text-4xl font-normal leading-[1.08] tracking-tight text-[#3E1022] sm:text-6xl md:text-7xl lg:text-[5.25rem]">
              Good Brands Deserve to Be{" "}
              <span className="italic font-serif text-[#641C32] underline decoration-[#D8A7AD]/60 decoration-wavy decoration-1 underline-offset-8">
                Unforgettable.
              </span>
            </h1>
          </div>

          {/* Supporting Copy & Action Block */}
          <div className="lg:col-span-4 lg:pb-3">
            <p className="text-base font-normal leading-relaxed text-[#292326]/80 sm:text-lg">
              We combine strategy, creativity, and digital experiences to help
              ambitious brands stand out, connect with their audience, and grow.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#contact"
                className="inline-flex items-center justify-center rounded-full bg-[#641C32] px-7 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#F7F0E6] transition duration-300 hover:bg-[#3E1022] hover:shadow-lg hover:shadow-[#641C32]/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#641C32] active:scale-95"
              >
                Start a Project
              </a>

              <a
                href="#work"
                className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#641C32] transition hover:text-[#3E1022]"
              >
                <span>Explore Our Work</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Minimalist Visual Feature: Editorial Showcase Strip */}
        <div className="mt-16 sm:mt-24 border-t border-[#D8A7AD]/40 pt-8 sm:pt-12">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#641C32]/70 font-semibold">
                Specialization
              </p>
              <p className="mt-1 font-[family-name:var(--font-editorial-serif)] text-lg text-[#3E1022]">
                Brand Strategy
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-[#641C32]/70 font-semibold">
                Craft
              </p>
              <p className="mt-1 font-[family-name:var(--font-editorial-serif)] text-lg text-[#3E1022]">
                Visual Identity
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-[#641C32]/70 font-semibold">
                Engagement
              </p>
              <p className="mt-1 font-[family-name:var(--font-editorial-serif)] text-lg text-[#3E1022]">
                Creative Campaigns
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-[#641C32]/70 font-semibold">
                Presence
              </p>
              <p className="mt-1 font-[family-name:var(--font-editorial-serif)] text-lg text-[#3E1022]">
                Digital Experiences
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
