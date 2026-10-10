"use client";

import React from "react";
import Link from "next/link";

export function Footer() {
  const currentYear = 2026;

  return (
    <footer className="border-t border-[#D8A7AD]/20 bg-[#3E1022] text-[#F7F0E6] pt-20 pb-12">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-start pb-16 border-b border-[#D8A7AD]/20">
          {/* Brand Column */}
          <div className="lg:col-span-5">
            <Link
              href="#"
              className="inline-block font-[family-name:var(--font-editorial-serif)] text-3xl font-normal tracking-wider text-[#F7F0E6]"
            >
              STUDIO NOIR<span className="text-[#D8A7AD]">.</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#F7F0E6]/75">
              An independent creative consultancy engineering brand positioning,
              distinctive visual identities, and evocative digital experiences
              for visionary companies.
            </p>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#D8A7AD]">
              Navigation
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-[#F7F0E6]/80">
              <li>
                <a href="#work" className="transition hover:text-[#D8A7AD]">
                  Selected Work
                </a>
              </li>
              <li>
                <a href="#services" className="transition hover:text-[#D8A7AD]">
                  Studio Capabilities
                </a>
              </li>
              <li>
                <a href="#process" className="transition hover:text-[#D8A7AD]">
                  Engagement Process
                </a>
              </li>
              <li>
                <a href="#about" className="transition hover:text-[#D8A7AD]">
                  Studio Philosophy
                </a>
              </li>
              <li>
                <a href="#contact" className="transition hover:text-[#D8A7AD]">
                  Initiate Engagement
                </a>
              </li>
            </ul>
          </div>

          {/* Social & Presence */}
          <div className="lg:col-span-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#D8A7AD]">
              Presence &amp; Dialogue
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-[#F7F0E6]/80">
              <li>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-[#D8A7AD]"
                >
                  LinkedIn ↗
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-[#D8A7AD]"
                >
                  Instagram ↗
                </a>
              </li>
              <li>
                <a
                  href="https://behance.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-[#D8A7AD]"
                >
                  Behance ↗
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@studionoir.agency"
                  className="transition hover:text-[#D8A7AD]"
                >
                  hello@studionoir.agency
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal / Copyright */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#F7F0E6]/60">
          <p>© {currentYear} STUDIO NOIR. All rights reserved.</p>
          <div className="flex gap-6">
            <span>Minimalist UI/UX Architecture</span>
            <span>Burgundy · Cream · Dusty Pink</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
