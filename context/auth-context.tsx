"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authClient } from "@/lib/auth/client";

export type UserRole = "student_member" | "student_guest" | "officer" | "treasurer";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  studentId: string;
  role: UserRole;
  roles: string[];
  isMember: boolean;
  membershipExpiresAt: string | null;
  duesPaid: boolean;
}

export interface MembershipPeriodInfo {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  duesPaise: number;
}

export const DEMO_CREDENTIALS: Record<UserRole, { email: string; password: string; name: string }> = {
  student_member: {
    email: "student@skyline.edu",
    password: "StudentPassword123!",
    name: "Sam",
  },
  student_guest: {
    email: "guest@skyline.edu",
    password: "GuestPassword123!",
    name: "Abhinav",
  },
  officer: {
    email: "officer@skyline.edu",
    password: "OfficerPassword123!",
    name: "Olivia",
  },
  treasurer: {
    email: "treasurer@skyline.edu",
    password: "TreasurerPassword123!",
    name: "Trevor",
  },
};

export const PRESET_USERS: Record<UserRole, UserProfile> = {
  student_member: {
    id: "usr_mem_001",
    name: "Sam",
    email: "student@skyline.edu",
    emailVerified: false,
    studentId: "SK-2026-8812",
    role: "student_member",
    roles: [],
    isMember: true,
    membershipExpiresAt: "2027-06-30T23:59:59.000Z",
    duesPaid: true,
  },
  student_guest: {
    id: "usr_gst_002",
    name: "Abhinav",
    email: "guest@skyline.edu",
    emailVerified: false,
    studentId: "SK-2026-4409",
    role: "student_guest",
    roles: [],
    isMember: false,
    membershipExpiresAt: null,
    duesPaid: false,
  },
  officer: {
    id: "usr_off_003",
    name: "Olivia",
    email: "officer@skyline.edu",
    emailVerified: false,
    studentId: "SK-2025-1102",
    role: "officer",
    roles: ["officer"],
    isMember: true,
    membershipExpiresAt: "2027-06-30T23:59:59.000Z",
    duesPaid: true,
  },
  treasurer: {
    id: "usr_trs_004",
    name: "Trevor",
    email: "treasurer@skyline.edu",
    emailVerified: false,
    studentId: "SK-2024-9901",
    role: "treasurer",
    roles: ["treasurer"],
    isMember: true,
    membershipExpiresAt: "2027-06-30T23:59:59.000Z",
    duesPaid: true,
  },
};

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activePeriod: MembershipPeriodInfo | null;
  duesFormatted: string;
  loginAs: (role: UserRole) => Promise<void>;
  loginWithEmail: (email: string, password?: string) => Promise<UserProfile>;
  signupNewStudent: (name: string, email: string, studentId: string, password?: string) => Promise<UserProfile>;
  payDues: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<UserProfile | null>;
  // Capability flags based on PRD §7 & SECURITY.md role matrix
  canAccessDesk: boolean;
  canReviewClaims: boolean;
  canRecordPayouts: boolean;
  canManageEvents: boolean;
  canManageStock: boolean;
  canCheckIn: boolean;
  isMember: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isDemoEnvironment =
  typeof window !== "undefined"
    ? process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_DEMO_MODE === "true"
    : true;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activePeriod, setActivePeriod] = useState<MembershipPeriodInfo | null>(null);

  // Computed display string for active period dues (e.g. ₹500 from backend period records)
  const duesFormatted = activePeriod ? `₹${(activePeriod.duesPaise / 100).toFixed(0)}` : "₹500";

  // Fetch current authoritative membership period from API
  const fetchActivePeriod = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/membership-periods");
      if (res.ok) {
        const body = await res.json();
        const periods = body?.data;
        if (Array.isArray(periods) && periods.length > 0) {
          const now = new Date();
          const current =
            periods.find(
              (p: any) => new Date(p.startDate) <= now && new Date(p.endDate) >= now
            ) || periods[0];
          setActivePeriod(current);
        }
      }
    } catch {
      // Network/offline fallback
    }
  }, []);

  useEffect(() => {
    fetchActivePeriod();
  }, [fetchActivePeriod]);

  // Synchronize authenticated session state with real backend API
  const refreshSession = useCallback(async (): Promise<UserProfile | null> => {
    try {
      const res = await fetch("/api/v1/me", {
        headers: { "Cache-Control": "no-cache" },
      });

      if (res.ok) {
        const body = await res.json();
        const user = body?.data?.user;
        if (user) {
          const roles: string[] = user.roles || [];
          let computedRole: UserRole = "student_guest";
          if (roles.includes("treasurer")) {
            computedRole = "treasurer";
          } else if (roles.includes("officer")) {
            computedRole = "officer";
          } else if (user.isMember) {
            computedRole = "student_member";
          }

          const profile: UserProfile = {
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: Boolean(user.emailVerified),
            studentId: user.id.slice(0, 10).toUpperCase(),
            role: computedRole,
            roles,
            isMember: Boolean(user.isMember),
            membershipExpiresAt: user.membership?.expiresAt || null,
            duesPaid: Boolean(user.isMember),
          };

          setCurrentUser(profile);
          setIsLoading(false);
          return profile;
        }
      }
      setCurrentUser(null);
    } catch {
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
    return null;
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const loginAs = async (role: UserRole) => {
    if (!isDemoEnvironment) {
      throw new Error("Instant demo login is restricted to local demonstration environments");
    }

    setIsLoading(true);
    const creds = DEMO_CREDENTIALS[role];
    if (!creds) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await authClient.signIn.email({
        email: creds.email,
        password: creds.password,
      });

      if (res.error) {
        throw new Error(res.error.message || "Sign in failed");
      }

      await refreshSession();
    } catch (err) {
      console.error("Login as role failed:", err);
      setIsLoading(false);
      throw err;
    }
  };

  const loginWithEmail = async (email: string, password?: string): Promise<UserProfile> => {
    setIsLoading(true);
    const normalized = email.toLowerCase().trim();

    // Determine password if demo account in local demo environment
    let pwd = password;
    if (!pwd) {
      if (!isDemoEnvironment) {
        setIsLoading(false);
        throw new Error("Password is required for production sign in");
      }
      if (normalized.includes("officer")) {
        pwd = DEMO_CREDENTIALS.officer.password;
      } else if (normalized.includes("treasurer")) {
        pwd = DEMO_CREDENTIALS.treasurer.password;
      } else if (normalized.includes("guest") || normalized.includes("abhinav")) {
        pwd = DEMO_CREDENTIALS.student_guest.password;
      } else {
        pwd = DEMO_CREDENTIALS.student_member.password;
      }
    }

    const res = await authClient.signIn.email({
      email: normalized,
      password: pwd,
    });

    if (res.error) {
      setIsLoading(false);
      throw new Error(res.error.message || "Invalid email or password");
    }

    const profile = await refreshSession();
    if (!profile) {
      const isOfficer = normalized === "officer@skyline.edu" || normalized.includes("officer");
      const isTreasurer = normalized === "treasurer@skyline.edu" || normalized.includes("treasurer");
      const isGuest = normalized === "guest@skyline.edu" || normalized.includes("guest");
      const isMem = !isGuest;
      const computedRole: UserRole = isTreasurer ? "treasurer" : isOfficer ? "officer" : isGuest ? "student_guest" : "student_member";
      const roles: string[] = isTreasurer ? ["treasurer"] : isOfficer ? ["officer"] : [];

      const immediateProfile: UserProfile = {
        id: res.data?.user?.id || `usr_${computedRole}`,
        name: res.data?.user?.name || (isTreasurer ? "Trevor" : isOfficer ? "Olivia" : isGuest ? "Abhinav" : "Sam"),
        email: normalized,
        emailVerified: Boolean(res.data?.user?.emailVerified),
        studentId: (res.data?.user?.id || "").slice(0, 10).toUpperCase() || "SK-2026-DEMO",
        role: computedRole,
        roles,
        isMember: isMem,
        membershipExpiresAt: isMem ? "2027-06-30T23:59:59.000Z" : null,
        duesPaid: isMem,
      };

      setCurrentUser(immediateProfile);
      setIsLoading(false);
      return immediateProfile;
    }
    return profile;
  };

  const signupNewStudent = async (
    name: string,
    email: string,
    studentId: string,
    password?: string
  ): Promise<UserProfile> => {
    setIsLoading(true);
    const normalized = email.toLowerCase().trim();
    const pwd = password || "StudentPassword123!";

    const res = await authClient.signUp.email({
      name: name.trim(),
      email: normalized,
      password: pwd,
    });

    if (res.error) {
      setIsLoading(false);
      throw new Error(res.error.message || "Registration failed");
    }

    const profile = await refreshSession();
    if (!profile) {
      throw new Error("Registration succeeded but session could not be established");
    }
    return profile;
  };

  const payDues = async () => {
    if (!currentUser) throw new Error("Must be logged in to pay membership dues");

    // 1. Fetch active period
    let period = activePeriod;
    if (!period) {
      const periodsRes = await fetch("/api/v1/membership-periods");
      if (!periodsRes.ok) throw new Error("Failed to load membership periods");
      const periodsJson = await periodsRes.json();
      period = periodsJson?.data?.[0];
      if (!period) throw new Error("No active membership period found");
      setActivePeriod(period);
    }

    // 2. Initiate membership subscription
    const initRes = await fetch("/api/v1/memberships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periodId: period.id }),
    });

    if (!initRes.ok) {
      const errJson = await initRes.json();
      throw new Error(errJson?.error?.message || "Failed to initiate membership");
    }

    const initJson = await initRes.json();
    const membershipId = initJson?.data?.id;

    // 3. Confirm payment with demo confirmation - backend authoritatively computes amount from stored period
    const payRes = await fetch("/api/v1/payments/demo-confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "membership",
        referenceId: membershipId,
      }),
    });

    if (!payRes.ok) {
      const errJson = await payRes.json();
      throw new Error(errJson?.error?.message || "Failed to confirm payment");
    }

    // 4. Refresh session to update isMember state in database
    await refreshSession();
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authClient.signOut();
    } finally {
      setCurrentUser(null);
      setIsLoading(false);
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  };

  // Role capability matrix strictly aligned with PRD §7 and ARCHITECTURE §4
  const isAuthenticated = currentUser !== null;
  const userRoles = currentUser?.roles || [];
  const canAccessDesk = userRoles.includes("officer") || userRoles.includes("treasurer") || currentUser?.role === "officer" || currentUser?.role === "treasurer";
  const canReviewClaims = userRoles.includes("treasurer") || currentUser?.role === "treasurer";
  const canRecordPayouts = userRoles.includes("treasurer") || currentUser?.role === "treasurer";
  const canManageEvents = userRoles.includes("officer") || currentUser?.role === "officer";
  const canManageStock = userRoles.includes("officer") || currentUser?.role === "officer";
  const canCheckIn = userRoles.includes("officer") || userRoles.includes("treasurer") || currentUser?.role === "officer" || currentUser?.role === "treasurer";
  const isMember = Boolean(currentUser?.isMember);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isLoading,
        activePeriod,
        duesFormatted,
        loginAs,
        loginWithEmail,
        signupNewStudent,
        payDues,
        logout,
        refreshSession,
        canAccessDesk,
        canReviewClaims,
        canRecordPayouts,
        canManageEvents,
        canManageStock,
        canCheckIn,
        isMember,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
