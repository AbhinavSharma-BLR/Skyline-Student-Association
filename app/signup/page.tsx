"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useAuth } from "@/context/auth-context";

export type AccountType = "Guest Member" | "Member" | "Treasurer" | "Club Officer";

/**
 * SignupPage Component
 * 
 * Styled with the Black, White, and Deep Cobalt Blue visual identity.
 * Allows new users to register with their selected account type:
 * - Member: Student access with membership benefits after dues activation.
 * - Treasurer: Finance, cashbook, and reimbursement management.
 * - Guest Member: Student access before membership activation (Default).
 * - Club Officer: Club events, ticket check-in, inventory, and volunteer operations.
 */
export default function SignupPage() {
  const { signupNewStudent, loginWithEmail, currentUser, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect already authenticated users straight to their dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && currentUser) {
      const targetDashboard =
        currentUser.role === "officer" || currentUser.role === "treasurer"
          ? "/desk"
          : "/me";
      router.replace(targetDashboard);
    }
  }, [isLoading, isAuthenticated, currentUser, router]);

  // Form input states
  const [accountType, setAccountType] = useState<AccountType>("Guest Member");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return; // Prevent duplicate submissions

    setErrorMessage(null);
    setMessage(null);

    // Basic client-side validation
    if (!name.trim() || !email.trim() || !studentId.trim() || !password) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    try {
      setIsSubmitting(true);

      // -----------------------------------------------------------------------
      // CASE 1: Guest Member
      // Normal Better Auth creation -> real session -> /me (guest workspace)
      // -----------------------------------------------------------------------
      if (accountType === "Guest Member") {
        const profile = await signupNewStudent(name, email, studentId, password);
        setMessage(
          `Profile registered for ${profile.name || name}! Redirecting to Student Workspace (/me)...`
        );
        setTimeout(() => {
          router.push("/me");
        }, 700);
        return;
      }

      // -----------------------------------------------------------------------
      // CASE 2: Member
      // Normal Better Auth creation -> real session -> /me with activation section
      // Does not grant paid membership merely because "Member" was selected.
      // -----------------------------------------------------------------------
      if (accountType === "Member") {
        const profile = await signupNewStudent(name, email, studentId, password);
        setMessage(
          `Profile registered for ${profile.name || name}! Redirecting to Student Workspace to activate your annual membership...`
        );
        setTimeout(() => {
          router.push("/me?intent=member#annual-dues-card");
        }, 700);
        return;
      }

      // -----------------------------------------------------------------------
      // CASE 3 & 4: Treasurer / Club Officer
      // Server-authorized administrative creation with role verification
      // -----------------------------------------------------------------------
      const requestedRole = accountType === "Treasurer" ? "treasurer" : "officer";

      const adminRes = await fetch("/api/v1/auth/admin-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          requestedRole,
        }),
      });

      const adminJson = await adminRes.json().catch(() => ({}));
      if (!adminRes.ok) {
        throw new Error(
          adminJson?.error?.message ||
            "Failed to create administrative account. Please try again."
        );
      }

      // Establish real session through Better Auth
      try {
        const authenticatedProfile = await loginWithEmail(email, password);

        // Verify server-confirmed permissions from /api/v1/me
        const hasOfficer =
          authenticatedProfile.roles.includes("officer") ||
          authenticatedProfile.role === "officer";
        const hasTreasurer =
          authenticatedProfile.roles.includes("treasurer") ||
          authenticatedProfile.role === "treasurer";

        if (requestedRole === "officer" && !hasOfficer) {
          throw new Error("Server could not verify the Club Officer role grant.");
        }
        if (requestedRole === "treasurer" && !hasTreasurer) {
          throw new Error("Server could not verify the Treasurer role grant.");
        }

        setMessage(
          `Account created and authorized as ${accountType}! Opening Staff Desk (/desk)...`
        );
        setTimeout(() => {
          router.push("/desk");
        }, 700);
      } catch (authError: any) {
        // If account was created but automatic session sign-in failed,
        // truthfully show sign-in prompt without recreating the user
        setMessage(
          `Account registered with ${accountType} authorization! Automatic sign-in could not be completed. Please sign in with your credentials on the login page.`
        );
        setTimeout(() => {
          router.push("/login");
        }, 2500);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create account. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
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
              Create New Account
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#64748B] leading-relaxed">
              Register for the Skyline Student Association platform to access student activities, merchandise, and operations.
            </p>
          </div>

          <form onSubmit={handleSignup} className="mt-7 space-y-4">
            {/* Account Type Selector */}
            <div>
              <label
                htmlFor="accountType"
                className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#0A0A0A]"
              >
                Account Type
              </label>
              <div className="relative">
                <select
                  id="accountType"
                  name="accountType"
                  value={accountType}
                  onChange={(e) => {
                    setAccountType(e.target.value as AccountType);
                    setErrorMessage(null);
                  }}
                  className="w-full appearance-none rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] px-4 py-3 text-sm font-semibold text-[#0A0A0A] outline-none transition focus:border-[#0047AB] focus:ring-2 focus:ring-[#E8F0FF]"
                >
                  <option value="Guest Member">Guest Member</option>
                  <option value="Member">Member</option>
                  <option value="Treasurer">Treasurer</option>
                  <option value="Club Officer">Club Officer</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-xs text-[#64748B]">
                  ▼
                </div>
              </div>

              {/* Dynamic short explanation per account type */}
              <div className="mt-2 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] p-3 text-xs text-[#64748B] leading-relaxed">
                {accountType === "Guest Member" && (
                  <p>
                    <strong className="text-[#0A0A0A]">Guest Member:</strong> Student access before membership activation.
                  </p>
                )}
                {accountType === "Member" && (
                  <p>
                    <strong className="text-[#0A0A0A]">Member:</strong> Student access with membership benefits after dues activation.
                  </p>
                )}
                {accountType === "Treasurer" && (
                  <p>
                    <strong className="text-[#0A0A0A]">Treasurer:</strong> Finance, cashbook, and reimbursement management.
                  </p>
                )}
                {accountType === "Club Officer" && (
                  <p>
                    <strong className="text-[#0A0A0A]">Club Officer:</strong> Club events, ticket check-in, inventory, and volunteer operations.
                  </p>
                )}
              </div>
            </div>

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
              disabled={isSubmitting}
              className="w-full rounded-xl bg-[#0047AB] px-5 py-3.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#003785] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account & Join"
              )}
            </button>

            {errorMessage && (
              <p
                role="alert"
                className="rounded-xl bg-rose-50 p-3.5 text-xs text-rose-800 border border-rose-200"
              >
                {errorMessage}
              </p>
            )}

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
            Skyline Student Association · Campus Account Registration
          </p>
        </div>
      </section>
    </main>
  );
}
