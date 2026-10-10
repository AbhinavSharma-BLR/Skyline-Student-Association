"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useAuth } from "@/context/auth-context";

/**
 * SignupPage Component
 * 
 * Styled with the Black, White, and Deep Cobalt Blue visual identity.
 * Allows new students to register for Skyline Student Association.
 */
export default function SignupPage() {
  const { signupNewStudent } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name || !email || !studentId || !password) {
      setMessage("Please fill in all required fields.");
      return;
    }

    const newStudent = signupNewStudent(name, email, studentId);
    setMessage(
      `Account successfully registered for ${newStudent.name}! Redirecting to Student Workspace (/me) to activate your membership pass...`
    );

    setTimeout(() => {
      router.push("/me");
    }, 700);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-6 py-12 selection:bg-[#E8F0FF] selection:text-[#0047AB]">
      <section className="w-full max-w-lg rounded-2xl bg-white border border-[#E5E7EB] p-8 shadow-xl sm:p-12 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="w-8 h-8 rounded-lg bg-[#0047AB] text-white flex items-center justify-center font-bold text-base transition group-hover:scale-105">
                S
              </span>
              <span className="text-2xl font-bold tracking-tight text-[#0A0A0A]">
                Skyline<span className="text-[#0047AB]">.</span>
              </span>
            </Link>
            <Link
              href="/"
              className="text-xs font-semibold text-[#64748B] hover:text-[#0A0A0A]"
            >
              ← Back to Home
            </Link>
          </div>

          <div className="mt-8">
            <span className="text-xs font-bold uppercase tracking-widest text-[#0047AB]">
              Join Our Community
            </span>
            <h1 className="mt-2 text-3xl font-extrabold text-[#0A0A0A]">
              Create your student profile
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#64748B] leading-relaxed">
              Register with your campus credentials to claim subsidized event tickets, track orders, and activate your annual membership.
            </p>
          </div>

          <form onSubmit={handleSignup} className="mt-7 space-y-4">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#0A0A0A]">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Adithya Sharma"
                autoComplete="name"
                required
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] px-4 py-3 text-sm outline-none transition focus:border-[#0047AB] focus:ring-2 focus:ring-[#E8F0FF]"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#0A0A0A]">
                College Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@campus.skyline.edu"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] px-4 py-3 text-sm outline-none transition focus:border-[#0047AB] focus:ring-2 focus:ring-[#E8F0FF]"
              />
            </div>

            <div>
              <label
                htmlFor="studentId"
                className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#0A0A0A]"
              >
                Student ID / Roll Number
              </label>
              <input
                id="studentId"
                name="studentId"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. SK-2026-7890"
                required
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] px-4 py-3 text-sm outline-none transition focus:border-[#0047AB] focus:ring-2 focus:ring-[#E8F0FF]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#0A0A0A]"
              >
                Create Password
              </label>

              <div className="flex rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] focus-within:border-[#0047AB] focus-within:ring-2 focus-within:ring-[#E8F0FF]">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  minLength={8}
                  autoComplete="new-password"
                  required
                  className="min-w-0 flex-1 rounded-xl px-4 py-3 text-sm outline-none bg-transparent text-[#0A0A0A]"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="px-4 text-xs font-semibold text-[#64748B] hover:text-[#0A0A0A]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-3 text-xs text-[#64748B] cursor-pointer pt-1">
              <input
                type="checkbox"
                name="terms"
                required
                className="mt-0.5 h-4 w-4 rounded border-[#E5E7EB] text-[#0047AB] accent-[#0047AB]"
              />
              <span>
                I agree to the Skyline Student Association charter and community conduct guidelines.
              </span>
            </label>

            <button
              type="submit"
              className="w-full rounded-xl bg-[#0047AB] px-5 py-3.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#003785] active:scale-[0.99]"
            >
              Create Account &amp; Join
            </button>

            {message && (
              <p
                role="status"
                className="rounded-xl bg-emerald-50 p-3.5 text-xs text-emerald-800 border border-emerald-200"
              >
                {message}
              </p>
            )}
          </form>

          <p className="mt-6 text-center text-xs text-[#64748B]">
            Already registered?{" "}
            <Link href="/login" className="font-bold text-[#0047AB] hover:underline">
              Sign in to your account
            </Link>
          </p>

          <p className="mt-6 text-center text-[11px] text-[#64748B]">
            Skyline Student Association · Self-service Member Registration
          </p>
        </div>
      </section>
    </main>
  );
}
