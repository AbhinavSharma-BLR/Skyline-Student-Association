"use client";

import React from "react";

export function ValueProposition() {
  const pillars = [
    {
      number: "01",
      title: "Strategy-Led Thinking",
      description:
        "Every creative initiative begins with deep clarity around your market positioning, commercial objectives, and the unique whitespace your brand can own.",
    },
    {
      number: "02",
      title: "Distinctive Creative Direction",
      description:
        "We reject generic templates and predictable formulas, crafting visual and verbal identities designed to command attention and endure over time.",
    },
    {
      number: "03",
      title: "Audience-Focused Campaigns",
      description:
        "We build narratives and digital touchpoints tailored to what your audience genuinely cares about, turning passive scrollers into devoted brand advocates.",
    },
    {
      number: "04",
      title: "Measurable Business Objectives",
      description:
        "Creativity without purpose is merely art. Our campaigns and digital systems are engineered to achieve defined commercial milestones and sustained growth.",
    },
  ];

  return (
    <section className="border-t border-[#D8A7AD]/30 bg-[#F7F0E6] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        {/* Editorial Eyebrow */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#641C32]">
            Our Foundation
          </span>
        </div>

        {/* Major Statement */}
        <div className="mt-4 grid gap-8 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-7">
            <h2 className="font-[family-name:var(--font-editorial-serif)] text-3xl font-normal leading-tight text-[#3E1022] sm:text-5xl lg:text-5xl">
              Strategy First.{" "}
              <span className="italic font-serif text-[#641C32]">
                Creativity Always.
              </span>
            </h2>
          </div>

          <div className="lg:col-span-5">
            <p className="text-base font-normal leading-relaxed text-[#292326]/85 sm:text-lg">
              We connect business goals, audience understanding, brand
              positioning, and creative execution into one coherent momentum. No
              silos, no guesswork—only intentional creative work that moves the
              needle.
            </p>
          </div>
        </div>

        {/* Editorial 4 Value Pillars — Typographic Composition */}
        <div className="mt-16 sm:mt-24 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar) => (
            <div
              key={pillar.number}
              className="group border-t border-[#D8A7AD]/40 pt-6 transition duration-300 hover:border-[#641C32]"
            >
              <span className="font-[family-name:var(--font-editorial-serif)] text-sm font-semibold text-[#641C32]">
                {pillar.number}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-[#3E1022] transition group-hover:text-[#641C32]">
                {pillar.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#292326]/75">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
