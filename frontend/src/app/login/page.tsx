"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useAuth, UserRole } from "@/context/auth-context";

/**
 * Demo accounts matching official Skyline documentation and evaluator requirements:
 * 1. Member: Adithya (student_member · /me)
 * 2. Guest: Abhinav (student_guest · /me)
 * 3. Club Officer: Anvitha (officer · /desk)
 * 4. Treasurer: Varsha (treasurer · /desk)
 */
const DEMO_ACCOUNTS = [
  {
    role: "Student Member",
    name: "Adithya",
    email: "student@demo.skyline",
    password: "Password123!",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    description: "Paid annual dues (₹200), discounted passes (₹150). Student Workspace (/me)",
    targetRole: "student_member" as UserRole,
    targetPath: "/me",
  },
  {
    role: "Student Guest",
    name: "Abhinav",
    email: "guest@demo.skyline",
    password: "Password123!",
    badge: "bg-[#E8F0FF] text-[#0047AB] border border-[#0047AB]/20",
    description: "Unpaid dues, regular pricing (₹250), 1-click upgrade. Student Workspace (/me)",
    targetRole: "student_guest" as UserRole,
    targetPath: "/me",
  },
  {
    role: "Club Officer",
    name: "Anvitha",
    email: "officer@demo.skyline",
    password: "Password123!",
    badge: "bg-blue-50 text-blue-700 border border-blue-200",
    description: "Door QR scanner, event management, merch stock. Staff Desk (/desk)",
    targetRole: "officer" as UserRole,
    targetPath: "/desk",
  },
  {
    role: "Treasurer",
    name: "Varsha",
    email: "treasurer@demo.skyline",
    password: "Password123!",
    badge: "bg-purple-50 text-purple-700 border border-purple-200",
    description: "Claims review, Invariant 9 lockdown, cashbook ledger. Staff Desk (/desk)",
    targetRole: "treasurer" as UserRole,
    targetPath: "/desk",
  },
];

/**
 * LoginPage Component
 * 
 * Styled with Black, White, and Deep Cobalt Blue visual identity.
 * Features 1-click evaluator persona access and standard credentials entry.
 */
