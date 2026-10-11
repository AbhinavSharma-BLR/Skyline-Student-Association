"use client";

import React from "react";

export function Process() {
  const steps = [
    {
      number: "01",
      title: "Discover",
      summary:
        "Understand the brand, audience, business goals, and challenges.",
      details:
        "We immerse ourselves in your landscape through structured stakeholder interviews, competitive audit, and audience inquiry to uncover the underlying friction and growth opportunities.",
    },
    {
      number: "02",
      title: "Strategize",
      summary:
        "Define positioning, messaging, creative direction, and priorities.",
      details:
        "We synthesize our findings into an actionable strategic roadmap. This defines your core brand narrative, target personas, creative north star, and tactical channel roadmap.",
    },
    {
      number: "03",
      title: "Create",
      summary:
        "Develop the visual identity, content, campaigns, or digital experience.",
      details:
        "Where strategic logic meets refined intuition. We design the visual assets, write compelling editorial copy, craft digital interfaces, and orchestrate campaign rollouts.",
    },
    {
      number: "04",
      title: "Optimize",
      summary:
        "Evaluate performance and refine the work against agreed objectives.",
      details:
        "We analyze launch reception, evaluate qualitative and quantitative resonance against agreed commercial benchmarks, and iteratively fine-tune for compounding brand momentum.",
    },
  ];

  return (
    <section id="process" className="bg-[#FFFDF9] py-24 sm:py-32 border-t border-[#D8A7AD]/30">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#641C32]">
            Methodology
          </span>
          <h2 className="mt-3 font-[family-name:var(--font-editorial-serif)] text-3xl font-normal leading-tight text-[#3E1022] sm:text-5xl">
            From First Conversation to{" "}
            <span className="italic font-serif text-[#641C32]">
              Lasting Impact.
            </span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#292326]/80 sm:text-lg">
            A disciplined, four-phase engagement model that eliminates ambiguity
            and ensures every creative asset delivers commercial value.
          </p>
        </div>

        {/* Process Numbered Timeline Grid */}
        <div className="mt-16 sm:mt-24 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, idx) => (
            <div
              key={step.number}
              className="relative flex flex-col justify-between border-t border-[#D8A7AD]/50 pt-8 transition-colors duration-300 hover:border-[#641C32]"
            >
              <div>
                <span className="font-[family-name:var(--font-editorial-serif)] text-3xl sm:text-4xl font-light text-[#641C32]/80">
                  {step.number}
                </span>

                <h3 className="mt-6 font-[family-name:var(--font-editorial-serif)] text-2xl font-normal text-[#3E1022]">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm font-medium text-[#641C32]">
                  {step.summary}
                </p>

                <p className="mt-3 text-xs leading-relaxed text-[#292326]/70">
                  {step.details}
                </p>
              </div>

              <div className="mt-8 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#D8A7AD]">
                <span>Phase {idx + 1}</span>
                <span className="h-px flex-1 bg-[#D8A7AD]/30"></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
