"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { QRCode } from "@/components/ui/QRCode";
import AdmitOneTicket, { SkylineHolographicTicket } from "@/components/ui/admit-one-3-d-holographic-ticket";
import { Ticket, Sparkles, QrCode, Maximize2, Eye, ShieldCheck, Layers } from "lucide-react";

interface PassItem {
  id: string;
  eventName: string;
  date: string;
  time: string;
  venue: string;
  ticketCount: number;
  qrCode: string;
  status: "valid" | "checked_in";
  tier: "member" | "guest";
  pricePaidPaise: number;
}

export interface MerchandiseProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  memberPricePaise: number;
  guestPricePaise: number;
  sizes: string[];
  color: string;
  badge?: string;
}

export const MERCHANDISE_CATALOG: MerchandiseProduct[] = [
  {
    id: "MRCH-HD-01",
    name: "Skyline Varsity Club Hoodie",
    description: "Premium heavyweight fleece hoodie in deep navy with bold arch lettering. Ribbed cuffs, double-lined hood & kangaroo pouch.",
    category: "Hoodies & Fleece",
    imageUrl: "/merchandise/skyline-hoodie.jpg",
    memberPricePaise: 75000, // ₹750.00
    guestPricePaise: 95000,  // ₹950.00 (Save ₹200)
    sizes: ["S", "M", "L", "XL"],
    color: "Deep Navy",
    badge: "Official Club Merch",
  },
  {
    id: "MRCH-TS-02",
    name: "Skyline Heritage T-Shirt",
    description: "100% combed ringspun cotton tee in crisp white featuring the signature cobalt blue & black campus architectural skyline graphic.",
    category: "T-Shirts & Tops",
    imageUrl: "/merchandise/skyline-tshirt.jpg",
    memberPricePaise: 45000, // ₹450.00
    guestPricePaise: 60000,  // ₹600.00 (Save ₹150)
    sizes: ["S", "M", "L", "XL"],
    color: "Pure White",
    badge: "Campus Favorite",
  },
  {
    id: "MRCH-CP-03",
    name: "Embroidered Campus Cap",
    description: "Low-profile unstructured cotton twill dad hat in light stone with multi-tone blue/black SSA monogram embroidery and brass buckle.",
    category: "Headwear & Accessories",
    imageUrl: "/merchandise/skyline-cap.jpg",
    memberPricePaise: 30000, // ₹300.00
    guestPricePaise: 40000,  // ₹400.00 (Save ₹100)
    sizes: ["One Size"],
    color: "Light Stone",
    badge: "Embroidered",
  },
];

interface OrderItem {
  id: string;
  itemName: string;
  variant: string;
  pricePaise: number;
  status: "pending_collection" | "collected";
  orderDate: string;
  tier: "member" | "guest";
  quantity: number;
  imageUrl: string;
  collectionCode: string;
}

interface ClaimItem {
  id: string;
  title: string;
  amountPaise: number;
  category: string;
  submittedAt: string;
  status: "SUBMITTED" | "APPROVED" | "PAID" | "REJECTED";
  receiptName: string;
  receiptType: "image" | "pdf";
  receiptUrl?: string;
  isGuestSubmission?: boolean;
}

// Preset baseline datasets for member (Adithya)
const MEMBER_DEFAULT_PASSES: PassItem[] = [
  {
    id: "TKT-8841-TECH",
    eventName: "Innovation & Tech Summit",
    date: "18 Oct 2026",
    time: "10:00 AM - 4:00 PM",
    venue: "Auditorium Hall B",
    ticketCount: 1,
    qrCode: "TKT-8841-TECH",
    status: "valid",
    tier: "member",
    pricePaidPaise: 15000, // ₹150.00 Member rate
  },
  {
    id: "TKT-5521-CULT",
    eventName: "Skyline Cultural Night",
    date: "28 Oct 2026",
    time: "6:30 PM - 10:00 PM",
    venue: "Open Amphitheatre",
    ticketCount: 2,
    qrCode: "TKT-5521-CULT",
    status: "checked_in",
    tier: "member",
    pricePaidPaise: 40000, // 2x ₹200.00 Member rate
  },
];

const MEMBER_DEFAULT_ORDERS: OrderItem[] = [
  {
    id: "ORD-MBR-9902",
    itemName: "Skyline Varsity Club Hoodie",
    variant: "Size L · Deep Navy",
    pricePaise: 75000, // ₹750.00 Member discounted rate
    status: "pending_collection",
    orderDate: "05 Oct 2026",
    tier: "member",
    quantity: 1, // 1 item -> 1 picture
    imageUrl: "/merchandise/skyline-hoodie.jpg",
    collectionCode: "SK-PICKUP-9902",
  },
  {
    id: "ORD-MBR-8834",
    itemName: "Skyline Heritage T-Shirt",
    variant: "Size M · Pure White",
    pricePaise: 90000, // 2x ₹450.00 Member discounted rate
    status: "pending_collection",
    orderDate: "07 Oct 2026",
    tier: "member",
    quantity: 2, // 2 items -> 2 pictures
    imageUrl: "/merchandise/skyline-tshirt.jpg",
    collectionCode: "SK-PICKUP-8834",
  },
];

const GUEST_DEFAULT_ORDERS: OrderItem[] = [
  {
    id: "ORD-GST-4412",
    itemName: "Skyline Heritage T-Shirt",
    variant: "Size L · Pure White",
    pricePaise: 120000, // 2x ₹600.00 standard guest rate
    status: "pending_collection",
    orderDate: "09 Oct 2026",
    tier: "guest",
    quantity: 2, // 2 items -> 2 pictures
    imageUrl: "/merchandise/skyline-tshirt.jpg",
    collectionCode: "SK-PICKUP-4412",
  },
  {
    id: "ORD-GST-3109",
    itemName: "Embroidered Campus Cap",
    variant: "One Size · Light Stone",
    pricePaise: 40000, // 1x ₹400.00 standard guest rate
    status: "pending_collection",
    orderDate: "10 Oct 2026",
    tier: "guest",
    quantity: 1, // 1 item -> 1 picture
    imageUrl: "/merchandise/skyline-cap.jpg",
    collectionCode: "SK-PICKUP-3109",
  },
];

const MEMBER_DEFAULT_CLAIMS: ClaimItem[] = [
  {
    id: "CLM-104",
    title: "Markers & Chart Papers for Tech Workshop",
    amountPaise: 38000, // ₹380.00
    category: "Supplies",
    submittedAt: "08 Oct 2026",
    status: "APPROVED",
    receiptName: "receipt_workshop_markers.jpg",
    receiptType: "image",
    isGuestSubmission: false,
  },
];

/**
 * Student Workspace (/me)
 * 
 * Accurately implements role differentiation:
 * - Active Member (Adithya): Verified pass with active QR, member pricing benefits,
 *   confirmed passes & hoodie pickup, and volunteer reimbursement access.
 * - Student Guest (Abhinav / New Signups): Inactive card with dues pending,
 *   locked member benefits, side-by-side pricing comparisons (Tech Summit ₹250 regular vs ₹150 member),
 *   dedicated dues activation checkout (₹200), and guest ticket/merch capabilities.
 */