export default function LoginPage() {
  const { loginAs, loginWithEmail } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  /**
   * One-click instant login for evaluator review
   */
  const handleInstantSignIn = (demo: typeof DEMO_ACCOUNTS[0]) => {
    loginAs(demo.targetRole);
    setFeedback({
      type: "success",
      message: `Signed in as ${demo.name} (${demo.role})! Redirecting to ${demo.targetPath}...`,
    });
    setTimeout(() => {
      router.push(demo.targetPath);
    }, 400);
  };

  /**
   * Quick-fills demo credentials for manual sign-in testing
   */
  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setFeedback({
      type: "success",
      message: `Quick-filled ${demoEmail}. Click "Sign in" below to proceed.`,
    });
  };

  /**
   * Handles form submission with RBAC redirection
   */
  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password) {
      setFeedback({
        type: "error",
        message: "Please enter both your college email and password.",
      });
      return;
    }

    const authenticatedUser = loginWithEmail(email);
    const targetPath = (authenticatedUser.role === "officer" || authenticatedUser.role === "treasurer")
      ? "/desk"
      : "/me";

    setFeedback({
      type: "success",
      message: `Signed in as ${authenticatedUser.name} (${authenticatedUser.role.replace("_", " ")})! Redirecting to ${targetPath}...`,
    });

    setTimeout(() => {
      router.push(targetPath);
    }, 450);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-4 py-12 sm:px-6 selection:bg-[#E8F0FF] selection:text-[#0047AB]">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white border border-[#E5E7EB] shadow-xl md:grid-cols-2">
        {/* Brand Information Panel (Visible on Desktop) */}
        <section className="hidden flex-col justify-between bg-[#0A0A0A] p-12 text-white md:flex relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#0047AB] blur-3xl opacity-30 pointer-events-none" />

          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <span className="w-8 h-8 rounded-lg bg-[#0047AB] text-white flex items-center justify-center font-bold text-base">
                S
              </span>
              <span className="text-2xl font-bold tracking-tight text-white">
                Skyline<span className="text-[#0047AB]">.</span>
              </span>
            </Link>

            <div className="mt-14">
              <span className="inline-flex rounded-full bg-[#E8F0FF] px-3.5 py-1 text-[11px] font-bold tracking-wider uppercase text-[#0047AB]">
                Member &amp; Staff Access
              </span>
              <h1 className="mt-5 text-3xl lg:text-4xl font-extrabold leading-tight text-white">
                One platform for your entire campus journey.
              </h1>
              <p className="mt-4 leading-relaxed text-[#64748B] text-sm">
                Access your digital membership pass, book event tickets with member subsidies, track merchandise orders, and inspect transparent student finance records.
              </p>
            </div>
          </div>

          {/* Quick Sign-in for Testers & Evaluators */}
          <div className="relative z-10 mt-8 rounded-2xl bg-white/5 p-5 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-[#E8F0FF]">
                Evaluator Quick-Access:
              </p>
              <span className="text-[10px] text-[#64748B]">1-Click Test</span>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {DEMO_ACCOUNTS.map((demo) => (
                <div
                  key={demo.email}
                  className="rounded-xl bg-white/5 p-2.5 text-left transition hover:bg-white/10 border border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-xs">{demo.name}</span>
                      <span className="ml-2 text-[11px] text-[#64748B]">({demo.role})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickFill(demo.email, demo.password)}
                        className="rounded px-2 py-0.5 text-[10px] text-white/70 hover:bg-white/10 transition"
                      >
                        Fill
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInstantSignIn(demo)}
                        className="rounded-lg bg-[#0047AB] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#003785] transition"
                      >
                        Sign In →
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-[11px] text-[#64748B] leading-tight">
                    {demo.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Member Sign-in Form Panel */}
        <section className="p-8 sm:p-12 flex flex-col justify-between bg-white">
          <div>
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 md:hidden">
                <span className="w-7 h-7 rounded-lg bg-[#0047AB] text-white flex items-center justify-center font-bold text-sm">
                  S
                </span>
                <span className="text-xl font-bold text-[#0A0A0A]">
                  Skyline<span className="text-[#0047AB]">.</span>
                </span>
              </Link>
              <Link
                href="/"
                className="text-xs font-semibold text-[#64748B] hover:text-[#0047AB] transition"
              >
                ← Back to Home
              </Link>
            </div>

            <div className="mt-8 md:mt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#0047AB]">
                Student &amp; Staff Gateway
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-[#0A0A0A]">
                Welcome back
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#64748B]">
                Sign in to manage your campus passes, dues, and officer duties.
              </p>
            </div>

            {/* Status Feedback Banner */}
            {feedback && (
              <div
                role="status"
                className={`mt-6 rounded-xl p-3.5 text-xs font-medium ${
                  feedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {feedback.message}
              </div>
            )}

            {/* Sign-in Form */}
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#0A0A0A]"
                >
                  College Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. student@demo.skyline"
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] px-4 py-3 text-[#0A0A0A] outline-none transition focus:border-[#0047AB] focus:ring-2 focus:ring-[#E8F0FF] text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => alert("Default demo password for all accounts is: Password123!")}
                    className="text-[11px] font-semibold text-[#0047AB] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="flex rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] focus-within:border-[#0047AB] focus-within:ring-2 focus-within:ring-[#E8F0FF]">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="min-w-0 flex-1 rounded-xl px-4 py-3 text-[#0A0A0A] outline-none text-sm bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="px-4 text-xs font-semibold text-[#64748B] hover:text-[#0A0A0A] transition"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="flex items-center text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-[#64748B] select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-[#E5E7EB] text-[#0047AB] focus:ring-[#0047AB] accent-[#0047AB]"
                  />
                  Remember me for 30 days
                </label>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-[#0047AB] py-3.5 px-5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#003785] active:scale-[0.99]"
              >
                Sign in to Skyline
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-[#64748B]">
              New to Skyline Student Association?{" "}
              <Link href="/signup" className="font-bold text-[#0047AB] hover:underline">
                Create an account
              </Link>
            </div>
          </div>

          <p className="mt-8 text-center text-[11px] text-[#64748B]">
            Skyline Student Association · Modern Organization Platform
          </p>
        </section>
      </div>
    </main>
  );
}
