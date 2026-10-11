"use client";

import React, { useState } from "react";

interface FormData {
  name: string;
  email: string;
  company: string;
  service: string;
  budget: string;
  description: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  service?: string;
  description?: string;
}

export function Contact() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    company: "",
    service: "",
    budget: "",
    description: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const servicesList = [
    "Brand Strategy & Positioning",
    "Visual Identity & Creative Direction",
    "Social Media Marketing",
    "Content Strategy & Production",
    "Digital Marketing Campaigns",
    "Website Design & Digital Experiences",
    "Comprehensive Full-Scope Retainer",
  ];

  const budgetRanges = [
    "Under $10,000",
    "$10,000 – $25,000",
    "$25,000 – $50,000",
    "$50,000+",
  ];

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Please provide your full name.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Please provide your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.service) {
      newErrors.service = "Please select a service of interest.";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Please tell us a little about your project.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    // Simulate clean dispatch with client-side validation
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 800);
  };

  return (
    <section id="contact" className="bg-[#F7F0E6] py-24 sm:py-32 border-t border-[#D8A7AD]/30">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="grid gap-16 lg:grid-cols-12">
          {/* Left Contact Context */}
          <div className="lg:col-span-5">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#641C32]">
              Start an Engagement
            </span>

            <h2 className="mt-4 font-[family-name:var(--font-editorial-serif)] text-3xl font-normal leading-tight text-[#3E1022] sm:text-5xl">
              Let's Make Something{" "}
              <span className="italic font-serif text-[#641C32]">
                Meaningful.
              </span>
            </h2>

            <p className="mt-6 text-base leading-relaxed text-[#292326]/80 sm:text-lg">
              We take on a curated roster of client engagements each quarter to
              ensure undivided strategic and creative attention.
            </p>

            <div className="mt-10 space-y-6 border-t border-[#D8A7AD]/40 pt-8 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#641C32] font-semibold">
                  New Business Inquiries
                </p>
                <p className="mt-1 font-medium text-[#3E1022]">
                  hello@studionoir.agency
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-[#641C32] font-semibold">
                  Location &amp; Global Availability
                </p>
                <p className="mt-1 text-[#292326]/75">
                  Remote Studio · Collaborating Globally
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-[#641C32] font-semibold">
                  Response Window
                </p>
                <p className="mt-1 text-[#292326]/75">
                  We review qualified briefs within 2 business days.
                </p>
              </div>
            </div>
          </div>

          {/* Right Form Card */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-[#D8A7AD]/40 bg-[#FFFDF9] p-8 sm:p-12 shadow-xs">
              {isSubmitted ? (
                <div className="py-12 text-center animate-in fade-in duration-500">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAD0D1] text-[#641C32] text-2xl font-bold">
                    ✓
                  </div>
                  <h3 className="mt-6 font-[family-name:var(--font-editorial-serif)] text-2xl font-normal text-[#3E1022]">
                    Inquiry Received (Demo Mode)
                  </h3>
                  <p className="mt-3 text-sm text-[#292326]/75 max-w-md mx-auto leading-relaxed">
                    Thank you, {formData.name}. Your project brief has been captured
                    locally in our demo state.
                  </p>
                  <div className="mt-6 rounded-2xl bg-[#F7F0E6] p-4 text-xs text-[#292326]/70 max-w-md mx-auto border border-[#D8A7AD]/30">
                    <strong>Technical Note:</strong> Form validation succeeded. To connect
                    real submissions, configure an email provider endpoint (e.g., Resend,
                    SendGrid, or Next.js Route Handler).
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormData({
                        name: "",
                        email: "",
                        company: "",
                        service: "",
                        budget: "",
                        description: "",
                      });
                    }}
                    className="mt-8 inline-flex items-center justify-center rounded-full bg-[#641C32] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#F7F0E6] transition hover:bg-[#3E1022]"
                  >
                    Send Another Note
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                  {/* Name & Email */}
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="contact-name"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#3E1022]"
                      >
                        Your Name <span className="text-[#641C32]">*</span>
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          if (errors.name) setErrors({ ...errors, name: undefined });
                        }}
                        placeholder="e.g. Julian Vance"
                        className={`mt-2 w-full rounded-xl border bg-[#F7F0E6]/30 px-4 py-3 text-sm text-[#292326] outline-none transition focus:border-[#641C32] focus:ring-2 focus:ring-[#D8A7AD]/40 ${
                          errors.name ? "border-rose-400 bg-rose-50/30" : "border-[#D8A7AD]/50"
                        }`}
                      />
                      {errors.name && (
                        <p className="mt-1.5 text-xs text-rose-600 font-medium">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="contact-email"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#3E1022]"
                      >
                        Work Email <span className="text-[#641C32]">*</span>
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          if (errors.email) setErrors({ ...errors, email: undefined });
                        }}
                        placeholder="e.g. julian@brand.com"
                        className={`mt-2 w-full rounded-xl border bg-[#F7F0E6]/30 px-4 py-3 text-sm text-[#292326] outline-none transition focus:border-[#641C32] focus:ring-2 focus:ring-[#D8A7AD]/40 ${
                          errors.email ? "border-rose-400 bg-rose-50/30" : "border-[#D8A7AD]/50"
                        }`}
                      />
                      {errors.email && (
                        <p className="mt-1.5 text-xs text-rose-600 font-medium">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Company & Service */}
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="contact-company"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#3E1022]"
                      >
                        Company or Brand
                      </label>
                      <input
                        id="contact-company"
                        type="text"
                        value={formData.company}
                        onChange={(e) =>
                          setFormData({ ...formData, company: e.target.value })
                        }
                        placeholder="e.g. Vance &amp; Co."
                        className="mt-2 w-full rounded-xl border border-[#D8A7AD]/50 bg-[#F7F0E6]/30 px-4 py-3 text-sm text-[#292326] outline-none transition focus:border-[#641C32] focus:ring-2 focus:ring-[#D8A7AD]/40"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="contact-service"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#3E1022]"
                      >
                        Primary Service <span className="text-[#641C32]">*</span>
                      </label>
                      <select
                        id="contact-service"
                        value={formData.service}
                        onChange={(e) => {
                          setFormData({ ...formData, service: e.target.value });
                          if (errors.service) setErrors({ ...errors, service: undefined });
                        }}
                        className={`mt-2 w-full rounded-xl border bg-[#F7F0E6]/30 px-4 py-3 text-sm text-[#292326] outline-none transition focus:border-[#641C32] focus:ring-2 focus:ring-[#D8A7AD]/40 ${
                          errors.service ? "border-rose-400 bg-rose-50/30" : "border-[#D8A7AD]/50"
                        }`}
                      >
                        <option value="">Select a service...</option>
                        {servicesList.map((svc) => (
                          <option key={svc} value={svc}>
                            {svc}
                          </option>
                        ))}
                      </select>
                      {errors.service && (
                        <p className="mt-1.5 text-xs text-rose-600 font-medium">
                          {errors.service}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Project Budget (Optional) */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#3E1022] mb-2">
                      Estimated Project Investment (Optional)
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {budgetRanges.map((range) => (
                        <button
                          key={range}
                          type="button"
                          onClick={() => setFormData({ ...formData, budget: range })}
                          className={`rounded-xl border py-2.5 px-3 text-xs font-medium transition text-center ${
                            formData.budget === range
                              ? "border-[#641C32] bg-[#641C32] text-[#F7F0E6]"
                              : "border-[#D8A7AD]/40 bg-[#F7F0E6]/30 text-[#292326]/75 hover:border-[#641C32]"
                          }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      htmlFor="contact-description"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#3E1022]"
                    >
                      Project Overview <span className="text-[#641C32]">*</span>
                    </label>
                    <textarea
                      id="contact-description"
                      rows={4}
                      value={formData.description}
                      onChange={(e) => {
                        setFormData({ ...formData, description: e.target.value });
                        if (errors.description)
                          setErrors({ ...errors, description: undefined });
                      }}
                      placeholder="Tell us about your brand, key objectives, and anticipated launch timeline..."
                      className={`mt-2 w-full rounded-xl border bg-[#F7F0E6]/30 px-4 py-3 text-sm text-[#292326] outline-none transition focus:border-[#641C32] focus:ring-2 focus:ring-[#D8A7AD]/40 ${
                        errors.description ? "border-rose-400 bg-rose-50/30" : "border-[#D8A7AD]/50"
                      }`}
                    />
                    {errors.description && (
                      <p className="mt-1.5 text-xs text-rose-600 font-medium">
                        {errors.description}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full rounded-full bg-[#641C32] py-4 text-xs font-semibold uppercase tracking-wider text-[#F7F0E6] transition duration-300 hover:bg-[#3E1022] hover:shadow-lg hover:shadow-[#641C32]/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#641C32] active:scale-95 disabled:opacity-75"
                    >
                      {isSubmitting ? "Transmitting Brief..." : "Submit Project Brief →"}
                    </button>
                    <p className="mt-3 text-center text-[11px] text-[#292326]/60">
                      We protect your strategic privacy. NDA available upon request.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
