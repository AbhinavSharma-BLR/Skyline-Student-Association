"use client";

import React, { useState } from "react";

interface ServiceItem {
  number: string;
  title: string;
  description: string;
  valueDelivered: string;
  tags: string[];
}

const SERVICES: ServiceItem[] = [
  {
    number: "01",
    title: "Brand Strategy & Positioning",
    description:
      "Clarifying your unique brand narrative, core values, competitive differentiation, and audience archetype to build an unmistakable foundation.",
    valueDelivered:
      "A defensible market position that resonates deeply with your highest-value clients.",
    tags: ["Market Research", "Brand Architecture", "Audience Personas", "Tone of Voice"],
  },
  {
    number: "02",
    title: "Visual Identity & Creative Direction",
    description:
      "Designing enduring visual systems, comprehensive typography hierarchies, bespoke color palettes, and art-directed design guidelines.",
    valueDelivered:
      "A cohesive aesthetic that builds instant brand recognition across every medium.",
    tags: ["Logo Systems", "Typography", "Art Direction", "Brand Guidelines"],
  },
  {
    number: "03",
    title: "Social Media Marketing",
    description:
      "Developing content cadences and bespoke social narratives that captivate, educate, and convert passive followers into loyal brand advocates.",
    valueDelivered:
      "Consistent organic engagement and an authentic brand presence that compounds over time.",
    tags: ["Content Playbooks", "Channel Strategy", "Visual Storytelling", "Community Growth"],
  },
  {
    number: "04",
    title: "Content Strategy & Production",
    description:
      "Crafting high-impact editorial storytelling, campaign headlines, persuasive conversion copywriting, and creative asset direction.",
    valueDelivered:
      "Clear, persuasive messaging that articulates your value proposition without industry jargon.",
    tags: ["Editorial Copy", "Campaign Messaging", "Visual Curation", "Story Arc"],
  },
  {
    number: "05",
    title: "Digital Marketing Campaigns",
    description:
      "Planning and deploying focused multi-channel digital launches that amplify your message, generate demand, and drive qualified interest.",
    valueDelivered:
      "Targeted reach and commercial momentum around product launches and key milestones.",
    tags: ["Launch Campaigns", "Omnichannel Strategy", "Creative Assets", "Audience Nurturing"],
  },
  {
    number: "06",
    title: "Website Design & Digital Experiences",
    description:
      "Engineering bespoke digital flagships with editorial typography, intuitive interaction models, and frictionless conversion pathways.",
    valueDelivered:
      "A high-performing digital home that turns curious first-time visitors into committed clients.",
    tags: ["UI/UX Architecture", "Responsive Design", "Conversion Flow", "Micro-Interactions"],
  },
];

export function Services() {
  const [activeService, setActiveService] = useState<number | null>(0);

  return (
    <section id="services" className="bg-[#FFFDF9] py-24 sm:py-32 border-t border-[#D8A7AD]/30">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#641C32]">
            What We Deliver
          </span>
          <h2 className="mt-3 font-[family-name:var(--font-editorial-serif)] text-3xl font-normal leading-tight text-[#3E1022] sm:text-5xl">
            Creative Thinking.{" "}
            <span className="italic font-serif text-[#641C32]">
              Strategic Execution.
            </span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#292326]/80 sm:text-lg">
            Every service we provide is designed to work in synergy, elevating
            your brand from every critical angle.
          </p>
        </div>

        {/* Editorial Service Accordion / Grid */}
        <div className="mt-16 divide-y divide-[#D8A7AD]/30 border-y border-[#D8A7AD]/30">
          {SERVICES.map((service, index) => {
            const isOpen = activeService === index;

            return (
              <div
                key={service.number}
                className={`group py-8 transition-colors duration-300 ${
                  isOpen ? "bg-[#F7F0E6]/50 -mx-6 px-6 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12" : "hover:bg-[#F7F0E6]/25"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveService(isOpen ? null : index)}
                  className="flex w-full items-start justify-between text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#641C32]"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-start gap-6 sm:gap-12">
                    <span className="font-[family-name:var(--font-editorial-serif)] text-lg font-medium text-[#641C32]">
                      {service.number}
                    </span>
                    <div>
                      <h3 className="font-[family-name:var(--font-editorial-serif)] text-xl font-normal text-[#3E1022] transition group-hover:text-[#641C32] sm:text-2xl md:text-3xl">
                        {service.title}
                      </h3>
                      <p className="mt-2 text-sm text-[#292326]/75 max-w-2xl">
                        {service.description}
                      </p>
                    </div>
                  </div>

                  <span
                    aria-hidden="true"
                    className={`ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#D8A7AD]/60 text-sm font-light text-[#641C32] transition-transform duration-300 ${
                      isOpen ? "rotate-45 bg-[#641C32] text-[#F7F0E6]" : "group-hover:border-[#641C32]"
                    }`}
                  >
                    +
                  </span>
                </button>

                {/* Expanded Value Delivered Block */}
                {isOpen && (
                  <div className="mt-6 pl-12 sm:pl-20 pr-4 sm:pr-12 pt-4 border-t border-[#D8A7AD]/20 animate-in fade-in duration-300">
                    <div className="grid gap-6 md:grid-cols-12 md:items-center">
                      <div className="md:col-span-8">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#641C32]">
                          Value Delivered:
                        </span>
                        <p className="mt-1 text-sm font-medium text-[#3E1022] leading-relaxed">
                          {service.valueDelivered}
                        </p>
                      </div>

                      <div className="md:col-span-4 flex flex-wrap gap-2">
                        {service.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-block rounded-full bg-[#EAD0D1]/60 px-3 py-1 text-[11px] font-medium text-[#3E1022]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Section Footer Callout */}
        <div className="mt-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6 rounded-2xl bg-[#F7F0E6] p-8 border border-[#D8A7AD]/40">
          <div>
            <h4 className="font-[family-name:var(--font-editorial-serif)] text-lg text-[#3E1022]">
              Need a bespoke combination of services?
            </h4>
            <p className="text-xs text-[#292326]/75 mt-1">
              We design custom scopes aligned specifically with your current growth phase.
            </p>
          </div>
          <a
            href="#contact"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#641C32] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#F7F0E6] transition hover:bg-[#3E1022]"
          >
            Discuss Your Needs
          </a>
        </div>
      </div>
    </section>
  );
}
