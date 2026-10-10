"use client";

import React from "react";

export function Principles() {
  const commitments = [
    {
      title: "Radical Transparency",
      description:
        "Clear communication, transparent timelines, and honest counsel. We tell you what your brand actually needs to hear, not just what is easy to agree with.",
    },
    {
      title: "Senior-Level Involvement",
      description:
        "Every project is led and executed by experienced strategists and designers. Your brand is never handed off to unguided junior staff.",
    },
    {
      title: "Focus Over Volume",
      description:
        "We intentionally limit the number of active clients we take on concurrently, ensuring deep focus, obsessive craft, and rapid iteration cycles.",
    },
    {
      title: "Commercially Grounded",
      description:
        "We treat your investment as our own. Creative decisions are evaluated against commercial outcomes: audience resonance, brand equity, and qualified demand.",
    },
  ];

  return (
    <section className="bg-[#FFFDF9] py-24 sm:py-32 border-t border-[#D8A7AD]/30">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#641C32]">
            Collaboration Ethos
          </span>
          <h2 className="mt-3 font-[family-name:var(--font-editorial-serif)] text-3xl font-normal leading-tight text-[#3E1022] sm:text-5xl">
            Built on Trust.{" "}
            <span className="italic font-serif text-[#641C32]">
              Driven by Rigor.
            </span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#292326]/80 sm:text-lg">
            How we work is just as important as what we create. These four commitments
            guide every client engagement from initial kickoff to long-term advisory.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {commitments.map((item, idx) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[#D8A7AD]/40 bg-[#F7F0E6]/50 p-8 transition duration-300 hover:border-[#641C32] hover:bg-[#F7F0E6]"
            >
              <span className="text-xs font-semibold text-[#641C32] uppercase tracking-wider">
                Principle 0{idx + 1}
              </span>
              <h3 className="mt-4 font-[family-name:var(--font-editorial-serif)] text-xl text-[#3E1022]">
                {item.title}
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-[#292326]/75">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