export default function StudentWorkspacePage() {
  const { currentUser, isAuthenticated, canAccessDesk, payDues, logout, loginAs } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "passes" | "orders" | "claims">("overview");

  // Dynamic user-scoped state
  const isMember = currentUser?.isMember ?? false;
  const isGuest = !isMember;

  const [passes, setPasses] = useState<PassItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [claims, setClaims] = useState<ClaimItem[]>([]);

  // Synchronize initial data whenever active user changes
  useEffect(() => {
    if (!currentUser) {
      setPasses([]);
      setOrders([]);
      setClaims([]);
      return;
    }

    if (currentUser.isMember) {
      setPasses(MEMBER_DEFAULT_PASSES);
      setOrders(MEMBER_DEFAULT_ORDERS);
      setClaims(MEMBER_DEFAULT_CLAIMS);
    } else {
      // Guests have their guest merchandise purchases recorded
      setPasses([]);
      setOrders(GUEST_DEFAULT_ORDERS);
      setClaims([]);
    }
  }, [currentUser?.id, currentUser?.isMember]);

  // Form state for reimbursement claim
  const [newClaimTitle, setNewClaimTitle] = useState("");
  const [newClaimAmount, setNewClaimAmount] = useState("");
  const [newClaimCategory, setNewClaimCategory] = useState("Supplies");
  const [uploadedReceipt, setUploadedReceipt] = useState<{
    file: File;
    name: string;
    sizeKb: number;
    type: "image" | "pdf";
    previewUrl?: string;
  } | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);

  // Modal inspection states
  const [inspectReceipt, setInspectReceipt] = useState<ClaimItem | null>(null);
  const [inspectPass, setInspectPass] = useState<PassItem | null>(null);
  const [passModalView, setPassModalView] = useState<"hologram" | "qr">("hologram");
  const [activeHoloIndex, setActiveHoloIndex] = useState(0);

  // Configuration helper for 3D Holographic Foil Ticket integration
  const getTicketConfigForPass = (pass: PassItem) => {
    const isTech = pass.eventName.toLowerCase().includes("tech") || pass.eventName.toLowerCase().includes("innovation");
    return {
      name: currentUser?.name?.toUpperCase() || "SKYLINE STUDENT",
      presenter: "SKYLINE STUDENT ASSOC",
      event: pass.eventName.toUpperCase(),
      venue: pass.venue.toUpperCase(),
      dates: `${pass.date.toUpperCase()} • ${pass.time.toUpperCase()}`,
      stubText: pass.tier === "member" ? "MEMBER PASS" : "GUEST PASS",
      watermark: pass.id.slice(-4),
      texture: isTech
        ? {
            engine: "generative",
            colorBack: "#050b14",
            colorFront: "#0047AB", // Deep Cobalt Blue brand token
            colorHighlight: "#60a5fa",
            shape: "warp",
            type: "random",
            size: 0.6,
            colorSteps: 4,
            scale: 1,
            speed: 0.35,
          }
        : {
            engine: "image",
            image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
            colorBack: "#0a0515",
            colorFront: "#5b21b6",
            colorHighlight: "#a855f7",
            shape: "wave",
            type: "8x8",
            size: 0.7,
            colorSteps: 3,
            scale: 1,
            speed: 0.4,
          },
    };
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick interactive actions for guests to test purchases at guest rates
  const handleBuyGuestTicket = () => {
    const newGuestPass: PassItem = {
      id: `TKT-GST-${Math.floor(1000 + Math.random() * 9000)}`,
      eventName: "Innovation & Tech Summit",
      date: "18 Oct 2026",
      time: "10:00 AM - 4:00 PM",
      venue: "Auditorium Hall B",
      ticketCount: 1,
      qrCode: `TKT-GST-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "valid",
      tier: "guest",
      pricePaidPaise: 25000, // ₹250.00 Regular Guest Rate
    };
    setPasses((prev) => [newGuestPass, ...prev]);
    setActiveTab("passes");
  };

  // Merchandise Shop Selection State
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({
    "MRCH-HD-01": "L",
    "MRCH-TS-02": "M",
    "MRCH-CP-03": "One Size",
  });
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({
    "MRCH-HD-01": 1,
    "MRCH-TS-02": 1,
    "MRCH-CP-03": 1,
  });
  const [inspectOrder, setInspectOrder] = useState<OrderItem | null>(null);
  const [merchPurchaseSuccess, setMerchPurchaseSuccess] = useState<string | null>(null);

  const handlePurchaseProduct = (product: MerchandiseProduct) => {
    const size = selectedSizes[product.id] || product.sizes[0];
    const qty = selectedQuantities[product.id] || 1;
    const isMemberUser = currentUser?.isMember ?? false;
    const unitPricePaise = isMemberUser ? product.memberPricePaise : product.guestPricePaise;
    const totalPaise = unitPricePaise * qty;
    const orderNum = Math.floor(1000 + Math.random() * 9000);

    const newOrder: OrderItem = {
      id: `ORD-${isMemberUser ? "MBR" : "GST"}-${orderNum}`,
      itemName: product.name,
      variant: size === "One Size" ? `Adjustable · ${product.color}` : `Size ${size} · ${product.color}`,
      pricePaise: totalPaise,
      status: "pending_collection",
      orderDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      tier: isMemberUser ? "member" : "guest",
      quantity: qty,
      imageUrl: product.imageUrl,
      collectionCode: `SK-PICKUP-${orderNum}`,
    };

    setOrders((prev) => [newOrder, ...prev]);
    setMerchPurchaseSuccess(`✓ Ordered ${qty}x ${product.name}! Collection Slip generated.`);
    setTimeout(() => setMerchPurchaseSuccess(null), 5000);
  };

  const handleBuyGuestMerch = () => {
    const hoodie = MERCHANDISE_CATALOG[0];
    handlePurchaseProduct(hoodie);
  };

  // Handle local file selection (PDF, JPG, PNG)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const isImage = file.type.startsWith("image/");

    if (!isPdf && !isImage) {
      alert("Please upload a JPG, PNG, or PDF file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit.");
      return;
    }

    if (isImage) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedReceipt({
          file,
          name: file.name,
          sizeKb: Math.round(file.size / 1024),
          type: "image",
          previewUrl: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    } else {
      setUploadedReceipt({
        file,
        name: file.name,
        sizeKb: Math.round(file.size / 1024),
        type: "pdf",
      });
    }
  };

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClaimTitle || !newClaimAmount) return;

    const amountInPaise = Math.round(parseFloat(newClaimAmount) * 100);
    const newClaim: ClaimItem = {
      id: `CLM-${Math.floor(100 + Math.random() * 900)}`,
      title: newClaimTitle,
      amountPaise: amountInPaise,
      category: newClaimCategory,
      submittedAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      status: "SUBMITTED",
      receiptName: uploadedReceipt ? uploadedReceipt.name : "receipt_manual_claim.jpg",
      receiptType: uploadedReceipt ? uploadedReceipt.type : "image",
      receiptUrl: uploadedReceipt?.previewUrl,
      isGuestSubmission: isGuest,
    };

    setClaims([newClaim, ...claims]);
    setNewClaimTitle("");
    setNewClaimAmount("");
    setUploadedReceipt(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setClaimSuccess(true);
    setTimeout(() => setClaimSuccess(false), 4000);
  };

  // 1. UNRECOGNIZED / UNAUTHENTICATED SESSION GUARD
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex flex-col items-center justify-center p-6 text-center font-sans selection:bg-[#E8F0FF] selection:text-[#0047AB]">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-[#E5E7EB]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F0FF] text-[#0047AB] text-3xl font-black mb-4">
            🔒
          </div>
          <span className="inline-block rounded-full bg-[#E8F0FF] px-3.5 py-1 text-xs font-bold text-[#0047AB] uppercase tracking-wider">
            Authentication Required
          </span>
          <h1 className="mt-4 text-2xl font-black text-[#0A0A0A]">
            Sign in to Skyline
          </h1>
          <p className="mt-3 text-sm text-[#64748B] leading-relaxed">
            The Student Workspace (`/me`) contains your personal membership identity pass,
            registered event tickets, and reimbursement claims.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link href="/login">
              <Button className="w-full bg-[#0047AB] hover:bg-[#003785] text-white">Sign in to Skyline</Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline" className="w-full">Create New Account</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col font-sans selection:bg-[#E8F0FF] selection:text-[#0047AB]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="w-8 h-8 rounded-lg bg-[#0047AB] text-white flex items-center justify-center font-bold text-base transition group-hover:scale-105">
                S
              </span>
              <span className="text-xl font-bold tracking-tight text-[#0A0A0A]">
                Skyline<span className="text-[#0047AB]">.</span>
              </span>
            </Link>
            <span className="hidden sm:inline-block h-5 w-px bg-[#E5E7EB]"></span>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Student Workspace
              </span>
              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                isMember ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-[#E8F0FF] text-[#0047AB] border border-[#0047AB]/20"
              }`}>
                {isMember ? "Active Member" : "Guest (Dues Pending)"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick evaluator role toggle between Member and Guest */}
            <div className="hidden md:flex items-center gap-1.5 bg-[#F7F8FA] p-1 rounded-xl border border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => loginAs("student_member")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                  currentUser.role === "student_member"
                    ? "bg-[#0047AB] text-white shadow-2xs"
                    : "text-[#64748B] hover:text-[#0A0A0A]"
                }`}
              >
                Adithya (Member)
              </button>
              <button
                type="button"
                onClick={() => loginAs("student_guest")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                  currentUser.role === "student_guest"
                    ? "bg-[#0047AB] text-white shadow-2xs"
                    : "text-[#64748B] hover:text-[#0A0A0A]"
                }`}
              >
                Abhinav (Guest)
              </button>
            </div>

            {canAccessDesk && (
              <Link
                href="/desk"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-[#0A0A0A] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#262626]"
              >
                <span>🛡️ Club Desk →</span>
              </Link>
            )}

            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm shadow-2xs text-white ${
                isMember ? "bg-[#0047AB]" : "bg-[#0A0A0A]"
              }`}>
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-[#0A0A0A] leading-tight">{currentUser.name}</p>
                <p className="text-[11px] text-[#64748B] font-mono">{currentUser.studentId}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-[#E5E7EB] px-2.5 py-1 text-xs font-semibold text-[#64748B] transition hover:bg-[#F7F8FA] hover:text-[#0A0A0A]"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 flex-1">
        {/* ROLE NOTICE BANNER FOR GUEST STUDENTS (PRD §2 & §8.1) */}
        {isGuest && (
          <div className="mb-8 rounded-2xl border border-[#0047AB]/20 bg-[#E8F0FF] p-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0047AB] text-white font-extrabold text-2xl shadow-xs">
                  ⚡
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#0047AB] px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
                      Guest Account · Dues Pending
                    </span>
                    <span className="text-xs text-[#0047AB] font-semibold">
                      (PRD §2 Target Users: Student Non-Member)
                    </span>
                  </div>
                  <h2 className="mt-1.5 text-lg font-extrabold text-[#0A0A0A]">
                    Your account is registered, but membership dues have not been paid yet.
                  </h2>
                  <p className="mt-1 text-xs text-[#64748B] max-w-2xl leading-relaxed">
                    As a student guest, you can purchase tickets and official merchandise at standard non-member prices.
                    To unlock up to <strong>40% ticket discounts</strong>, exclusive merch rates, and verified express door check-in, activate your 2026 membership today.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Button
                  onClick={payDues}
                  className="bg-[#0047AB] hover:bg-[#003785] text-white shadow-xs text-xs font-bold py-2.5 px-4"
                >
                  ⚡ Activate Membership (Demo ₹200) →
                </Button>
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className="rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2 text-xs font-bold text-[#0A0A0A] hover:bg-[#F7F8FA] transition"
                >
                  View Perks &amp; Breakdown
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A0A0A]">
                Welcome back, {currentUser.name.split(" ")[0]}!
              </h1>
              {isMember ? (
                <Badge variant="success">Active Member</Badge>
              ) : (
                <Badge variant="warning">Student Guest</Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {isMember
                ? "Manage your active membership identity, booked event tickets, and volunteer reimbursements."
                : "Manage your guest tickets, explore club activities, or activate your full membership."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick switcher for mobile */}
            <div className="flex md:hidden items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => loginAs("student_member")}
                className="rounded-lg bg-slate-200 px-2 py-1 font-semibold text-slate-700"
              >
                Adithya (Member)
              </button>
              <button
                type="button"
                onClick={() => loginAs("student_guest")}
                className="rounded-lg bg-amber-100 px-2 py-1 font-semibold text-amber-800"
              >
                Abhinav (Guest)
              </button>
            </div>

            {canAccessDesk && (
              <Link
                href="/desk"
                className="sm:hidden self-start rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white"
              >
                Access Club Desk →
              </Link>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E5E7EB] gap-2 sm:gap-6 mb-8 overflow-x-auto pb-px">
          {[
            { id: "overview", label: isMember ? "Membership Card" : "Guest Pass & Dues" },
            { id: "passes", label: `My Tickets (${passes.length})` },
            { id: "orders", label: `Merch Orders (${orders.length})` },
            { id: "claims", label: `Reimbursements (${claims.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-sm font-semibold transition whitespace-nowrap border-b-2 ${
                activeTab === tab.id
                  ? "border-[#0047AB] text-[#0047AB] font-bold"
                  : "border-transparent text-[#64748B] hover:text-[#0A0A0A]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: MEMBERSHIP CARD & DUES STATUS */}
        {activeTab === "overview" && (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Digital Pass Presentation */}
            <div className="lg:col-span-2">
              {isMember ? (
                /* ACTIVE MEMBER DIGITAL PASS */
                <div className="relative overflow-hidden rounded-2xl bg-[#0A0A0A] p-8 text-white shadow-xl border border-[#0047AB]/40">
                  <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#0047AB] blur-3xl opacity-20 pointer-events-none" />

                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold tracking-widest uppercase text-[#0047AB] bg-[#E8F0FF] px-2.5 py-0.5 rounded-full">
                        Skyline Student Association
                      </span>
                      <h2 className="text-2xl font-extrabold mt-2 text-white">Digital Membership Pass</h2>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-[#0047AB] text-white flex items-center justify-center font-bold text-xl shadow-xs">
                      SK
                    </div>
                  </div>

                  <div className="relative z-10 my-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[#64748B]">Student Name</p>
                      <p className="text-lg font-bold mt-1 text-white">{currentUser.name}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[#64748B]">Member ID</p>
                      <p className="text-lg font-bold font-mono mt-1 text-white">{currentUser.studentId}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[#64748B]">Status</p>
                      <p className="mt-1 font-bold">
                        <span className="inline-flex items-center gap-1.5 text-emerald-400">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span> Active (Valid 2026)
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between border-t border-white/10 pt-6 gap-4">
                    <div className="text-xs text-[#64748B] font-mono">
                      AUTH-HASH: {currentUser.id.toUpperCase()}-2026-SKYLINE
                    </div>
                    <div className="text-xs text-[#E8F0FF] font-semibold flex items-center gap-1.5">
                      <span>✓</span> Valid for discounts on all events &amp; official merchandise
                    </div>
                  </div>
                </div>
              ) : (
                /* INACTIVE GUEST CARD (DUES REQUIRED) */
                <div className="relative overflow-hidden rounded-2xl bg-white border-2 border-dashed border-[#E5E7EB] p-8 text-[#0A0A0A] shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold tracking-widest uppercase text-[#0047AB] bg-[#E8F0FF] px-2.5 py-0.5 rounded-full">
                        Skyline Student Association · Prospective Account
                      </span>
                      <h2 className="text-2xl font-extrabold mt-2 text-[#0A0A0A]">Inactive Guest Pass</h2>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-[#F7F8FA] text-[#64748B] border border-[#E5E7EB] flex items-center justify-center font-bold text-xl">
                      🔒
                    </div>
                  </div>

                  <div className="my-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[#64748B]">Student Name</p>
                      <p className="text-lg font-bold mt-1 text-[#0A0A0A]">{currentUser.name}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[#64748B]">Guest ID</p>
                      <p className="text-lg font-bold font-mono mt-1 text-[#0A0A0A]">{currentUser.studentId}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[#64748B]">Membership Tier</p>
                      <p className="mt-1 font-bold">
                        <span className="inline-flex items-center gap-1.5 text-amber-600 font-bold">
                          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span> Dues Pending (₹200)
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-[#E5E7EB] pt-6 gap-4">
                    <div className="text-xs text-[#64748B] font-mono">
                      TIER: GUEST-NON-MEMBER · UNVERIFIED IDENTITY
                    </div>
                    <div className="text-xs text-amber-700 font-semibold flex items-center gap-1.5">
                      <span>⚠️</span> Card inactive. Cannot be used for member entry or member discounts.
                    </div>
                  </div>
                </div>
              )}

              {/* Perks Comparison / Member Benefits */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-[#0A0A0A]">
                    {isMember ? "Your Active Membership Privileges" : "Member Privileges (Locked for Guest)"}
                  </h3>
                  {isGuest && (
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      Activate dues to unlock all 3
                    </span>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Card className={isGuest ? "border-[#E5E7EB] bg-[#F7F8FA]/70" : "border-[#E5E7EB] bg-white shadow-2xs"}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base text-[#0A0A0A]">Ticket Discounts</CardTitle>
                        <span className="text-base">{isMember ? "🎟️" : "🔒"}</span>
                      </div>
                      <CardDescription>
                        {isMember ? (
                          <span className="text-emerald-700 font-medium">
                            Active: Up to 40% off on all events (Tech Summit: ₹150 vs ₹250).
                          </span>
                        ) : (
                          <span className="text-[#64748B]">
                            Locked: Currently paying regular guest prices (Tech Summit: ₹250).
                          </span>
                        )}
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card className={isGuest ? "border-[#E5E7EB] bg-[#F7F8FA]/70" : "border-[#E5E7EB] bg-white shadow-2xs"}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base text-[#0A0A0A]">Merch Priority</CardTitle>
                        <span className="text-base">{isMember ? "👕" : "🔒"}</span>
                      </div>
                      <CardDescription>
                        {isMember ? (
                          <span className="text-emerald-700 font-medium">
                            Active: Club hoodies for ₹750 (Regular ₹950 · Save ₹200).
                          </span>
                        ) : (
                          <span className="text-[#64748B]">
                            Locked: Official merchandise available at standard guest rate (₹950).
                          </span>
                        )}
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card className={isGuest ? "border-[#E5E7EB] bg-[#F7F8FA]/70" : "border-[#E5E7EB] bg-white shadow-2xs"}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base text-[#0A0A0A]">Voting & Duties</CardTitle>
                        <span className="text-base">{isMember ? "🗳️" : "🔒"}</span>
                      </div>
                      <CardDescription>
                        {isMember ? (
                          <span className="text-emerald-700 font-medium">
                            Active: Eligible for committee duties, voting, and volunteer expense claims.
                          </span>
                        ) : (
                          <span className="text-[#64748B]">
                            Locked: Reserved for active members with assigned committee duties.
                          </span>
                        )}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </div>
            </div>

            {/* Dues Status / Payment Checkout Panel */}
            <div>
              <Card className="h-full flex flex-col justify-between border-[#E5E7EB] bg-white shadow-xs">
                <div>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-[#0A0A0A]">Annual Dues Checkout</CardTitle>
                      {isMember ? (
                        <Badge variant="success">Paid & Active</Badge>
                      ) : (
                        <Badge variant="warning">Action Required</Badge>
                      )}
                    </div>
                    <CardDescription className="text-[#64748B]">
                      Academic Year 2026 Membership Period (PRD §8.1)
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="rounded-2xl bg-[#F7F8FA] p-4 border border-[#E5E7EB]">
                      <div className="flex justify-between items-center text-sm font-semibold text-[#0A0A0A]">
                        <span>Standard Annual Dues</span>
                        <span className="text-lg font-black text-[#0A0A0A]">₹200.00</span>
                      </div>
                      <p className="mt-2 text-xs text-[#64748B] leading-relaxed">
                        One-time annual fee activating member pricing on all tickets, official merchandise, and club voting.
                      </p>
                    </div>

                    {isMember ? (
                      <div className="mt-6 rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-xs text-emerald-800 leading-relaxed space-y-2">
                        <div className="flex items-center gap-2 font-bold text-emerald-900">
                          <span>✓</span> Membership Paid & Active
                        </div>
                        <p>
                          Your annual dues of <strong>₹200.00</strong> are recorded in the Skyline Club Ledger. Your digital membership pass is valid through <strong>31 Dec 2026</strong>.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-6 space-y-4">
                        <div className="rounded-2xl bg-amber-50/80 p-4 border border-amber-200 text-xs text-amber-900 space-y-2">
                          <p className="font-bold">Why activate now?</p>
                          <ul className="space-y-1 text-[#0A0A0A] list-disc pl-4 text-[11px]">
                            <li>Save ₹100 on Tech Summit ticket</li>
                            <li>Save ₹150 on Cultural Night ticket</li>
                            <li>Save ₹200 on Varsity Club Hoodie</li>
                            <li className="font-bold text-emerald-700">Total immediate savings: ₹450+</li>
                          </ul>
                        </div>

                        <Button
                          onClick={payDues}
                          className="w-full bg-[#0047AB] hover:bg-[#003785] text-white shadow-xs py-3 text-xs font-bold"
                        >
                          ⚡ Pay Dues (Demo ₹200) & Activate →
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </div>

                <div className="p-6 pt-0 text-[11px] text-[#64748B]">
                  Payments are simulated securely via the Skyline Demo Payment Adapter (PRD §8.1).
                </div>
              </Card>
            </div>

            {/* Purchased Merchandise Overview Section (Full Width) */}
            {orders.length > 0 && (
              <div className="lg:col-span-3 rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-[#0A0A0A]">Your Purchased Merchandise</h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#E8F0FF] text-[#0047AB] text-xs font-black border border-[#0047AB]/20">
                        {orders.reduce((sum, o) => sum + (o.quantity || 1), 0)} Units Ready for Pickup
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      {isMember
                        ? "Official club merchandise allocated to your membership account."
                        : "Official merchandise purchased under your guest account. Present pickup slip at West Wing Club Room 104."}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("orders")}
                    className="text-xs border-[#0047AB]/30 text-[#0047AB] hover:bg-[#E8F0FF] font-semibold self-start sm:self-auto"
                  >
                    Open Merch Shop &amp; Slips →
                  </Button>
                </div>

                {/* Display product pictures according to the number of merchandise purchased */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {orders.flatMap((order) => {
                    const qty = order.quantity || 1;
                    const fallbackImg = order.itemName.toLowerCase().includes("hoodie")
                      ? "/merchandise/skyline-hoodie.jpg"
                      : order.itemName.toLowerCase().includes("t-shirt") || order.itemName.toLowerCase().includes("shirt")
                      ? "/merchandise/skyline-tshirt.jpg"
                      : "/merchandise/skyline-cap.jpg";
                    const img = order.imageUrl || fallbackImg;

                    return Array.from({ length: qty }).map((_, uIdx) => (
                      <div
                        key={`${order.id}-ov-unit-${uIdx}`}
                        onClick={() => {
                          setInspectOrder(order);
                        }}
                        className="group/ov cursor-pointer rounded-2xl border border-[#E5E7EB] bg-[#F7F8FA] overflow-hidden hover:border-[#0047AB] hover:shadow-md transition flex flex-col"
                      >
                        <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                          <img
                            src={img}
                            alt={`${order.itemName} Unit ${uIdx + 1}`}
                            className="w-full h-full object-cover group-hover/ov:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-1.5 left-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-[#0047AB] text-white text-[9px] font-black shadow-xs">
                              #{uIdx + 1}/{qty}
                            </span>
                          </div>
                          <div className="absolute bottom-1.5 right-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md text-white text-[8px] font-mono font-bold">
                              {order.tier === "member" ? "MBR" : "GST"}
                            </span>
                          </div>
                        </div>
                        <div className="p-2 text-left bg-white flex-1 flex flex-col justify-between">
                          <p className="text-[11px] font-bold text-[#0A0A0A] truncate leading-tight">
                            {order.itemName}
                          </p>
                          <p className="text-[9px] text-[#64748B] mt-0.5 truncate">
                            {order.variant}
                          </p>
                          <span className="text-[9px] text-[#0047AB] font-mono font-bold mt-1">
                            Collection Slip →
                          </span>
                        </div>
                      </div>
                    ));
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY TICKETS & PASSES */}
        {activeTab === "passes" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-[#0A0A0A]">My Event Tickets</h2>
                  {isGuest && (
                    <Badge variant="warning">Guest Pricing Applies</Badge>
                  )}
                </div>
                <p className="text-sm text-[#64748B]">
                  {isMember
                    ? "Present your verified digital ticket QR pass at the entrance for fast door check-in."
                    : "Tickets booked by guest accounts reflect standard non-member rates (PRD §2 & R05)."}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {isGuest && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBuyGuestTicket}
                    className="border-[#0047AB]/30 text-[#0047AB] hover:bg-[#E8F0FF] text-xs"
                  >
                    + Demo: Buy Ticket as Guest (₹250)
                  </Button>
                )}
                <Link href="/#events">
                  <Button variant="outline" size="sm">Browse Campus Events</Button>
                </Link>
              </div>
            </div>

            {/* Empty State for Guest or Member with no tickets */}
            {passes.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#E5E7EB] bg-white p-12 text-center shadow-xs">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F0FF] text-[#0047AB] text-3xl mb-4">
                  🎟️
                </div>
                <h3 className="text-lg font-bold text-[#0A0A0A]">No Event Passes Found</h3>
                <p className="mt-2 text-xs text-[#64748B] max-w-md mx-auto leading-relaxed">
                  {isGuest
                    ? "As a student guest, you can purchase tickets for any campus event at standard guest rates, or activate your membership first to save up to 40% on every ticket."
                    : "You haven't registered for any upcoming events yet. Check out the latest campus summits and cultural nights!"}
                </p>

                {isGuest && (
                  <div className="mt-6 max-w-sm mx-auto bg-[#F7F8FA] rounded-2xl p-4 border border-[#E5E7EB] text-left text-xs">
                    <p className="font-bold text-[#0A0A0A] mb-2">Upcoming: Innovation & Tech Summit</p>
                    <div className="flex justify-between items-center py-1 border-b border-[#E5E7EB] text-[#64748B]">
                      <span>Standard Guest Price:</span>
                      <span className="font-bold text-[#0A0A0A]">₹250.00</span>
                    </div>
                    <div className="flex justify-between items-center py-1 text-emerald-700 font-semibold">
                      <span>Member Discounted Price:</span>
                      <span>₹150.00 (Save ₹100)</span>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {isGuest ? (
                    <>
                      <Button onClick={handleBuyGuestTicket} className="text-xs bg-[#0047AB] hover:bg-[#003785] text-white">
                        Book Innovation Summit at Guest Rate (₹250) →
                      </Button>
                      <Button variant="outline" onClick={payDues} className="text-xs">
                        Activate Membership to Save ₹100
                      </Button>
                    </>
                  ) : (
                    <Link href="/#events">
                      <Button className="text-xs bg-[#0047AB] hover:bg-[#003785] text-white">Browse Events →</Button>
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid gap-8 lg:grid-cols-2">
                {passes.map((pass, pIdx) => (
                  <div
                    key={pass.id}
                    className="rounded-3xl border border-[#E5E7EB] bg-[#0A0A0A] p-6 shadow-xl flex flex-col justify-between text-white relative overflow-hidden group hover:border-cyan-400/60 transition-all duration-300"
                  >
                    {/* Ambient Cobalt/Cyan Spotlight */}
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#0047AB] blur-3xl opacity-20 pointer-events-none group-hover:opacity-35 transition-opacity duration-500" />

                    {/* Top Metadata Header */}
                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-300">✦ {pass.id}</span>
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          pass.tier === "member"
                            ? "bg-[#E8F0FF] text-[#0047AB]"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {pass.tier === "member" ? "Member Pass (Subsidized)" : "Guest Ticket (Regular Rate)"}
                        </span>
                      </div>
                      {pass.status === "valid" ? (
                        <Badge variant="success">Ready for Entry</Badge>
                      ) : (
                        <Badge variant="neutral">Checked In</Badge>
                      )}
                    </div>

                    {/* 3D Holographic Foil Admit One Pass Component (Exact Match with Uploaded Image) */}
                    <div className="w-full flex justify-center py-2 relative z-10">
                      <SkylineHolographicTicket
                        ticketId={pass.id}
                        eventName={pass.eventName.toUpperCase()}
                        attendeeName={currentUser.name.toUpperCase()}
                        venue={pass.venue.toUpperCase()}
                        date={pass.date.toUpperCase()}
                        time={pass.time.toUpperCase()}
                        stubText={pass.ticketCount === 1 ? "1 ADMIT" : `${pass.ticketCount} ADMITS`}
                        barcodeNumber={pass.qrCode.replace(/[^0-9]/g, "").slice(0, 6) || "912215"}
                        status={pass.status}
                        tier={pass.tier}
                        onClick={() => {
                          setActiveHoloIndex(pIdx);
                          setInspectPass(pass);
                          setPassModalView("hologram");
                        }}
                      />
                    </div>

                    {/* Quick Access Bar: QR & Modal Triggers */}
                    <div className="mt-5 border-t border-white/10 pt-4 flex items-center justify-between gap-3 relative z-10 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-white rounded-lg">
                          <QRCode value={pass.qrCode} size={44} />
                        </div>
                        <div>
                          <p className="text-xs font-mono font-bold text-white">{pass.qrCode}</p>
                          <p className="text-[10px] text-cyan-300 font-medium">Ready for door scan · Tilt for 3D glare</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setActiveHoloIndex(pIdx);
                            setInspectPass(pass);
                            setPassModalView("hologram");
                          }}
                          className="bg-[#0047AB] hover:bg-[#003785] text-white text-xs flex items-center gap-1.5 shadow-xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                          <span>3D Foil Pass</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setInspectPass(pass);
                            setPassModalView("qr");
                          }}
                          className="border-white/20 text-white hover:bg-white/10 text-xs flex items-center gap-1.5"
                        >
                          <QrCode className="w-3.5 h-3.5 text-slate-300" />
                          <span>Door QR</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MERCHANDISE SHOP & PURCHASED ORDERS */}
        {activeTab === "orders" && (
          <div className="space-y-10">
            {/* Purchase Confirmation Alert */}
            {merchPurchaseSuccess && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-900 flex items-center justify-between animate-in fade-in">
                <span>{merchPurchaseSuccess}</span>
                <span className="text-emerald-600 font-mono text-[10px]">PICKUP READY</span>
              </div>
            )}

            {/* ============================================================ */}
            {/* PART A: OFFICIAL MERCHANDISE SHOP CATALOG                     */}
            {/* ============================================================ */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#0047AB] bg-[#E8F0FF] px-2.5 py-0.5 rounded-full">
                      Official Campus Collection
                    </span>
                    {isGuest ? (
                      <Badge variant="warning">Guest Retail Pricing</Badge>
                    ) : (
                      <Badge variant="success">Member Discount Active (Save Up to 25%)</Badge>
                    )}
                  </div>
                  <h2 className="text-2xl font-extrabold text-[#0A0A0A] mt-2">Skyline Merchandise Shop</h2>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                    Official student organization apparel and headwear. Subsidized pricing for verified members.
                  </p>
                </div>

                {isGuest && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={payDues}
                    className="border-[#0047AB]/30 text-[#0047AB] hover:bg-[#E8F0FF] text-xs self-start sm:self-auto"
                  >
                    Activate Membership to Save up to ₹200/item
                  </Button>
                )}
              </div>

              {/* 3-Column Visual Merchandise Product Grid */}
              <div className="grid gap-6 md:grid-cols-3">
                {MERCHANDISE_CATALOG.map((product) => {
                  const currentSize = selectedSizes[product.id] || product.sizes[0];
                  const currentQty = selectedQuantities[product.id] || 1;
                  const unitPricePaise = isMember ? product.memberPricePaise : product.guestPricePaise;
                  const totalPaise = unitPricePaise * currentQty;
                  const savingsPerUnit = (product.guestPricePaise - product.memberPricePaise) / 100;

                  return (
                    <div
                      key={product.id}
                      className="rounded-3xl border border-[#E5E7EB] bg-white overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group"
                    >
                      {/* Product Image Frame */}
                      <div className="relative aspect-[4/3] w-full bg-[#F7F8FA] overflow-hidden border-b border-[#E5E7EB]">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-bold text-[#0A0A0A] shadow-xs border border-black/5">
                            {product.badge || "Official Merch"}
                          </span>
                        </div>
                        {isMember && (
                          <div className="absolute top-3 right-3">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold shadow-xs">
                              Save ₹{savingsPerUnit}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Product Details & Selection Body */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-xs text-[#64748B] mb-1">
                            <span className="uppercase font-mono text-[10px] tracking-wider">{product.category}</span>
                            <span className="font-mono text-[10px]">{product.id}</span>
                          </div>

                          <h3 className="text-base font-bold text-[#0A0A0A] leading-snug">{product.name}</h3>
                          <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed line-clamp-2">
                            {product.description}
                          </p>

                          {/* Size Selection */}
                          <div className="mt-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
                              Select Size:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {product.sizes.map((sz) => (
                                <button
                                  key={sz}
                                  type="button"
                                  onClick={() => setSelectedSizes((prev) => ({ ...prev, [product.id]: sz }))}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                                    currentSize === sz
                                      ? "bg-[#0047AB] text-white shadow-xs"
                                      : "bg-[#F7F8FA] text-[#0A0A0A] border border-[#E5E7EB] hover:border-[#0047AB]"
                                  }`}
                                >
                                  {sz}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Quantity Stepper */}
                          <div className="mt-4 flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                              Quantity:
                            </span>
                            <div className="flex items-center gap-2 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedQuantities((prev) => ({
                                    ...prev,
                                    [product.id]: Math.max(1, (prev[product.id] || 1) - 1),
                                  }))
                                }
                                className="h-6 w-6 rounded bg-white border border-[#E5E7EB] text-[#0A0A0A] font-bold text-xs hover:bg-[#E8F0FF] flex items-center justify-center transition"
                              >
                                -
                              </button>
                              <span className="text-xs font-mono font-extrabold px-1 text-[#0A0A0A]">
                                {currentQty}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedQuantities((prev) => ({
                                    ...prev,
                                    [product.id]: Math.min(10, (prev[product.id] || 1) + 1),
                                  }))
                                }
                                className="h-6 w-6 rounded bg-white border border-[#E5E7EB] text-[#0A0A0A] font-bold text-xs hover:bg-[#E8F0FF] flex items-center justify-center transition"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Price & Action Button */}
                        <div className="mt-5 pt-4 border-t border-[#E5E7EB]">
                          <div className="flex items-baseline justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xl font-extrabold text-[#0A0A0A]">
                                  ₹{(totalPaise / 100).toFixed(2)}
                                </span>
                                <span className="text-[10px] font-semibold text-[#64748B]">
                                  {isMember ? "Member Rate" : "Guest Rate"}
                                </span>
                              </div>
                              <span className="text-[10px] text-[#64748B]">
                                {isMember
                                  ? `Standard Retail: ₹${((product.guestPricePaise * currentQty) / 100).toFixed(2)}`
                                  : `Members pay ₹${((product.memberPricePaise * currentQty) / 100).toFixed(2)}`}
                              </span>
                            </div>

                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              In Stock
                            </span>
                          </div>

                          <Button
                            className="w-full text-xs font-bold bg-[#0047AB] hover:bg-[#003785] text-white shadow-xs"
                            onClick={() => handlePurchaseProduct(product)}
                          >
                            Order Now ({currentQty} {currentQty === 1 ? "Item" : "Items"}) →
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ============================================================ */}
            {/* PART B: PURCHASED MERCHANDISE ORDERS (BY NUMBER PURCHASED)    */}
            {/* ============================================================ */}
            <div className="pt-8 border-t border-[#E5E7EB] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-[#0A0A0A]">Your Purchased Merchandise</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E8F0FF] text-[#0047AB] text-xs font-extrabold border border-[#0047AB]/20">
                      {orders.reduce((sum, o) => sum + (o.quantity || 1), 0)} Items Purchased
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Physical merchandise collection items displayed according to the number of units purchased. Present your pickup slip at the Skyline Club Desk.
                  </p>
                </div>

                <div className="text-xs text-[#64748B] font-mono bg-white px-3 py-1.5 rounded-xl border border-[#E5E7EB] flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Pickup Location: West Wing Club Room 104
                </div>
              </div>

              {/* Visual Showcase: All purchased merchandise units displayed according to number purchased */}
              {orders.length > 0 && (
                <div className="rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#0047AB] bg-[#E8F0FF] px-2.5 py-0.5 rounded-full">
                        Purchased Items Showcase
                      </span>
                      <span className="text-xs text-[#64748B] font-medium">
                        ({orders.reduce((sum, o) => sum + (o.quantity || 1), 0)} Total Units Allocated)
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ✓ Ready for Club Desk Pickup
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {orders.flatMap((order) => {
                      const qty = order.quantity || 1;
                      const fallbackImg = order.itemName.toLowerCase().includes("hoodie")
                        ? "/merchandise/skyline-hoodie.jpg"
                        : order.itemName.toLowerCase().includes("t-shirt") || order.itemName.toLowerCase().includes("shirt")
                        ? "/merchandise/skyline-tshirt.jpg"
                        : "/merchandise/skyline-cap.jpg";
                      const img = order.imageUrl || fallbackImg;

                      return Array.from({ length: qty }).map((_, uIdx) => (
                        <div
                          key={`${order.id}-unit-${uIdx}`}
                          onClick={() => setInspectOrder(order)}
                          className="group/thumb cursor-pointer rounded-2xl border border-[#E5E7EB] bg-[#F7F8FA] overflow-hidden hover:border-[#0047AB] hover:shadow-md transition flex flex-col"
                        >
                          <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                            <img
                              src={img}
                              alt={`${order.itemName} Unit ${uIdx + 1}`}
                              className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-1.5 left-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-[#0047AB] text-white text-[9px] font-black shadow-xs">
                                #{uIdx + 1}/{qty}
                              </span>
                            </div>
                            <div className="absolute bottom-1.5 right-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md text-white text-[8px] font-mono font-bold">
                                {order.tier === "member" ? "MBR" : "GST"}
                              </span>
                            </div>
                          </div>
                          <div className="p-2 text-left bg-white flex-1 flex flex-col justify-between">
                            <p className="text-[11px] font-bold text-[#0A0A0A] truncate leading-tight">
                              {order.itemName}
                            </p>
                            <p className="text-[9px] text-[#64748B] mt-0.5 truncate">
                              {order.variant}
                            </p>
                            <p className="text-[9px] text-[#0047AB] font-mono font-bold mt-1">
                              View Slip →
                            </p>
                          </div>
                        </div>
                      ));
                    })}
                  </div>
                </div>
              )}

              {orders.length === 0 ? (
                /* Empty state for student with 0 orders */
                <div className="rounded-3xl border border-dashed border-[#E5E7EB] bg-white p-10 text-center shadow-xs">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F0FF] text-[#0047AB] text-2xl mb-3">
                    👕
                  </div>
                  <h4 className="text-base font-bold text-[#0A0A0A]">No Merchandise Orders Placed Yet</h4>
                  <p className="mt-1 text-xs text-[#64748B] max-w-sm mx-auto leading-relaxed">
                    Select any of the official campus apparel items above (Varsity Hoodie, Heritage T-Shirt, or Cap) to place your order.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handlePurchaseProduct(MERCHANDISE_CATALOG[0])}
                      className="text-xs bg-[#0047AB] hover:bg-[#003785] text-white"
                    >
                      + Quick Order: 1x Varsity Hoodie →
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePurchaseProduct(MERCHANDISE_CATALOG[1])}
                      className="text-xs"
                    >
                      + Quick Order: 1x Heritage T-Shirt →
                    </Button>
                  </div>
                </div>
              ) : (
                /* Purchased Orders Cards: Displays Product Picture According to Number Purchased */
                <div className="grid gap-6 md:grid-cols-2">
                  {orders.map((order) => {
                    const quantity = order.quantity || 1;
                    const fallbackImg = order.itemName.toLowerCase().includes("hoodie")
                      ? "/merchandise/skyline-hoodie.jpg"
                      : order.itemName.toLowerCase().includes("t-shirt") || order.itemName.toLowerCase().includes("shirt")
                      ? "/merchandise/skyline-tshirt.jpg"
                      : "/merchandise/skyline-cap.jpg";
                    const displayImage = order.imageUrl || fallbackImg;

                    return (
                      <div
                        key={order.id}
                        className="rounded-3xl border border-[#E5E7EB] bg-white p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition group"
                      >
                        {/* Top Order Header */}
                        <div>
                          <div className="flex items-center justify-between gap-2 border-b border-[#E5E7EB] pb-3 mb-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[#0047AB]">
                                {order.id}
                              </span>
                              <span className="text-[10px] text-[#64748B] font-mono">
                                · {order.orderDate}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                order.tier === "member"
                                  ? "bg-[#E8F0FF] text-[#0047AB]"
                                  : "bg-amber-100 text-amber-800"
                              }`}>
                                {order.tier === "member" ? "Member Rate" : "Guest Rate"}
                              </span>
                              <Badge variant="warning">Ready for Pickup</Badge>
                            </div>
                          </div>

                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-base font-bold text-[#0A0A0A] leading-snug">
                                {order.itemName}
                              </h4>
                              <p className="text-xs text-[#64748B] mt-0.5">
                                {order.variant}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#0047AB] text-white text-xs font-black shadow-xs">
                                {quantity} {quantity === 1 ? "Unit Purchased" : "Units Purchased"}
                              </span>
                            </div>
                          </div>

                          {/* ========================================================================= */}
                          {/* PRODUCT PICTURES DISPLAYED ACCORDING TO THE NUMBER OF MERCHANDISE PURCHASED */}
                          {/* ========================================================================= */}
                          <div className="mt-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-2 flex items-center justify-between">
                              <span>Allocated Items ({quantity} {quantity === 1 ? "Picture" : "Pictures"}):</span>
                              <span className="text-[#0047AB] font-mono font-bold">{order.collectionCode}</span>
                            </p>
                            
                            <div className={`grid gap-2.5 ${
                              quantity === 1
                                ? "grid-cols-1"
                                : quantity === 2
                                ? "grid-cols-2"
                                : "grid-cols-3"
                            }`}>
                              {Array.from({ length: quantity }).map((_, unitIndex) => (
                                <div
                                  key={unitIndex}
                                  className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#F7F8FA] border border-[#E5E7EB] group/pic hover:border-[#0047AB] transition shadow-xs"
                                >
                                  <img
                                    src={displayImage}
                                    alt={`${order.itemName} Unit ${unitIndex + 1} of ${quantity}`}
                                    className="w-full h-full object-cover group-hover/pic:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute top-2 left-2">
                                    <span className="px-2 py-0.5 rounded-md bg-[#0047AB] text-white text-[10px] font-black shadow-xs">
                                      Unit #{unitIndex + 1} of {quantity}
                                    </span>
                                  </div>
                                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                                    <span className="px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md text-white text-[9px] font-mono font-bold">
                                      {order.variant.split("·")[0].trim()}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/90 backdrop-blur-md text-white text-[9px] font-bold">
                                      Allocated
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Order Footer & Price */}
                        <div className="mt-5 pt-4 border-t border-[#E5E7EB] flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] text-[#64748B]">Total Paid ({quantity} {quantity === 1 ? "Item" : "Items"})</p>
                            <p className="text-lg font-extrabold text-[#0A0A0A]">
                              ₹{(order.pricePaise / 100).toFixed(2)}
                            </p>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs border-[#0047AB]/30 text-[#0047AB] hover:bg-[#E8F0FF] font-semibold"
                            onClick={() => setInspectOrder(order)}
                          >
                            Collection Slip ({order.collectionCode}) →
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: REIMBURSEMENT CLAIMS WITH REAL FILE UPLOAD */}
        {activeTab === "claims" && (
          <div className="space-y-6">
            {/* PRD Role Obligation Alert for Guest Persona (PRD §2 & §8.5) */}
            {isGuest && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 leading-relaxed flex items-start gap-3">
                <span className="text-base">⚠️</span>
                <div>
                  <p className="font-bold">Volunteer Reimbursement Policy Notice (PRD §2 & §8.5)</p>
                  <p className="mt-0.5 text-slate-700">
                    Expense claims are reserved for students with active membership assigned to verified volunteer duties.
                    As a student guest, your submitted claims will be flagged as <strong>[GUEST SUBMISSION · PENDING OFFICER VERIFICATION]</strong> in the Treasurer Review Queue.
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-8 lg:grid-cols-3">
              {/* Submit New Claim Form */}
              <div className="lg:col-span-1">
                <Card className="border border-[#E5E7EB] shadow-xs bg-white">
                  <CardHeader>
                    <CardTitle className="text-[#0A0A0A]">Submit Reimbursement</CardTitle>
                    <CardDescription className="text-[#64748B]">
                      Upload physical or electronic receipts for club-related expenses.
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    {claimSuccess && (
                      <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800">
                        ✓ Claim and receipt uploaded successfully to the Treasurer queue!
                      </div>
                    )}

                    <form onSubmit={handleClaimSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                          Expense Description
                        </label>
                        <input
                          type="text"
                          value={newClaimTitle}
                          onChange={(e) => setNewClaimTitle(e.target.value)}
                          placeholder="e.g. Workshop stationery supplies"
                          required
                          className="w-full rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-xs text-[#0A0A0A] outline-none focus:border-[#0047AB] focus:ring-2 focus:ring-[#E8F0FF]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                          Amount (₹ INR)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="1"
                          value={newClaimAmount}
                          onChange={(e) => setNewClaimAmount(e.target.value)}
                          placeholder="e.g. 350.00"
                          required
                          className="w-full rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-xs text-[#0A0A0A] outline-none focus:border-[#0047AB] focus:ring-2 focus:ring-[#E8F0FF]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                          Category
                        </label>
                        <select
                          value={newClaimCategory}
                          onChange={(e) => setNewClaimCategory(e.target.value)}
                          className="w-full rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-xs text-[#0A0A0A] outline-none focus:border-[#0047AB] focus:ring-2 focus:ring-[#E8F0FF]"
                        >
                          <option value="Supplies">Event Supplies & Stationary</option>
                          <option value="Refreshments">Refreshments & Food</option>
                          <option value="Printing">Printing & Marketing</option>
                          <option value="Travel">Local Logistics & Travel</option>
                        </select>
                      </div>

                      {/* REAL RECEIPT FILE INPUT */}
                      <div>
                        <label className="block text-xs font-semibold text-[#0A0A0A] mb-1">
                          Receipt File (JPG, PNG, PDF)
                        </label>

                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          className="hidden"
                          id="receipt-file-input"
                        />

                        {uploadedReceipt ? (
                          <div className="rounded-xl border border-[#0047AB]/20 bg-[#E8F0FF]/50 p-3.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 overflow-hidden">
                              {uploadedReceipt.type === "image" && uploadedReceipt.previewUrl ? (
                                <img
                                  src={uploadedReceipt.previewUrl}
                                  alt="Receipt thumbnail"
                                  className="h-11 w-11 rounded-lg object-cover border border-[#E5E7EB] shrink-0"
                                />
                              ) : (
                                <div className="h-11 w-11 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0">
                                  PDF
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[#0A0A0A] truncate">{uploadedReceipt.name}</p>
                                <p className="text-[10px] text-[#64748B]">{uploadedReceipt.sizeKb} KB · Ready to submit</p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setUploadedReceipt(null);
                                if (fileInputRef.current) fileInputRef.current.value = "";
                              }}
                              className="text-xs font-semibold text-rose-600 hover:text-rose-800 shrink-0 px-2 py-1"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="rounded-xl border-2 border-dashed border-[#E5E7EB] p-5 text-center cursor-pointer hover:border-[#0047AB] hover:bg-[#F7F8FA] transition"
                          >
                            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F0FF] text-[#0047AB] mb-2 font-bold">
                              📁
                            </div>
                            <span className="text-xs text-[#0047AB] font-bold hover:underline block">
                              Click to upload receipt document
                            </span>
                            <p className="text-[10px] text-[#64748B] mt-1">Supports JPG, PNG, and PDF files up to 5MB</p>
                          </div>
                        )}
                      </div>

                      <Button type="submit" className="w-full text-xs py-2.5 bg-[#0047AB] hover:bg-[#003785] text-white">
                        {isGuest ? "Submit Guest Claim with Receipt →" : "Submit Claim with Receipt →"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Submitted Claims List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#0A0A0A]">Submitted Claims History</h3>
                  <span className="text-xs text-[#64748B]">{claims.length} total claims</span>
                </div>

                {claims.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-white p-8 text-center text-[#64748B]">
                    <p className="text-sm font-semibold text-[#0A0A0A]">No reimbursement claims submitted yet.</p>
                    <p className="text-xs mt-1 text-[#64748B]">
                      Submit expense claims with receipts using the form to have them reviewed by Treasurer Varsha.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {claims.map((claim) => (
                      <div
                        key={claim.id}
                        className="rounded-2xl border border-[#E5E7EB] bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
                      >
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-xs font-bold text-[#64748B]">{claim.id}</span>
                            {claim.status === "APPROVED" && <Badge variant="success">Approved</Badge>}
                            {claim.status === "SUBMITTED" && <Badge variant="info">In Review</Badge>}
                            {claim.status === "PAID" && <Badge variant="neutral">Paid Out</Badge>}
                            {claim.status === "REJECTED" && <Badge variant="danger">Rejected</Badge>}
                            {claim.isGuestSubmission && (
                              <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                Guest Submission
                              </span>
                            )}
                          </div>
                          <h4 className="mt-1.5 text-sm font-bold text-[#0A0A0A]">{claim.title}</h4>
                          <div className="mt-1 flex items-center gap-3 text-xs text-[#64748B]">
                            <span>{claim.category}</span>
                            <span>•</span>
                            <span>Submitted {claim.submittedAt}</span>
                            <span>•</span>
                            <span className="font-mono text-[11px] text-[#0047AB]">{claim.receiptName}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-0 pt-3 sm:pt-0">
                          <div className="text-right">
                            <p className="text-base font-extrabold text-[#0A0A0A]">
                              ₹{(claim.amountPaise / 100).toFixed(2)}
                            </p>
                            <span className="text-[10px] text-[#64748B]">INR Integer Paise</span>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setInspectReceipt(claim)}
                          >
                            View Receipt
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* RECEIPT INSPECTION MODAL */}
      {inspectReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-[#E5E7EB]">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#0A0A0A]">Receipt Document</h3>
                <p className="text-xs text-[#64748B] font-mono">{inspectReceipt.receiptName}</p>
              </div>
              <button
                onClick={() => setInspectReceipt(null)}
                className="h-8 w-8 rounded-full bg-[#F7F8FA] border border-[#E5E7EB] flex items-center justify-center text-[#64748B] hover:bg-[#E5E7EB] hover:text-[#0A0A0A] font-bold"
              >
                ✕
              </button>
            </div>

            <div className="my-5">
              {inspectReceipt.receiptUrl ? (
                <img
                  src={inspectReceipt.receiptUrl}
                  alt="Receipt Document"
                  className="w-full max-h-80 object-contain rounded-xl border border-[#E5E7EB]"
                />
              ) : inspectReceipt.receiptType === "pdf" ? (
                <div className="rounded-2xl border-2 border-dashed border-[#E5E7EB] bg-[#F7F8FA] p-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 font-bold text-lg mb-3">
                    PDF
                  </div>
                  <p className="font-bold text-[#0A0A0A] text-sm">{inspectReceipt.receiptName}</p>
                  <p className="text-xs text-[#64748B] mt-1">Verified PDF electronic receipt on file.</p>
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-[#E5E7EB] bg-[#F7F8FA] p-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F0FF] text-[#0047AB] font-bold text-lg mb-3">
                    IMG
                  </div>
                  <p className="font-bold text-[#0A0A0A] text-sm">{inspectReceipt.receiptName}</p>
                  <p className="text-xs text-[#64748B] mt-1">Receipt photo attached to claim record.</p>
                </div>
              )}

              <div className="mt-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] p-3.5 text-xs text-[#0A0A0A] flex justify-between">
                <span>Total Amount: <strong>₹{(inspectReceipt.amountPaise / 100).toFixed(2)}</strong></span>
                <span>Status: <strong>{inspectReceipt.status}</strong></span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setInspectReceipt(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PASS INSPECTION MODAL (3D HOLOGRAM FOIL & FAST QR) */}
      {inspectPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-[#0A0A0A] text-white p-6 sm:p-8 shadow-2xl border border-white/10 flex flex-col items-center">
            {/* Modal Header */}
            <div className="w-full flex justify-between items-center pb-4 border-b border-white/10 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#0047AB] text-white">
                  <Ticket className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    {inspectPass.eventName}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">{inspectPass.id} · {inspectPass.venue}</p>
                </div>
              </div>

              {/* Segmented Switcher */}
              <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPassModalView("hologram")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    passModalView === "hologram"
                      ? "bg-[#0047AB] text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>3D Foil Pass</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPassModalView("qr")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    passModalView === "qr"
                      ? "bg-[#0047AB] text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Door QR</span>
                </button>
              </div>

              <button
                onClick={() => setInspectPass(null)}
                className="h-8 w-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-slate-300 hover:bg-white/20 hover:text-white font-bold ml-2"
                aria-label="Close Modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            {passModalView === "hologram" ? (
              <div className="w-full flex flex-col items-center py-4">
                <div className="w-full flex justify-center py-2">
                  <SkylineHolographicTicket
                    ticketId={inspectPass.id}
                    eventName={inspectPass.eventName.toUpperCase()}
                    attendeeName={currentUser.name.toUpperCase()}
                    venue={inspectPass.venue.toUpperCase()}
                    date={inspectPass.date.toUpperCase()}
                    time={inspectPass.time.toUpperCase()}
                    stubText={inspectPass.ticketCount === 1 ? "1 ADMIT" : `${inspectPass.ticketCount} ADMITS`}
                    barcodeNumber={inspectPass.qrCode.replace(/[^0-9]/g, "").slice(0, 6) || "912215"}
                    status={inspectPass.status}
                    tier={inspectPass.tier}
                    width={560}
                    glow={true}
                  />
                </div>
                <p className="text-xs font-mono text-cyan-300 mt-3 text-center">
                  Move your cursor or tilt your device to test holographic foil security highlights &amp; specular glare.
                </p>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center py-8">
                <div className="p-4 bg-white rounded-2xl shadow-xl mb-4">
                  <QRCode value={inspectPass.qrCode} size={220} />
                </div>
                <p className="font-mono text-base font-bold text-white tracking-widest">{inspectPass.qrCode}</p>
                <p className="text-xs text-emerald-400 font-semibold mt-1">High-Contrast Mode · Ready for Officer Camera Scan</p>
                <p className="text-[11px] text-slate-400 mt-2">
                  {inspectPass.date} · {inspectPass.time} · {inspectPass.venue}
                </p>
              </div>
            )}

            {/* Modal Footer */}
            <div className="w-full pt-4 border-t border-white/10 flex justify-between items-center text-xs text-slate-400">
              <span className="font-mono">{inspectPass.tier === "member" ? "MEMBER SUBSIDIZED RATE" : "REGULAR GUEST RATE"}</span>
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => setInspectPass(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* COLLECTION SLIP MODAL */}
      {inspectOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0A0A0A] p-6 sm:p-7 shadow-2xl border border-white/20 text-white flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div>
                <span className="text-[10px] font-mono text-cyan-300 uppercase font-bold tracking-wider">Official Pickup Voucher</span>
                <h3 className="text-base font-extrabold text-white mt-0.5">{inspectOrder.id}</h3>
              </div>
              <button
                onClick={() => setInspectOrder(null)}
                className="h-8 w-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-slate-300 hover:bg-white/20 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            {/* Product Pictures Frame Displayed According to Number Purchased */}
            <div className="w-full my-2 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold px-1">
                <span>Allocated Items ({inspectOrder.quantity || 1} {inspectOrder.quantity === 1 ? "Unit" : "Units"}):</span>
                <span className="text-cyan-300 font-mono text-[10px]">VERIFIED INVENTORY</span>
              </div>

              <div className={`grid gap-2 ${
                (inspectOrder.quantity || 1) === 1
                  ? "grid-cols-1"
                  : (inspectOrder.quantity || 1) === 2
                  ? "grid-cols-2"
                  : "grid-cols-3"
              }`}>
                {Array.from({ length: inspectOrder.quantity || 1 }).map((_, uIdx) => (
                  <div
                    key={uIdx}
                    className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black/40 border border-white/15"
                  >
                    <img
                      src={inspectOrder.imageUrl || "/merchandise/skyline-hoodie.jpg"}
                      alt={`${inspectOrder.itemName} Unit ${uIdx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded-md bg-[#0047AB] text-white text-[10px] font-black shadow-lg border border-white/20">
                        Unit #{uIdx + 1} of {inspectOrder.quantity || 1}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-white text-[9px] font-mono font-bold truncate">
                        {inspectOrder.variant.split("·")[0].trim()}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/90 text-white text-[8px] font-bold">
                        Allocated
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Collection Code & Desk QR */}
            <div className="w-full my-4 bg-white/5 rounded-2xl p-4 border border-white/10 text-center flex flex-col items-center">
              <div className="p-2 bg-white rounded-xl mb-3">
                <QRCode value={inspectOrder.collectionCode || inspectOrder.id} size={140} />
              </div>
              <span className="font-mono text-lg font-black tracking-widest text-cyan-300">
                {inspectOrder.collectionCode || inspectOrder.id}
              </span>
              <p className="text-[11px] text-slate-300 mt-1 font-semibold">
                West Wing Club Room 104 · Door Desk Verification
              </p>
            </div>

            <div className="w-full flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-white/10">
              <span>Total Paid: <strong className="text-white">₹{(inspectOrder.pricePaise / 100).toFixed(2)}</strong></span>
              <Button
                size="sm"
                className="bg-[#0047AB] text-white text-xs"
                onClick={() => setInspectOrder(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
