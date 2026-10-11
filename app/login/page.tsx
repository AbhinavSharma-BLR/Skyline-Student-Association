"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useAuth, DEMO_CREDENTIALS } from "@/context/auth-context";

export type WorkspaceOption = "Member" | "Treasurer" | "Club Officer";
export type PersonaId = "student_guest" | "student_member" | "officer" | "treasurer";

interface AccessPersona {
  id: PersonaId;
  name: string;
  roleTitle: string;
  workspace: WorkspaceOption;
  badge: string;
  darkBadge: string;
  lightBadge: string;
  icon: string;
  description: string;
  targetPath: "/me" | "/desk";
}

const DEMO_PERSONAS: AccessPersona[] = [
  {
    id: "student_guest",
    name: "Abhinav",
    roleTitle: "Student Guest",
    workspace: "Member",
    badge: "Guest",
    darkBadge: "bg-slate-700/80 text-slate-200 border border-slate-600",
    lightBadge: "bg-slate-100 text-slate-700 border border-slate-300",
    icon: "🎟️",
    description: "Unpaid dues, standard pricing. Student Workspace (/me)",
    targetPath: "/me",
  },
  {
    id: "student_member",
    name: "Sam",
    roleTitle: "Student Member",
    workspace: "Member",
    badge: "Active Member",
    darkBadge: "bg-emerald-900/60 text-emerald-300 border border-emerald-700/60",
    lightBadge: "bg-emerald-50 text-emerald-700 border border-emerald-300",
    icon: "⭐",
    description: "Paid annual dues (₹500), active pass. Student Workspace (/me)",
    targetPath: "/me",
  },
  {
    id: "officer",
    name: "Olivia",
    roleTitle: "Club Officer",
    workspace: "Club Officer",
    badge: "Desk Access",
    darkBadge: "bg-blue-900/60 text-blue-300 border border-blue-700/60",
    lightBadge: "bg-blue-50 text-blue-700 border border-blue-300",
    icon: "📋",
    description: "QR check-in scanner, activities & stock. Staff Desk (/desk)",
    targetPath: "/desk",
  },
  {
    id: "treasurer",
    name: "Trevor",
    roleTitle: "Treasurer",
    workspace: "Treasurer",
    badge: "Treasury",
    darkBadge: "bg-purple-900/60 text-purple-300 border border-purple-700/60",
    lightBadge: "bg-purple-50 text-purple-700 border border-purple-300",
    icon: "💰",
    description: "Claims review, cashbook ledger & audits. Staff Desk (/desk)",
    targetPath: "/desk",
  },
];

/**
 * LoginPage Component
 * 
 * Styled with Black, White, and Deep Cobalt Blue visual identity.
 * Features 1-click Quick Demo Access cards, Target Workspace dropdown,
 * and real Better Auth authentication.
 */
