"use client";

import React, { useState } from "react";

interface Project {
  id: string;
  title: string;
  client: string;
  industry: string;
  services: string[];
  summary: string;
  accentBg: string;
  isFeatured?: boolean;
}

const PROJECTS: Project[] = [
  {
    id: "proj-1",
    title: "Maison Vélure — The Sensory Rebrand",
    client: "Maison Vélure (Concept Showcase)",
    industry: "Luxury Hospitality & Lifestyle",
    services: ["Brand Strategy", "Visual Identity", "Digital Experience"],
    summary:
      "Repositioning a heritage boutique hotel group for modern international travelers through an editorial typographic system, tactile print guidelines, and a frictionless direct booking portal.",
    accentBg: "from-[#641C32] via-[#3E1022] to-[#292326]",
    isFeatured: true,
  },
  {
    id: "proj-2",
    title: "Kinfolk Botanic — Digital Launch Architecture",
    client: "Kinfolk Botanic (Sample Case Study)",
    industry: "Sustainable Skincare & Beauty",
    services: ["Packaging Direction", "Social Media Narrative", "E-Commerce Experience"],
    summary:
      "Crafting an organic, warmth-infused digital flagship that articulates ethical ingredient sourcing while driving high-intent conversion through clean, educational product detail journeys.",
    accentBg: "from-[#D8A7AD] via-[#EAD0D1] to-[#F7F0E6]",
    isFeatured: false,
  },
  {
    id: "proj-3",
    title: "Aura Capital — Reimagining Modern Venture",
    client: "Aura Capital (Concept Showcase)",
    industry: "Early-Stage Venture & Tech",
    services: ["Brand Architecture", "Website Design", "Content Strategy"],
    summary:
      "Replacing conventional corporate finance clichés with bold editorial layout, dynamic typography, and founder-centric storytelling that establishes authority and distinct vision.",
    accentBg: "from-[#3E1022] via-[#641C32] to-[#D8A7AD]",
    isFeatured: false,
  },
  {
    id: "proj-4",
    title: "Solstice Studio — Architectural Monograph",
    client: "Solstice Studio (Sample Case Study)",
    industry: "Architecture & Spatial Design",
    services: ["Editorial Publication", "Digital Portfolio", "Creative Direction"],
    summary:
      "A minimalist digital monograph letting monumental spatial photography take center stage, paired with subtle micro-interactions that mirror the studio's architectural precision.",
    accentBg: "from-[#F7F0E6] via-[#EAD0D1] to-[#D8A7AD]",
    isFeatured: true,
  },
];

export function Portfolio() {
  const [filter, setFilter] = useState<string>("All");

  const categories = ["All", "Brand Strategy", "Visual Identity", "Digital Experience"];

  const filteredProjects =
    filter === "All"
      ? PROJECTS
      : PROJECTS.filter((p) => p.services.includes(filter));

  return (
    <section id="work" className="bg-[#F7F0E6] py-24 sm:py-32 border-t border-[#D8A7AD]/30">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        {/* Editorial Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-[#D8A7AD]/40">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#641C32]">
              Selected Portfolio
            </span>
            <h2 className="mt-3 font-[family-name:var(--font-editorial-serif)] text-3xl font-normal leading-tight text-[#3E1022] sm:text-5xl">
              Work That Speaks{" "}
              <span className="italic font-serif text-[#641C32]">
                for Itself.
              </span>
            </h2>
            <p className="mt-2 text-xs text-[#292326]/60 tracking-wider uppercase">
              Demonstration Concepts &amp; Curated Studio Case Studies
            </p>
          </div>

          {/* Minimalist Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium tracking-wide transition ${
                  filter === cat
                    ? "bg-[#641C32] text-[#F7F0E6]"
                    : "bg-[#FFFDF9] text-[#292326]/75 hover:bg-[#EAD0D1]/60 border border-[#D8A7AD]/30"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Varied Editorial Grid Composition (Intentional Asymmetry) */}
        <div className="mt-16 grid gap-12 sm:gap-16 lg:grid-cols-12">
          {filteredProjects.map((project, idx) => {
            // Asymmetric col spans for editorial variety
            const isWide = idx % 3 === 0;
            const colSpan = isWide ? "lg:col-span-8" : "lg:col-span-4";

            return (
              <article
                key={project.id}
                className={`${colSpan} group flex flex-col justify-between`}
              >
                {/* Visual Editorial Canvas Placeholder */}
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-[#D8A7AD]/40 bg-gradient-to-br shadow-xs transition duration-500 group-hover:shadow-lg group-hover:border-[#641C32]/40">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${project.accentBg} opacity-90 transition-transform duration-700 group-hover:scale-105 flex flex-col justify-between p-8`}
                  >
                    {/* Top Tagging */}
                    <div className="flex items-center justify-between text-xs font-medium tracking-wider text-white/90">
                      <span className="uppercase tracking-widest">{project.industry}</span>
                      <span className="rounded-full bg-white/20 backdrop-blur-xs px-2.5 py-0.5 text-[10px]">
                        Concept Showcase
                      </span>
                    </div>

                    {/* Center Art Graphic / Minimal Monogram */}
                    <div className="my-auto text-center">
                      <p className="font-[family-name:var(--font-editorial-serif)] text-3xl sm:text-4xl text-white/95 font-light tracking-wide italic">
                        {project.title.split("—")[0]}
                      </p>
                    </div>

                    {/* Bottom Tags */}
                    <div className="flex flex-wrap gap-2">
                      {project.services.map((s) => (
                        <span
                          key={s}
                          className="text-[10px] uppercase tracking-wider text-white/80 bg-black/20 px-2 py-0.5 rounded"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Editorial Metadata Block */}
                <div className="mt-6 flex flex-col justify-between flex-1">
                  <div>
                    <span className="text-xs font-semibold text-[#641C32] uppercase tracking-wider">
                      {project.client}
                    </span>
                    <h3 className="mt-1 font-[family-name:var(--font-editorial-serif)] text-2xl font-normal text-[#3E1022] transition group-hover:text-[#641C32]">
                      {project.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#292326]/75">
                      {project.summary}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#D8A7AD]/30 flex items-center justify-between">
                    <span className="text-xs text-[#292326]/60">Services: {project.services.join(" · ")}</span>
                    <a
                      href="#contact"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#641C32] transition group-hover:translate-x-1"
                    >
                      <span>Inquire Case Study</span>
                      <span>→</span>
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Portfolio Footer Note */}
        <div className="mt-16 text-center">
          <p className="text-xs text-[#292326]/70 italic">
            * Selected works represent strategic creative concepts and methodologies engineered by our studio.
          </p>
        </div>
      </div>
    </section>
  );
}
