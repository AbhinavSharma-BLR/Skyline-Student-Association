"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Work", href: "#work" },
  { label: "Services", href: "#services" },
  { label: "Process", href: "#process" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#F7F0E6]/90 backdrop-blur-md border-b border-[#D8A7AD]/30 py-3 shadow-xs"
          : "bg-transparent py-6"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
        {/* Agency Wordmark Placeholder */}
        <Link
          href="#"
          className="group flex items-center gap-2 text-xl font-medium tracking-tight text-[#3E1022]"
        >
          <span className="font-[family-name:var(--font-editorial-serif)] text-2xl font-semibold tracking-wider text-[#641C32] transition group-hover:opacity-85">
            STUDIO NOIR
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#D8A7AD]"></span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          aria-label="Main Navigation"
          className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide text-[#292326]"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="relative py-1 text-[#292326]/85 transition hover:text-[#641C32] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#641C32] after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-[#641C32] after:transition-all hover:after:w-full"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Primary CTA (Desktop) */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href="#contact"
            className="inline-flex items-center justify-center rounded-full bg-[#641C32] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#F7F0E6] transition duration-300 hover:bg-[#3E1022] hover:shadow-md hover:shadow-[#641C32]/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#641C32] active:scale-95"
          >
            Start a Project
          </a>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D8A7AD]/50 text-[#3E1022] transition hover:bg-[#EAD0D1]/40 md:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#641C32]"
        >
          {mobileMenuOpen ? (
            <span className="text-xl leading-none font-light">✕</span>
          ) : (
            <span className="text-xl leading-none">☰</span>
          )}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#D8A7AD]/30 bg-[#F7F0E6] px-6 pt-4 pb-8 shadow-xl transition-all">
          <nav className="flex flex-col space-y-4">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={closeMobileMenu}
                className="py-2 text-base font-medium text-[#292326] transition hover:text-[#641C32] border-b border-[#D8A7AD]/20"
              >
                {item.label}
              </a>
            ))}
            <div className="pt-2">
              <a
                href="#contact"
                onClick={closeMobileMenu}
                className="flex w-full items-center justify-center rounded-full bg-[#641C32] py-3 text-center text-xs font-semibold uppercase tracking-wider text-[#F7F0E6] transition hover:bg-[#3E1022]"
              >
                Start a Project
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