export default function LoginPage() {
  const { loginWithEmail, currentUser, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Target Workspace dropdown state (Defaults to "Member")
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceOption>("Member");

  // Highlighted demo persona card (temporary UI state)
  const [selectedPersonaId, setSelectedPersonaId] = useState<PersonaId | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "loading";
    message: string;
  } | null>(null);

  /**
   * Performs real Better Auth authentication and enforces server-verified RBAC navigation
   */
  const performSignIn = async (
    loginEmail: string,
    loginPassword: string,
    targetWorkspace: WorkspaceOption
  ) => {
    const authenticatedUser = await loginWithEmail(loginEmail, loginPassword);

    const userRoles = authenticatedUser.roles || [];
    const isOfficer =
      userRoles.includes("officer") || authenticatedUser.role === "officer";
    const isTreasurer =
      userRoles.includes("treasurer") || authenticatedUser.role === "treasurer";

    // Enforce server-verified permissions based on requested workspace
    if (targetWorkspace === "Club Officer") {
      if (!isOfficer) {
        setFeedback({
          type: "error",
          message: `Access Denied: Your account (${authenticatedUser.name} · ${authenticatedUser.email}) does not have server-verified Club Officer permissions. Please select the Member workspace.`,
        });
        setLoading(false);
        return;
      }
      setFeedback({
        type: "success",
        message: `Authenticated as ${authenticatedUser.name}! Opening Officer Desk (/desk)...`,
      });
      setTimeout(() => {
        window.location.href = "/desk";
      }, 300);
      return;
    }

    if (targetWorkspace === "Treasurer") {
      if (!isTreasurer) {
        setFeedback({
          type: "error",
          message: `Access Denied: Your account (${authenticatedUser.name} · ${authenticatedUser.email}) does not have server-verified Treasurer permissions. Please select the Member workspace.`,
        });
        setLoading(false);
        return;
      }
      setFeedback({
        type: "success",
        message: `Authenticated as ${authenticatedUser.name}! Opening Treasurer Portal (/desk)...`,
      });
      setTimeout(() => {
        window.location.href = "/desk";
      }, 300);
      return;
    }

    // Existing staff users signing in reach their correct authorized dashboard
    if (isTreasurer) {
      setFeedback({
        type: "success",
        message: `Authenticated as ${authenticatedUser.name}! Opening Treasurer Portal (/desk)...`,
      });
      setTimeout(() => {
        window.location.href = "/desk";
      }, 300);
      return;
    }

    if (isOfficer) {
      setFeedback({
        type: "success",
        message: `Authenticated as ${authenticatedUser.name}! Opening Officer Desk (/desk)...`,
      });
      setTimeout(() => {
        window.location.href = "/desk";
      }, 300);
      return;
    }

    // Target Workspace: "Member" -> /me
    const memberStatusText = authenticatedUser.isMember
      ? "Active Member Pass"
      : "Guest (Dues Pending)";
    setFeedback({
      type: "success",
      message: `Authenticated as ${authenticatedUser.name} (${memberStatusText})! Opening Student Workspace (/me)...`,
    });
    setTimeout(() => {
      window.location.href = "/me";
    }, 300);
  };

  /**
   * One-click automatic demo sign-in handler
   */
  const handleQuickDemoClick = async (persona: AccessPersona) => {
    if (loading) return; // Prevent duplicate submissions

    setLoading(true);
    setSelectedPersonaId(persona.id);
    setSelectedWorkspace(persona.workspace);
    setFeedback({
      type: "loading",
      message: `Signing in as ${persona.name}…`,
    });

    try {
      // 1. Instantly resolve credentials locally without roundtrip lag
      let demoEmail = DEMO_CREDENTIALS[persona.id]?.email;
      let demoPassword = DEMO_CREDENTIALS[persona.id]?.password;

      if (!demoEmail || !demoPassword) {
        const credsRes = await fetch("/api/v1/auth/demo-credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personaId: persona.id }),
        });

        if (!credsRes.ok) {
          const errJson = await credsRes.json().catch(() => null);
          throw new Error(
            errJson?.error?.message ||
              "Quick Demo Access is restricted to configured local demo environments."
          );
        }

        const credsJson = await credsRes.json();
        demoEmail = credsJson.data.email;
        demoPassword = credsJson.data.password;
      }

      // 2. Fill the email and masked password fields
      setEmail(demoEmail);
      setPassword(demoPassword);

      // 3. Immediately initiate real Better Auth sign-in using returned credentials directly
      await performSignIn(demoEmail, demoPassword, persona.workspace);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to sign in to demo account",
      });
      setLoading(false);
    }
  };

  /**
   * Manual login handler (preserves normal email/password authentication)
   */
  const handleManualLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    if (!email || !password) {
      setFeedback({
        type: "error",
        message: "Please enter both your college email and password.",
      });
      return;
    }

    setLoading(true);
    setFeedback({
      type: "loading",
      message: "Authenticating with Skyline ERP…",
    });

    try {
      await performSignIn(email, password, selectedWorkspace);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Invalid email or password",
      });
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-4 py-12 sm:px-6 selection:bg-[#E8F0FF] selection:text-[#0047AB]">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white border border-[#E5E7EB] shadow-xl md:grid-cols-2">
        {/* Brand Information Panel (Desktop) */}
        <section className="hidden flex-col justify-between bg-[#0A0A0A] p-10 text-white md:flex relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#0047AB] blur-3xl opacity-30 pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#0047AB] text-white flex items-center justify-center font-bold text-base">
                S
              </span>
              <span className="text-2xl font-bold tracking-tight text-white">
                Skyline<span className="text-[#0047AB]">.</span>
              </span>
            </div>

            <div className="mt-8">
              <span className="inline-flex rounded-full bg-[#E8F0FF] px-3.5 py-1 text-[11px] font-bold tracking-wider uppercase text-[#0047AB]">
                Member &amp; Staff Access
              </span>
              <h1 className="mt-4 text-2xl lg:text-3xl font-extrabold leading-tight text-white">
                One platform for your entire campus journey.
              </h1>
              <p className="mt-3 leading-relaxed text-[#64748B] text-xs">
                Access your digital membership pass, book event tickets with member subsidies, track merchandise orders, and inspect transparent student finance records.
              </p>
            </div>
          </div>

          {/* Quick Demo Access Section (Desktop) */}
          <div className="relative z-10 mt-6 rounded-2xl bg-white/5 p-5 border border-white/10 backdrop-blur-sm">
            <div className="mb-3.5">
              <h2 className="text-sm font-bold text-white tracking-tight">
                Quick Demo Access
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                One click to explore a demo account.
              </p>
            </div>

            {/* 2x2 Grid Desktop */}
            <div className="grid grid-cols-2 gap-2.5">
              {DEMO_PERSONAS.map((p) => {
                const isSelected = selectedPersonaId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickDemoClick(p)}
                    className={`flex flex-col rounded-xl p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-[#0047AB] disabled:opacity-60 disabled:cursor-not-allowed ${
                      isSelected
                        ? "bg-[#0047AB]/25 border-2 border-[#0047AB] ring-1 ring-[#0047AB]/50 shadow-md"
                        : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
                    }`}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-base">{p.icon}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          isSelected ? "bg-[#0047AB] text-white" : p.darkBadge
                        }`}
                      >
                        {isSelected ? "Active" : p.badge}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-white tracking-tight">
                      {p.name}
                    </span>
                    <span className="text-[11px] text-[#E8F0FF]/80 font-medium leading-tight">
                      {p.roleTitle}
                    </span>
                    <span className="text-[10px] text-[#64748B] mt-1 leading-tight line-clamp-2">
                      {p.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Member Sign-in Form Panel */}
        <section className="p-8 sm:p-12 flex flex-col justify-between bg-white">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:hidden">
                <span className="w-7 h-7 rounded-lg bg-[#0047AB] text-white flex items-center justify-center font-bold text-sm">
                  S
                </span>
                <span className="text-xl font-bold text-[#0A0A0A]">
                  Skyline<span className="text-[#0047AB]">.</span>
                </span>
              </div>
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

            {/* Quick Demo Access Section (Mobile) */}
            <div className="md:hidden mt-6 rounded-2xl bg-[#F7F8FA] p-4 border border-[#E5E7EB]">
              <div className="mb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0047AB]">
                  Quick Demo Access
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  One click to explore a demo account.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {DEMO_PERSONAS.map((p) => {
                  const isSelected = selectedPersonaId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={loading}
                      onClick={() => handleQuickDemoClick(p)}
                      className={`flex flex-col rounded-xl p-2.5 text-left transition focus:outline-none focus:ring-2 focus:ring-[#0047AB] disabled:opacity-60 disabled:cursor-not-allowed ${
                        isSelected
                          ? "bg-[#E8F0FF] border-2 border-[#0047AB] ring-1 ring-[#0047AB]/30 shadow-xs"
                          : "bg-white border border-[#E5E7EB] hover:bg-slate-50"
                      }`}
                      aria-pressed={isSelected}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-sm">{p.icon}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            isSelected ? "bg-[#0047AB] text-white" : p.lightBadge
                          }`}
                        >
                          {isSelected ? "Active" : p.badge}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[#0A0A0A]">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-[#64748B]">
                        {p.roleTitle}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status Feedback Banner */}
            {feedback && (
              <div
                role="status"
                className={`mt-4 rounded-xl p-3.5 text-xs font-medium flex items-center gap-2 ${
                  feedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : feedback.type === "loading"
                    ? "bg-[#E8F0FF] text-[#0047AB] border border-[#0047AB]/30"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {feedback.type === "loading" && (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#0047AB] border-t-transparent flex-shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Sign-in Form */}
            <form onSubmit={handleManualLogin} className="mt-5 space-y-4">
              {/* Selected Workspace Dropdown */}
              <div>
                <label
                  htmlFor="workspace-select"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#0A0A0A]"
                >
                  Selected Workspace
                </label>
                <div className="relative">
                  <select
                    id="workspace-select"
                    value={selectedWorkspace}
                    onChange={(e) =>
                      setSelectedWorkspace(e.target.value as WorkspaceOption)
                    }
                    disabled={loading}
                    className="w-full appearance-none rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] px-4 py-3 text-sm font-semibold text-[#0A0A0A] outline-none transition focus:border-[#0047AB] focus:ring-2 focus:ring-[#E8F0FF] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed pr-10"
                  >
                    <option value="Member">Member</option>
                    <option value="Treasurer">Treasurer</option>
                    <option value="Club Officer">Club Officer</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-xs text-[#64748B]">
                    ▼
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-[#64748B]">
                  Destination:{" "}
                  {selectedWorkspace === "Member"
                    ? "/me (Student Workspace)"
                    : "/desk (Staff Desk)"}
                </p>
              </div>

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
                  placeholder="e.g. student@skyline.edu"
                  autoComplete="email"
                  required
                  disabled={loading}
                  className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] px-4 py-3 text-[#0A0A0A] outline-none transition focus:border-[#0047AB] focus:ring-2 focus:ring-[#E8F0FF] text-sm disabled:opacity-60"
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
                    onClick={() =>
                      alert(
                        "Demo passwords for local testing are documented in README.md (e.g. StudentPassword123!, OfficerPassword123!, TreasurerPassword123!). In production, password resets require campus administrator authorization."
                      )
                    }
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
                    disabled={loading}
                    className="min-w-0 flex-1 rounded-xl px-4 py-3 text-[#0A0A0A] outline-none text-sm bg-transparent disabled:opacity-60"
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
                disabled={loading}
                className="w-full rounded-xl bg-[#0047AB] py-3.5 px-5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#003785] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Sign in to Skyline"}
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-[#64748B]">
              New to Skyline Student Association?{" "}
              <Link
                href="/signup"
                className="font-bold text-[#0047AB] hover:underline"
              >
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
