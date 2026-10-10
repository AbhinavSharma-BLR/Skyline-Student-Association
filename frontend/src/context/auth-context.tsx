"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "student_member" | "student_guest" | "officer" | "treasurer";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  studentId: string;
  role: UserRole;
  isMember: boolean;
  membershipExpiresAt: string | null;
  duesPaid: boolean;
}

export const PRESET_USERS: Record<UserRole, UserProfile> = {
  student_member: {
    id: "usr_mem_001",
    name: "Adithya",
    email: "student@demo.skyline",
    studentId: "SK-2026-8812",
    role: "student_member",
    isMember: true,
    membershipExpiresAt: "2026-12-31",
    duesPaid: true,
  },
  student_guest: {
    id: "usr_gst_002",
    name: "Abhinav",
    email: "guest@demo.skyline",
    studentId: "SK-2026-4409",
    role: "student_guest",
    isMember: false,
    membershipExpiresAt: null,
    duesPaid: false,
  },
  officer: {
    id: "usr_off_003",
    name: "Anvitha",
    email: "officer@demo.skyline",
    studentId: "SK-2025-1102",
    role: "officer",
    isMember: true,
    membershipExpiresAt: "2026-12-31",
    duesPaid: true,
  },
  treasurer: {
    id: "usr_trs_004",
    name: "Varsha",
    email: "treasurer@demo.skyline",
    studentId: "SK-2024-9901",
    role: "treasurer",
    isMember: true,
    membershipExpiresAt: "2026-12-31",
    duesPaid: true,
  },
};

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  loginAs: (role: UserRole) => void;
  loginWithEmail: (email: string) => UserProfile;
  signupNewStudent: (name: string, email: string, studentId: string) => UserProfile;
  payDues: () => void;
  logout: () => void;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Start with default student member for seamless demo, but allow full logout/guest state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(PRESET_USERS.student_member);

  // Load saved persona preference from localStorage if available
  useEffect(() => {
    try {
      const savedUserJson = localStorage.getItem("skyline_active_user");
      if (savedUserJson) {
        const parsed = JSON.parse(savedUserJson) as UserProfile;
        if (parsed && parsed.id) {
          setCurrentUser(parsed);
          return;
        }
      }
      const savedRole = localStorage.getItem("skyline_demo_role") as UserRole;
      if (savedRole && PRESET_USERS[savedRole]) {
        setCurrentUser(PRESET_USERS[savedRole]);
      }
    } catch {
      // Ignore localStorage errors in SSR
    }
  }, []);

  const loginAs = (role: UserRole) => {
    const user = PRESET_USERS[role];
    setCurrentUser(user);
    try {
      localStorage.setItem("skyline_demo_role", role);
      localStorage.setItem("skyline_active_user", JSON.stringify(user));
    } catch {
      // Ignore
    }
  };

  const loginWithEmail = (email: string): UserProfile => {
    const normalized = email.toLowerCase().trim();
    let targetRole: UserRole = "student_member";

    if (normalized.includes("officer") || normalized.includes("anvitha") || normalized.includes("maya")) {
      targetRole = "officer";
    } else if (normalized.includes("treasurer") || normalized.includes("varsha") || normalized.includes("david")) {
      targetRole = "treasurer";
    } else if (normalized.includes("guest") || normalized.includes("abhinav") || normalized.includes("jordan")) {
      targetRole = "student_guest";
    } else if (normalized.includes("adithya") || normalized.includes("alex")) {
      targetRole = "student_member";
    }

    const matchedUser = PRESET_USERS[targetRole];
    const userToSet: UserProfile = {
      ...matchedUser,
      email: normalized,
    };

    setCurrentUser(userToSet);
    try {
      localStorage.setItem("skyline_demo_role", targetRole);
      localStorage.setItem("skyline_active_user", JSON.stringify(userToSet));
    } catch {
      // Ignore
    }
    return userToSet;
  };

  const signupNewStudent = (name: string, email: string, studentId: string): UserProfile => {
    const newStudent: UserProfile = {
      id: `usr_stu_${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      studentId: studentId.trim().toUpperCase(),
      role: "student_guest", // New accounts start with dues pending per PRD R01 & §8.1
      isMember: false,
      membershipExpiresAt: null,
      duesPaid: false,
    };

    setCurrentUser(newStudent);
    try {
      localStorage.setItem("skyline_demo_role", "student_guest");
      localStorage.setItem("skyline_active_user", JSON.stringify(newStudent));
    } catch {
      // Ignore
    }
    return newStudent;
  };

  const payDues = () => {
    if (!currentUser) return;
    const updated: UserProfile = {
      ...currentUser,
      isMember: true,
      duesPaid: true,
      role: currentUser.role === "student_guest" ? "student_member" : currentUser.role,
      membershipExpiresAt: "2026-12-31",
    };
    setCurrentUser(updated);
    try {
      localStorage.setItem("skyline_active_user", JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem("skyline_demo_role");
      localStorage.removeItem("skyline_active_user");
    } catch {
      // Ignore
    }
  };

  // Role capability matrix strictly aligned with PRD §7 and ARCHITECTURE §4
  const isAuthenticated = currentUser !== null;
  const canAccessDesk = !!currentUser && (currentUser.role === "officer" || currentUser.role === "treasurer");
  const canReviewClaims = !!currentUser && currentUser.role === "treasurer";
  const canRecordPayouts = !!currentUser && currentUser.role === "treasurer";
  const canManageEvents = !!currentUser && currentUser.role === "officer";
  const canManageStock = !!currentUser && currentUser.role === "officer";
  const canCheckIn = !!currentUser && (currentUser.role === "officer" || currentUser.role === "treasurer");
  const isMember = !!currentUser && currentUser.isMember && currentUser.duesPaid;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        loginAs,
        loginWithEmail,
        signupNewStudent,
        payDues,
        logout,
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

