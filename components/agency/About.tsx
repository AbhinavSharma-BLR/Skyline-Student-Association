"use client";

import React from "react";

export function About() {
  return (
    <section id="about" className="bg-[#F7F0E6] py-24 sm:py-32 border-t border-[#D8A7AD]/30">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="grid gap-16 lg:grid-cols-12 lg:items-center">
          {/* Left Editorial Philosophy Text */}
          <div className="lg:col-span-7">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#641C32]">
              Our Philosophy
            </span>

            <h2 className="mt-4 font-[family-name:var(--font-editorial-serif)] text-3xl font-normal leading-tight text-[#3E1022] sm:text-5xl lg:text-5xl">
              Good Work Begins With{" "}
              <span className="italic font-serif text-[#641C32]">
                Good Questions.
              </span>
            </h2>

            <div className="mt-8 space-y-6 text-base leading-relaxed text-[#292326]/85 sm:text-lg">
              <p>
                We believe that the most compelling brands are not created by
                accident. They are the result of rigorous strategic questioning,
                uncompromising creative standards, and deep empathy for the people
                they serve.
              </p>
              <p className="text-base text-[#292326]/75">
                Our studio operates as a dedicated creative partner to ambitious
                founders, marketing leaders, and visionary brands. We reject
                churn-and-burn agency models in favor of focused, senior-led
                collaborations that prioritize substance over surface decoration.
              </p>
              <p className="text-base text-[#292326]/75">
                Whether defining a category-defining brand strategy or engineering
                an evocative digital experience, our commitment remains singular:
                to craft work that commands attention, builds durable trust, and
                drives tangible business progress.
              </p>
            </div>

            {/* Signature Studio Values Checklist */}
            <div className="mt-10 grid grid-cols-2 gap-6 border-t border-[#D8A7AD]/40 pt-8 sm:grid-cols-3">
              <div>
                <p className="font-[family-name:var(--font-editorial-serif)] text-2xl text-[#641C32]">
                  Substance
                </p>
                <p className="mt-1 text-xs text-[#292326]/70">Over superficial trends</p>
              </div>
              <div>
                <p className="font-[family-name:var(--font-editorial-serif)] text-2xl text-[#641C32]">
                  Clarity
                </p>
                <p className="mt-1 text-xs text-[#292326]/70">Over convoluted jargon</p>
              </div>
              <div>
                <p className="font-[family-name:var(--font-editorial-serif)] text-2xl text-[#641C32]">
                  Impact
                </p>
                <p className="mt-1 text-xs text-[#292326]/70">Over empty metrics</p>
              </div>
            </div>
          </div>

          {/* Right Editorial Monolith Visual Card */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#641C32] via-[#3E1022] to-[#292326] p-10 text-[#F7F0E6] shadow-xl">
              <div className="flex items-center justify-between border-b border-[#D8A7AD]/30 pb-6">
                <span className="text-xs uppercase tracking-widest text-[#D8A7AD]">
                  Studio Principles
                </span>
                <span className="font-[family-name:var(--font-editorial-serif)] text-lg italic text-[#EAD0D1]">
                  Est. Collaborative
                </span>
              </div>

              <div className="my-12 space-y-8">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#D8A7AD]">
                    01 / Direct Collaboration
                  </span>
                  <p className="mt-1 text-sm text-[#F7F0E6]/90 leading-relaxed">
                    You work directly with senior strategists and designers,
                    ensuring zero dilution between vision and execution.
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#D8A7AD]">
                    02 / Bespoke Architecture
                  </span>
                  <p className="mt-1 text-sm text-[#F7F0E6]/90 leading-relaxed">
                    No recycled templates or cookie-cutter playbooks. Every
                    strategy is formulated specifically around your commercial goals.
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#D8A7AD]">
                    03 / Enduring Relevance
                  </span>
                  <p className="mt-1 text-sm text-[#F7F0E6]/90 leading-relaxed">
                    We design identities and systems meant to flourish for years,
                    not expire with the next seasonal aesthetic cycle.
                  </p>
                </div>
              </div>

              <div className="border-t border-[#D8A7AD]/30 pt-6 flex items-center justify-between text-xs text-[#D8A7AD]">
                <span>Senior-Led Partnerships</span>
                <span>Craft &amp; Commercial Intent</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
