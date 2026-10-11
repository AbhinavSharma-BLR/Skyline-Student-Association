"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { QRCode } from "@/components/ui/QRCode";
import AdmitOneTicket, { SkylineHolographicTicket } from "@/components/ui/admit-one-3-d-holographic-ticket";
import { Ticket, Sparkles, QrCode, Maximize2, Eye, ShieldCheck, Layers, Calendar, MapPin, CheckCircle2, Loader2 } from "lucide-react";

interface PassItem {
  id: string;
  activityId?: string;
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

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string | null;
  status: "published" | "draft";
  capacity: number | null;
  seatsRemaining: number | null;
  memberPricePaise: number;
  publicPricePaise: number;
  coverImageUrl: string | null;
  createdAt: string;
}

interface MerchandiseProduct {
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

const MERCHANDISE_CATALOG: MerchandiseProduct[] = [
  {
    id: "prod-hoodie-2026",
    name: "Skyline Varsity Club Hoodie",
    description: "Premium heavyweight fleece hoodie in deep navy with bold arch lettering. Ribbed cuffs, double-lined hood & kangaroo pouch.",
    category: "Hoodies & Fleece",
    imageUrl: "/merchandise/skyline-hoodie.jpg",
    memberPricePaise: 120000, // ₹1,200.00 Member rate
    guestPricePaise: 150000,  // ₹1,500.00 Regular Guest rate (Save ₹300)
    sizes: ["M", "L", "XL"],
    color: "Deep Navy",
    badge: "Official Club Merch",
  },
  {
    id: "prod-tshirt-2026",
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
    id: "prod-cap-2026",
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
  status: "pending_collection" | "collected" | "pending_payment";
  rawStatus?: string;
  orderDate: string;
  tier: "member" | "guest";
  quantity: number;
  imageUrl: string;
  collectionCode: string;
  items?: Array<{
    name: string;
    variant: string;
    quantity: number;
    pricePaise: number;
    imageUrl: string;
  }>;
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


const MEMBER_DEFAULT_ORDERS: OrderItem[] = [
  {
    id: "ORD-MBR-9902",
    itemName: "Skyline Varsity Club Hoodie",
    variant: "Size L · Deep Navy",
    pricePaise: 120000,
    status: "pending_collection",
    rawStatus: "confirmed",
    orderDate: "05 Oct 2026",
    tier: "member",
    quantity: 1,
    imageUrl: "/merchandise/skyline-hoodie.jpg",
    collectionCode: "SK-PICKUP-9902",
    items: [
      {
        name: "Skyline Varsity Club Hoodie",
        variant: "Size L · Deep Navy",
        quantity: 1,
        pricePaise: 120000,
        imageUrl: "/merchandise/skyline-hoodie.jpg",
      },
    ],
  },
];

const MEMBER_DEFAULT_CLAIMS: ClaimItem[] = [
  {
    id: "CLM-104",
    title: "Markers & Chart Papers for Tech Workshop",
    amountPaise: 38000,
    category: "Supplies",
    submittedAt: "08 Oct 2026",
    status: "APPROVED",
    receiptName: "receipt_workshop_markers.jpg",
    receiptType: "image",
    isGuestSubmission: false,
  },
];

export default function StudentWorkspacePage() {
  const { currentUser, isAuthenticated, canAccessDesk, payDues, logout, duesFormatted, activePeriod } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "events" | "passes" | "orders" | "claims">("overview");

  // Dynamic user-scoped state
  const isMember = currentUser?.isMember ?? false;
  const isGuest = !isMember;

  const [passes, setPasses] = useState<PassItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [claims, setClaims] = useState<ClaimItem[]>([]);

  // Activities state
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [eventsFilter, setEventsFilter] = useState<"all" | "upcoming" | "past">("all");
  const [eventsPage, setEventsPage] = useState(1);
  const EVENTS_PAGE_SIZE = 6;

  const filteredActivities = useMemo(() => {
    const now = new Date();
    const sorted = [...activities].sort((a, b) => {
      const isPastA = a.startsAt ? new Date(a.startsAt) < now : false;
      const isPastB = b.startsAt ? new Date(b.startsAt) < now : false;
      if (isPastA === isPastB) {
        const timeA = a.startsAt ? new Date(a.startsAt).getTime() : 0;
        const timeB = b.startsAt ? new Date(b.startsAt).getTime() : 0;
        return isPastA ? timeB - timeA : timeA - timeB;
      }
      return isPastA ? 1 : -1;
    });

    if (eventsFilter === "upcoming") {
      return sorted.filter((act) => act.startsAt ? new Date(act.startsAt) >= now : true);
    }
    if (eventsFilter === "past") {
      return sorted.filter((act) => act.startsAt ? new Date(act.startsAt) < now : false);
    }
    return sorted;
  }, [activities, eventsFilter]);

  const totalEventPages = Math.ceil(filteredActivities.length / EVENTS_PAGE_SIZE) || 1;
  const safeEventPage = Math.min(eventsPage, totalEventPages);
  const paginatedActivities = useMemo(() => {
    return filteredActivities.slice(
      (safeEventPage - 1) * EVENTS_PAGE_SIZE,
      safeEventPage * EVENTS_PAGE_SIZE
    );
  }, [filteredActivities, safeEventPage, EVENTS_PAGE_SIZE]);

  // Booking and Demo Payment flow state
  const [bookingActivityId, setBookingActivityId] = useState<string | null>(null);
  const [pendingBooking, setPendingBooking] = useState<{ booking: any; activity: ActivityItem } | null>(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [justBookedTicketId, setJustBookedTicketId] = useState<string | null>(null);

  // Merchandise submission state
  const [submittingProductId, setSubmittingProductId] = useState<string | null>(null);
  const [merchErrors, setMerchErrors] = useState<Record<string, string | null>>({});
  const [merchPurchaseSuccess, setMerchPurchaseSuccess] = useState<string | null>(null);

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
  const [passModalView, setPassModalView] = useState<"hologram" | "qr">("qr");
  const [activeHoloIndex, setActiveHoloIndex] = useState(0);

  // Merchandise Shop Selection State
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({
    "prod-hoodie-2026": "L",
    "prod-tshirt-2026": "M",
    "prod-cap-2026": "One Size",
  });
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({
    "prod-hoodie-2026": 1,
    "prod-tshirt-2026": 1,
    "prod-cap-2026": 1,
  });
  const [inspectOrder, setInspectOrder] = useState<OrderItem | null>(null);
  const [mounted, setMounted] = useState(false);
  const [memberIntentNotice, setMemberIntentNotice] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const tabParam = url.searchParams.get("tab");
      const sectionParam = url.searchParams.get("section") || url.hash;
      const intentParam = url.searchParams.get("intent");

      if (tabParam && ["overview", "events", "passes", "orders", "claims"].includes(tabParam)) {
        setActiveTab(tabParam as any);
      }

      if (intentParam === "member" || sectionParam === "dues" || sectionParam === "#annual-dues-card") {
        setActiveTab("overview");
        setMemberIntentNotice(true);
        setTimeout(() => {
          const el = document.getElementById("annual-dues-card");
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("ring-2", "ring-[#0047AB]", "ring-offset-2");
            setTimeout(() => {
              el.classList.remove("ring-2", "ring-[#0047AB]", "ring-offset-2");
            }, 3000);
          }
        }, 400);
      }
    }
  }, []);

  // Modal accessibility: background scroll lock and Escape key listener
  useEffect(() => {
    if (!inspectOrder && !inspectPass && !pendingBooking && !inspectReceipt) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (inspectOrder) setInspectOrder(null);
        if (inspectPass) setInspectPass(null);
        if (pendingBooking && !confirmingPayment) setPendingBooking(null);
        if (inspectReceipt) setInspectReceipt(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [inspectOrder, inspectPass, pendingBooking, inspectReceipt, confirmingPayment]);

  // Fetch activities from API
  const loadActivities = useCallback(async () => {
    setLoadingActivities(true);
    setActivitiesError(null);
    try {
      const res = await fetch("/api/v1/activities");
      if (!res.ok) throw new Error("Failed to load club events");
      const json = await res.json();
      setActivities(json.data || []);
    } catch (err: any) {
      console.error("Activities load error:", err);
      setActivitiesError(err.message || "Could not load campus events");
    } finally {
      setLoadingActivities(false);
    }
  }, []);

  // Fetch user tickets from API
  const loadTickets = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/v1/tickets/me");
      if (!res.ok) return;
      const json = await res.json();
      if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
        const livePasses: PassItem[] = json.data.map((t: any) => ({
          id: t.id,
          activityId: t.activityId || t.activity?.id,
          eventName: t.activity?.title || "Campus Event",
          date: t.activity?.startsAt
            ? new Date(t.activity.startsAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
            : "15 Nov 2026",
          time: t.activity?.startsAt
            ? new Date(t.activity.startsAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
            : "09:00 AM",
          venue: t.activity?.location || "Skyline Campus",
          ticketCount: 1,
          qrCode: t.encryptedToken || t.id,
          status: t.isUsed ? "checked_in" : "valid",
          tier: currentUser.isMember ? "member" : "guest",
          pricePaidPaise: 0,
        }));
        setPasses(livePasses);
      } else {
        setPasses([]);
      }
    } catch {
      setPasses([]);
    }
  }, [currentUser]);

  // Fetch user orders from API
  const loadUserOrders = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/v1/orders/me");
      if (!res.ok) return;
      const json = await res.json();
      if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
        const liveOrders: OrderItem[] = json.data.map((o: any) => {
          const rawItems = Array.isArray(o.items) ? o.items : [];
          const parsedItems = rawItems.map((it: any) => {
            const itName = it.variant?.product?.name || "Official Merchandise";
            const itImg = it.variant?.product?.imagePath || (
              itName.toLowerCase().includes("hoodie")
                ? "/merchandise/skyline-hoodie.jpg"
                : itName.toLowerCase().includes("t-shirt") || itName.toLowerCase().includes("shirt")
                ? "/merchandise/skyline-tshirt.jpg"
                : "/merchandise/skyline-cap.jpg"
            );
            const sizeLabel = it.variant?.label || it.variant?.size || "Standard";
            return {
              name: itName,
              variant: sizeLabel === "One Size" ? "Adjustable · Official" : `Size ${sizeLabel} · Official`,
              quantity: it.quantity || 1,
              pricePaise: Number(it.unitPricePaise || 0) * (it.quantity || 1),
              imageUrl: itImg,
            };
          });

          const firstItem = rawItems[0];
          const itemName = firstItem?.variant?.product?.name || "Official Merchandise";
          const fallbackImg = itemName.toLowerCase().includes("hoodie")
            ? "/merchandise/skyline-hoodie.jpg"
            : itemName.toLowerCase().includes("t-shirt") || itemName.toLowerCase().includes("shirt")
            ? "/merchandise/skyline-tshirt.jpg"
            : "/merchandise/skyline-cap.jpg";
          const totalQty = rawItems.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0) || 1;
          const sizeLabel = firstItem?.variant?.label || firstItem?.variant?.size || "Standard";

          return {
            id: o.id,
            itemName,
            variant: sizeLabel === "One Size" ? "Adjustable · Official" : `Size ${sizeLabel} · Official`,
            pricePaise: o.totalPaise || 0,
            status: o.status === "fulfilled" ? "collected" : o.status === "confirmed" ? "pending_collection" : "pending_payment",
            rawStatus: o.status,
            orderDate: new Date(o.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
            tier: currentUser.isMember ? "member" : "guest",
            quantity: totalQty,
            imageUrl: firstItem?.variant?.product?.imagePath || fallbackImg,
            collectionCode: `SK-${o.id.slice(-6).toUpperCase()}`,
            items: parsedItems.length > 0 ? parsedItems : [
              {
                name: itemName,
                variant: sizeLabel === "One Size" ? "Adjustable · Official" : `Size ${sizeLabel} · Official`,
                quantity: totalQty,
                pricePaise: o.totalPaise || 0,
                imageUrl: firstItem?.variant?.product?.imagePath || fallbackImg,
              }
            ],
          };
        });
        setOrders(liveOrders);
      } else if (currentUser.isMember) {
        setOrders(MEMBER_DEFAULT_ORDERS);
      } else {
        setOrders([]);
      }
    } catch {
      if (currentUser.isMember) setOrders(MEMBER_DEFAULT_ORDERS);
      else setOrders([]);
    }
  }, [currentUser]);

  // Fetch user claims from API (members only)
  const loadClaims = useCallback(async () => {
    if (!currentUser || !currentUser.isMember) {
      setClaims([]);
      return;
    }
    try {
      const res = await fetch("/api/v1/claims/me");
      if (!res.ok) return;
      const json = await res.json();
      if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
        const liveClaims: ClaimItem[] = json.data.map((c: any) => ({
          id: c.id,
          title: c.title,
          amountPaise: c.amountPaise,
          category: "Reimbursement",
          submittedAt: new Date(c.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          status: (c.status?.toUpperCase() || "SUBMITTED") as any,
          receiptName: c.hasReceipt ? "receipt.jpg" : "no_receipt",
          receiptType: c.receiptMimeType === "application/pdf" ? "pdf" : "image",
          receiptUrl: c.hasReceipt ? (c.receiptUrl || `/api/v1/claims/${c.id}/receipt`) : undefined,
        }));
        setClaims(liveClaims);
      } else {
        setClaims(MEMBER_DEFAULT_CLAIMS);
      }
    } catch {
      setClaims(MEMBER_DEFAULT_CLAIMS);
    }
  }, [currentUser]);

  // Synchronize data on mount / user change
  useEffect(() => {
    if (!currentUser) {
      setPasses([]);
      setOrders([]);
      setClaims([]);
      return;
    }

    loadActivities();
    loadTickets();
    loadUserOrders();
    loadClaims();
  }, [currentUser, loadActivities, loadTickets, loadUserOrders, loadClaims]);

  // Helper for Requirement 6: Navigate to Guest Pass & Dues and scroll activation card into view
  const navigateToDues = () => {
    setActiveTab("overview");
    setTimeout(() => {
      const el = document.getElementById("annual-dues-card");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  // Event Booking Workflow (Requirements 3 & 4)
  const handleStartBooking = async (event: ActivityItem) => {
    if (bookingActivityId) return;
    setBookingActivityId(event.id);

    try {
      const res = await fetch("/api/v1/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId: event.id }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson?.error?.message || "Failed to reserve ticket for this event");
        setBookingActivityId(null);
        return;
      }

      const json = await res.json();
      const booking = json.data;

      if (booking.amountPaise === 0) {
        // Free event: confirm immediately
        await confirmBookingTicket(booking.id);
      } else {
        // Paid event: open clearly labelled demo payment confirmation modal
        setPendingBooking({ booking, activity: event });
      }
    } catch (err: any) {
      console.error("Booking error:", err);
      alert(err.message || "Network error while reserving ticket");
    } finally {
      setBookingActivityId(null);
    }
  };

  const confirmBookingTicket = async (bookingId: string) => {
    setConfirmingPayment(true);
    try {
      const paymentRef = `pay_demo_${Date.now()}`;
      const res = await fetch(`/api/v1/bookings/${bookingId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentRef }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson?.error?.message || "Failed to confirm booking payment");
        return;
      }

      const json = await res.json();
      const issuedTicket = json.data.ticket;

      // Mark newly issued ticket for "Booked Ticket" badge
      setJustBookedTicketId(issuedTicket.id);

      // Refresh tickets from server
      await loadTickets();

      // Close modal
      setPendingBooking(null);

      // Activate My Tickets tab
      setActiveTab("passes");
    } catch (err: any) {
      console.error("Confirm error:", err);
      alert(err.message || "Network error confirming ticket payment");
    } finally {
      setConfirmingPayment(false);
    }
  };

  // Real Merchandise Ordering Workflow (Requirement 3 & 7)
  const handlePurchaseProduct = async (product: MerchandiseProduct) => {
    // Prevent double-clicks or multiple simultaneous orders
    if (submittingProductId) return;

    // Snapshot the selected product, variant and quantity when submitting
    const productId = product.id;
    const snapshotSize = selectedSizes[productId] || product.sizes[0];
    const snapshotQty = selectedQuantities[productId] || 1;

    // Clear prior error on this product card
    setMerchErrors((prev) => ({ ...prev, [productId]: null }));
    setSubmittingProductId(productId);

    try {
      // Fetch active products from backend
      const prodsRes = await fetch("/api/v1/products");
      if (!prodsRes.ok) throw new Error("Could not load products catalog");
      const prodsJson = await prodsRes.json();
      const dbProds = prodsJson.data || [];

      // Find matching product
      const dbProd = dbProds.find((p: any) =>
        p.id === productId ||
        p.name.toLowerCase().includes(product.name.toLowerCase().split(" ")[1] || "")
      ) || dbProds[0];

      if (!dbProd || !dbProd.variants || dbProd.variants.length === 0) {
        throw new Error("No inventory available for this product");
      }

      // Find matching size variant from snapshot
      const dbVariant = dbProd.variants.find((v: any) => v.size === snapshotSize) || dbProd.variants[0];

      // Submit only snapshotted variant and quantity
      const orderRes = await fetch("/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ variantId: dbVariant.id, quantity: snapshotQty }],
        }),
      });

      if (!orderRes.ok) {
        const errJson = await orderRes.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || "Failed to create merchandise reservation");
      }

      const orderJson = await orderRes.json();
      const createdOrder = orderJson.data;

      // Confirm demo payment through backend
      const confirmRes = await fetch(`/api/v1/orders/${createdOrder.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentRef: `pay_demo_${Date.now()}` }),
      });

      if (!confirmRes.ok) {
        const errJson = await confirmRes.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || "Failed to confirm merchandise payment");
      }

      // Refresh real orders and stock from backend
      await loadUserOrders();
      setMerchPurchaseSuccess(`✓ Confirmed purchase of ${snapshotQty}x ${product.name}! Collection Slip generated.`);
      setTimeout(() => setMerchPurchaseSuccess(null), 5000);
    } catch (err: any) {
      console.error("Merch purchase error:", err);
      // Display error specifically on the active product card
      setMerchErrors((prev) => ({
        ...prev,
        [productId]: err.message || "Failed to complete merchandise purchase",
      }));
    } finally {
      setSubmittingProductId(null);
    }
  };

  // Handle local file selection for volunteer claims
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

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClaimTitle || !newClaimAmount) return;

    const amountInPaise = Math.round(parseFloat(newClaimAmount) * 100);

    try {
      const res = await fetch("/api/v1/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newClaimTitle,
          description: `Category: ${newClaimCategory}. Volunteer expense reimbursement.`,
          amountPaise: amountInPaise,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson?.error?.message || "Failed to submit claim to backend");
        return;
      }

      const json = await res.json();
      const created = json?.data;

      // Upload attached physical receipt file if present
      if (created?.id && uploadedReceipt?.file) {
        try {
          const formData = new FormData();
          formData.append("file", uploadedReceipt.file);
          await fetch(`/api/v1/claims/${created.id}/receipt`, {
            method: "POST",
            body: formData,
          });
        } catch (uploadErr) {
          console.error("Failed to attach receipt to claim:", uploadErr);
        }
      }

      const newClaim: ClaimItem = {
        id: created?.id || `CLM-${Math.floor(100 + Math.random() * 900)}`,
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

      setClaims((prev) => [newClaim, ...prev]);
      setNewClaimTitle("");
      setNewClaimAmount("");
      setUploadedReceipt(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setClaimSuccess(true);
      setTimeout(() => setClaimSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to submit claim:", err);
      alert("Network error submitting claim");
    }
  };

  // Filter confirmed vs pending merchandise orders (Requirement 7)
  const confirmedOrders = orders.filter(
    (o) => o.rawStatus === "confirmed" || o.rawStatus === "fulfilled" || o.status === "pending_collection" || o.status === "collected"
  );
  const pendingOrders = orders.filter(
    (o) => o.rawStatus === "pending_payment" || o.status === "pending_payment"
  );

  // Tab navigation definition strictly adhering to Requirement 2
  const navTabs = isGuest
    ? [
        { id: "overview", label: "Guest Pass & Dues" },
        { id: "events", label: "Events" },
        { id: "passes", label: `My Tickets (${passes.length})` },
        { id: "orders", label: `Merch Orders (${confirmedOrders.length})` },
      ]
    : [
        { id: "overview", label: "Membership Card" },
        { id: "events", label: "Events" },
        { id: "passes", label: `My Tickets (${passes.length})` },
        { id: "orders", label: `Merch Orders (${orders.length})` },
        { id: "claims", label: `Reimbursements (${claims.length})` },
      ];

  // UNAUTHENTICATED SESSION GUARD
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex flex-col font-sans selection:bg-[#E8F0FF] selection:text-[#0047AB]">
        {/* Sticky Top Header with Back to Home Navigation */}
        <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="w-8 h-8 rounded-lg bg-[#0047AB] text-white flex items-center justify-center font-bold text-base transition group-hover:scale-105">
                S
              </span>
              <span className="text-xl font-bold tracking-tight text-[#0A0A0A]">
                Skyline<span className="text-[#0047AB]">.</span>
              </span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#64748B] hover:text-[#0047AB] transition px-3 py-1.5 rounded-lg hover:bg-[#F7F8FA]"
            >
              ← Back to Home
            </Link>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
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
              registered event tickets, and merchandise orders.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link href="/login">
                <Button className="w-full bg-[#0047AB] hover:bg-[#003785] text-white">Sign in to Skyline</Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline" className="w-full">Create New Account</Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" className="w-full text-xs text-[#64748B] hover:text-[#0A0A0A] font-semibold">
                  ← Back to Home Page
                </Button>
              </Link>
            </div>
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
            <Link href={canAccessDesk ? "/desk" : "/me"} className="flex items-center gap-2 group" title="Return to Dashboard">
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
            <div className="hidden md:flex items-center gap-1.5 bg-[#F7F8FA] px-3 py-1.5 rounded-xl border border-[#E5E7EB]">
              <span className={`w-2 h-2 rounded-full ${isMember ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
              <span className="text-[11px] font-bold text-[#0A0A0A]">
                {isMember ? "Active Member Pass" : "Guest Pass (Dues Pending)"}
              </span>
            </div>

            {canAccessDesk && (
              <Link
                href="/desk"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A0A0A] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#262626]"
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
        {/* REQUIREMENT 1: CLEAN GUEST HEADER */}
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
                  </div>
                  <h2 className="mt-1.5 text-lg font-extrabold text-[#0A0A0A]">
                    Your account is registered, but membership dues have not been paid yet.
                  </h2>
                  <p className="mt-1 text-xs text-[#64748B] max-w-2xl leading-relaxed">
                    As a student guest, you can purchase tickets and official merchandise at standard non-member prices.
                    To unlock discounted ticket prices, exclusive merch rates, and verified express door check-in, activate your 2026 membership today.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Button
                  onClick={payDues}
                  className="bg-[#0047AB] hover:bg-[#003785] text-white shadow-xs text-xs font-bold py-2.5 px-4"
                >
                  ⚡ Activate Membership ({duesFormatted}) →
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Header (Requirement 1: "Welcome, Guest!" exactly for guest) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A0A0A]">
                {isGuest ? "Welcome, Guest!" : `Welcome back, ${currentUser.name.split(" ")[0]}!`}
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
            <div className="flex md:hidden items-center gap-1.5 bg-[#F7F8FA] px-2.5 py-1 rounded-lg border border-[#E5E7EB] text-[11px] font-bold text-[#0A0A0A]">
              <span className={`w-2 h-2 rounded-full ${isMember ? "bg-emerald-500" : "bg-amber-500"}`} />
              <span>{isMember ? "Active Member" : "Guest"}</span>
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

        {/* Tab Navigation (Requirement 2: Exact tab ordering for Guest & Member) */}
        <div className="flex border-b border-[#E5E7EB] gap-2 sm:gap-6 mb-8 overflow-x-auto pb-px">
          {navTabs.map((tab) => (
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

        {/* ============================================================ */}
        {/* TAB 1: MEMBERSHIP CARD & DUES STATUS                         */}
        {/* ============================================================ */}
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
                      TIER: MEMBER · EMAIL: {currentUser.email} ({currentUser.emailVerified ? "VERIFIED" : "PENDING VERIFICATION"})
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
                          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span> Dues Pending ({duesFormatted})
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-[#E5E7EB] pt-6 gap-4">
                    <div className="text-xs text-[#64748B] font-mono">
                      TIER: GUEST-NON-MEMBER · EMAIL: {currentUser.email} ({currentUser.emailVerified ? "VERIFIED" : "PENDING VERIFICATION"})
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
                            Active: Subsidized ticket pricing on all campus summits and workshops.
                          </span>
                        ) : (
                          <span className="text-[#64748B]">
                            Locked: Currently paying regular guest prices on tickets.
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
                            Active: Member exclusive discounts on all official club apparel.
                          </span>
                        ) : (
                          <span className="text-[#64748B]">
                            Locked: Official merchandise available at standard guest rate.
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

            {/* Dues Status / Payment Checkout Panel (Requirement 6 target: #annual-dues-card) */}
            <div>
              <Card id="annual-dues-card" className="h-full flex flex-col justify-between border-[#E5E7EB] bg-white shadow-xs">
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
                      Academic Year 2026 Membership Period
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="rounded-2xl bg-[#F7F8FA] p-4 border border-[#E5E7EB]">
                      <div className="flex justify-between items-center text-sm font-semibold text-[#0A0A0A]">
                        <span>Standard Annual Dues</span>
                        <span className="text-lg font-black text-[#0A0A0A]">{duesFormatted}</span>
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
                          Your annual dues of <strong>{duesFormatted}</strong> are recorded in the Skyline Club Ledger. Your digital membership pass is valid for the academic period.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-6 space-y-4">
                        {memberIntentNotice && (
                          <div className="rounded-2xl bg-blue-50 p-4 border border-blue-200 text-xs text-[#0047AB] space-y-1">
                            <p className="font-bold">Membership Activation Required</p>
                            <p className="text-[11px] text-[#0047AB]/90 leading-relaxed">
                              You selected student member access during registration. Membership benefits, subsidized event tickets, and apparel discounts activate after successful dues payment below.
                            </p>
                          </div>
                        )}
                        <div className="rounded-2xl bg-amber-50/80 p-4 border border-amber-200 text-xs text-amber-900 space-y-2">
                          <p className="font-bold">Why activate now?</p>
                          <ul className="space-y-1 text-[#0A0A0A] list-disc pl-4 text-[11px]">
                            <li>Save up to ₹250 on campus hackathons &amp; summits</li>
                            <li>Save up to ₹300 on official varsity apparel</li>
                            <li>Express priority check-in at all club activities</li>
                            <li className="font-bold text-emerald-700">Immediate savings on your first registration</li>
                          </ul>
                        </div>

                        <Button
                          onClick={payDues}
                          className="w-full bg-[#0047AB] hover:bg-[#003785] text-white shadow-xs py-3 text-xs font-bold"
                        >
                          ⚡ Pay Dues ({duesFormatted}) & Activate →
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </div>

                <div className="p-6 pt-0 text-[11px] text-[#64748B]">
                  Payments are simulated securely via the Skyline Demo Payment Adapter.
                </div>
              </Card>
            </div>

            {/* REQUIREMENT 7: Purchased Merchandise Overview Section strictly shown when confirmedOrders > 0 */}
            {confirmedOrders.length > 0 && (
              <div className="lg:col-span-3 rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-[#0A0A0A]">Your Purchased Merchandise</h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#E8F0FF] text-[#0047AB] text-xs font-black border border-[#0047AB]/20">
                        {confirmedOrders.reduce((sum, o) => sum + (o.quantity || 1), 0)} Units Ready for Pickup
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

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {confirmedOrders.flatMap((order) => {
                    const qty = order.quantity || 1;
                    return Array.from({ length: qty }).map((_, uIdx) => (
                      <div
                        key={`${order.id}-ov-unit-${uIdx}`}
                        onClick={() => setInspectOrder(order)}
                        className="group/ov cursor-pointer rounded-2xl border border-[#E5E7EB] bg-[#F7F8FA] overflow-hidden hover:border-[#0047AB] hover:shadow-md transition flex flex-col"
                      >
                        <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                          <img
                            src={order.imageUrl}
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

        {/* ============================================================ */}
        {/* TAB 2: REAL EVENTS SECTION (REQUIREMENT 3 & 4)              */}
        {/* ============================================================ */}
        {activeTab === "events" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#0A0A0A]">Campus Club Events</h2>
                <p className="text-sm text-[#64748B]">
                  Explore and reserve tickets for upcoming Skyline Student Association summits, workshops, and cultural nights.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-[#F7F8FA] p-1 rounded-xl border border-[#E5E7EB]">
                  {(
                    [
                      { id: "all", label: `All Events (${activities.length})` },
                      { id: "upcoming", label: "Upcoming" },
                      { id: "past", label: "Past Events" },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setEventsFilter(f.id);
                        setEventsPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        eventsFilter === f.id
                          ? "bg-white text-[#0047AB] border border-[#E5E7EB] shadow-2xs"
                          : "text-[#64748B] hover:text-[#0A0A0A]"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadActivities}
                  disabled={loadingActivities}
                  className="self-start sm:self-auto text-xs"
                >
                  {loadingActivities ? "Refreshing..." : "↻ Refresh Events"}
                </Button>
              </div>
            </div>

            {/* Loading Indicator */}
            {loadingActivities && (
              <div className="grid gap-6 md:grid-cols-2">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse rounded-3xl border border-[#E5E7EB] bg-white p-6 h-64" />
                ))}
              </div>
            )}

            {/* Error with Retry */}
            {!loadingActivities && activitiesError && (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-900">
                <p className="font-bold text-sm">{activitiesError}</p>
                <p className="text-xs text-rose-700 mt-1">Could not fetch events from the activities service.</p>
                <Button onClick={loadActivities} className="mt-4 text-xs bg-[#0047AB] hover:bg-[#003785] text-white">
                  Retry Loading Events
                </Button>
              </div>
            )}

            {/* Empty Events List */}
            {!loadingActivities && !activitiesError && filteredActivities.length === 0 && (
              <div className="rounded-3xl border border-dashed border-[#E5E7EB] bg-white p-12 text-center shadow-xs">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F0FF] text-[#0047AB] text-3xl mb-4">
                  📅
                </div>
                <h3 className="text-lg font-bold text-[#0A0A0A]">No Events Found</h3>
                <p className="mt-2 text-xs text-[#64748B] max-w-md mx-auto leading-relaxed">
                  No campus events match your selected filter. Try selecting &quot;All Events&quot; or check back soon!
                </p>
              </div>
            )}

            {/* Published Events Grid */}
            {!loadingActivities && !activitiesError && filteredActivities.length > 0 && (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                {paginatedActivities.map((event) => {
                  const isPast = event.startsAt ? new Date(event.startsAt) < new Date() : false;
                  const isSoldOut = event.seatsRemaining !== null && event.seatsRemaining <= 0;
                  const guestPrice = event.publicPricePaise / 100;
                  const memberPrice = event.memberPricePaise / 100;
                  const savings = guestPrice - memberPrice;
                  const isBooked = passes.some((p) => p.activityId === event.id || p.eventName === event.title);
                  const isGala = event.id === "evt-02";
                  const fallbackCover = isGala
                    ? "/events/music-festival-stage.jpg"
                    : event.id === "evt-01" || event.title.toLowerCase().includes("summit")
                    ? "/events/tech-summit.jpg"
                    : event.id === "activity-hackathon-2026" || (event.title.toLowerCase().includes("hackathon") && !event.title.toLowerCase().includes("sprint"))
                    ? "/events/hackathon.jpg"
                    : event.id === "evt-03" || event.title.toLowerCase().includes("case") || event.title.toLowerCase().includes("sprint")
                    ? "/events/case-sprint.jpg"
                    : "/events/tech-summit.jpg";
                  const coverImg = isGala ? "/events/music-festival-stage.jpg" : (event.coverImageUrl || fallbackCover);

                  const dateFormatted = event.startsAt
                    ? new Date(event.startsAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                    : "TBA";
                  const timeFormatted = event.startsAt
                    ? new Date(event.startsAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
                    : "";

                  if (isGala) {
                    return (
                      <div
                        key={event.id}
                        className="rounded-3xl border border-violet-500/40 bg-gradient-to-br from-[#12072B] via-[#1E0B36] to-[#0D041A] text-white overflow-hidden shadow-xl hover:shadow-2xl hover:border-fuchsia-400/60 transition-all flex flex-col justify-between group relative"
                      >
                        {/* Stage Light Gradients */}
                        <div className="absolute -top-16 -right-16 w-56 h-56 bg-gradient-to-br from-fuchsia-500/30 to-violet-600/20 blur-3xl rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-500" />
                        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-gradient-to-tr from-amber-500/20 to-rose-600/20 blur-3xl rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-500" />

                        {/* Event Cover Image */}
                        <div className="relative aspect-[16/9] w-full bg-[#1A0B2E] overflow-hidden border-b border-violet-500/30">
                          <img
                            src={coverImg}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-3 left-3 flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-[10px] font-bold text-fuchsia-200 shadow-xs border border-fuchsia-400/30">
                              📍 {event.location}
                            </span>
                          </div>
                          <div className="absolute top-3 right-3 flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white text-[10px] font-extrabold shadow-xs">
                              🎵 Live Music Festival
                            </span>
                          </div>
                        </div>

                        {/* Event Body */}
                        <div className="p-6 flex-1 flex flex-col justify-between relative z-10">
                          <div>
                            <div className="flex items-center gap-2 text-xs text-fuchsia-300 font-semibold mb-1">
                              <span>🗓️ {dateFormatted}</span>
                              {timeFormatted && <span>· ⏰ {timeFormatted}</span>}
                            </div>
                            <h3 className="text-lg font-black text-white leading-snug drop-shadow-sm">{event.title}</h3>
                            <p className="text-xs text-slate-300 mt-2 leading-relaxed line-clamp-3">
                              {event.description}
                            </p>
                          </div>

                          {/* Pricing & Booking Footer */}
                          <div className="mt-6 pt-4 border-t border-violet-500/30">
                            <div className="flex items-baseline justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-2xl font-black text-white">
                                    ₹{isMember ? memberPrice.toFixed(0) : guestPrice.toFixed(0)}
                                  </span>
                                  <span className="text-[11px] font-semibold text-violet-200">
                                    {isMember ? "Member Rate" : "Guest Rate"}
                                  </span>
                                </div>
                                {savings > 0 && (
                                  <p className="text-[11px] text-amber-300 font-semibold mt-0.5">
                                    {isMember
                                      ? `You save ₹${savings.toFixed(0)} with active membership`
                                      : `Member Price: ₹${memberPrice.toFixed(0)} (Save ₹${savings.toFixed(0)})`}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              {isBooked ? (
                                <Button
                                  size="sm"
                                  onClick={() => setActiveTab("passes")}
                                  className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs font-bold py-2.5 px-5 shadow-xs"
                                >
                                  ✓ View Ticket →
                                </Button>
                              ) : isPast ? (
                                <Button size="sm" disabled className="bg-slate-800 text-slate-500 text-xs font-bold py-2.5 px-4 cursor-not-allowed">
                                  Event Concluded
                                </Button>
                              ) : isSoldOut ? (
                                <Button size="sm" disabled className="bg-rose-950 text-rose-400 text-xs font-bold py-2.5 px-4 cursor-not-allowed">
                                  Sold Out
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  disabled={Boolean(bookingActivityId)}
                                  onClick={() => handleStartBooking(event)}
                                  className="bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 hover:from-fuchsia-500 hover:via-violet-500 hover:to-indigo-500 text-white text-xs font-extrabold py-2.5 px-5 shadow-md shadow-fuchsia-950/60 border border-fuchsia-400/40 transition-all"
                                >
                                  {bookingActivityId === event.id
                                    ? "Reserving..."
                                    : `Book Ticket · ₹${(isMember ? memberPrice : guestPrice).toFixed(0)}`}
                                </Button>
                              )}

                              {isGuest && savings > 0 && !isBooked && (
                                <button
                                  type="button"
                                  onClick={navigateToDues}
                                  className="text-xs font-bold text-amber-300 hover:text-amber-200 hover:underline text-left sm:text-right"
                                >
                                  ⚡ Activate Membership to Save ₹{savings.toFixed(0)} →
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={event.id}
                      className="rounded-3xl border border-[#E5E7EB] bg-white overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group"
                    >
                      {/* Event Cover Image */}
                      <div className="relative aspect-[16/9] w-full bg-[#F7F8FA] overflow-hidden border-b border-[#E5E7EB]">
                        <img
                          src={coverImg}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-bold text-[#0A0A0A] shadow-xs border border-black/5">
                            📍 {event.location}
                          </span>
                        </div>
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          {isSoldOut ? (
                            <span className="px-2.5 py-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold shadow-xs">
                              Sold Out
                            </span>
                          ) : isPast ? (
                            <span className="px-2.5 py-1 rounded-full bg-slate-600 text-white text-[10px] font-extrabold shadow-xs">
                              Past Event
                            </span>
                          ) : event.seatsRemaining !== null ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold shadow-xs">
                              {event.seatsRemaining} Seats Remaining
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold shadow-xs">
                              Available
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Event Body */}
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-xs text-[#0047AB] font-semibold mb-1">
                            <span>🗓️ {dateFormatted}</span>
                            {timeFormatted && <span>· ⏰ {timeFormatted}</span>}
                          </div>
                          <h3 className="text-lg font-bold text-[#0A0A0A] leading-snug">{event.title}</h3>
                          <p className="text-xs text-[#64748B] mt-2 leading-relaxed line-clamp-3">
                            {event.description}
                          </p>
                        </div>

                        {/* Pricing & Booking Footer */}
                        <div className="mt-6 pt-4 border-t border-[#E5E7EB]">
                          <div className="flex items-baseline justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-2xl font-black text-[#0A0A0A]">
                                  ₹{isMember ? memberPrice.toFixed(0) : guestPrice.toFixed(0)}
                                </span>
                                <span className="text-[11px] font-semibold text-[#64748B]">
                                  {isMember ? "Member Rate" : "Guest Rate"}
                                </span>
                              </div>
                              {savings > 0 && (
                                <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                                  {isMember
                                    ? `You save ₹${savings.toFixed(0)} with active membership`
                                    : `Member Price: ₹${memberPrice.toFixed(0)} (Save ₹${savings.toFixed(0)})`}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            {isBooked ? (
                              <Button
                                size="sm"
                                onClick={() => setActiveTab("passes")}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-5 shadow-xs"
                              >
                                ✓ View Ticket →
                              </Button>
                            ) : isPast ? (
                              <Button size="sm" disabled className="bg-slate-200 text-slate-500 text-xs font-bold py-2.5 px-4 cursor-not-allowed">
                                Event Concluded
                              </Button>
                            ) : isSoldOut ? (
                              <Button size="sm" disabled className="bg-rose-100 text-rose-600 text-xs font-bold py-2.5 px-4 cursor-not-allowed">
                                Sold Out
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                disabled={Boolean(bookingActivityId)}
                                onClick={() => handleStartBooking(event)}
                                className="bg-[#0047AB] hover:bg-[#003785] text-white text-xs font-bold py-2.5 px-5 shadow-xs"
                              >
                                {bookingActivityId === event.id
                                  ? "Reserving..."
                                  : `Book Ticket · ₹${(isMember ? memberPrice : guestPrice).toFixed(0)}`}
                              </Button>
                            )}

                            {isGuest && savings > 0 && !isBooked && (
                              <button
                                type="button"
                                onClick={navigateToDues}
                                className="text-xs font-bold text-[#0047AB] hover:underline text-left sm:text-right"
                              >
                                ⚡ Activate Membership to Save ₹{savings.toFixed(0)} →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalEventPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#E5E7EB]">
                  <span className="text-xs text-[#64748B]">
                    Showing{" "}
                    <span className="font-semibold text-[#0A0A0A]">
                      {(safeEventPage - 1) * EVENTS_PAGE_SIZE + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-[#0A0A0A]">
                      {Math.min(safeEventPage * EVENTS_PAGE_SIZE, filteredActivities.length)}
                    </span>{" "}
                    of <span className="font-semibold text-[#0A0A0A]">{filteredActivities.length}</span> events
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={safeEventPage <= 1}
                      onClick={() => setEventsPage((prev) => Math.max(1, prev - 1))}
                      className="px-3.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-xs font-semibold text-[#0A0A0A] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F7F8FA] transition"
                    >
                      ← Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalEventPages }, (_, i) => i + 1)
                        .filter((p) => {
                          if (totalEventPages <= 7) return true;
                          if (p === 1 || p === totalEventPages) return true;
                          return Math.abs(p - safeEventPage) <= 1;
                        })
                        .map((p, idx, arr) => {
                          const showEllipsisBefore = idx > 0 && p > arr[idx - 1] + 1;
                          return (
                            <React.Fragment key={p}>
                              {showEllipsisBefore && (
                                <span className="px-1 text-xs text-[#64748B]">...</span>
                              )}
                              <button
                                type="button"
                                onClick={() => setEventsPage(p)}
                                className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                                  safeEventPage === p
                                    ? "bg-[#0047AB] text-white"
                                    : "bg-white border border-[#E5E7EB] text-[#0A0A0A] hover:bg-[#F7F8FA]"
                                }`}
                              >
                                {p}
                              </button>
                            </React.Fragment>
                          );
                        })}
                    </div>

                    <button
                      type="button"
                      disabled={safeEventPage >= totalEventPages}
                      onClick={() => setEventsPage((prev) => Math.min(totalEventPages, prev + 1))}
                      className="px-3.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-xs font-semibold text-[#0A0A0A] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F7F8FA] transition"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: MY TICKETS (REQUIREMENT 5)                             */}
        {/* ============================================================ */}
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
                    : "Tickets booked by guest accounts reflect standard non-member rates."}
                </p>
              </div>

              {/* Requirement 5: Comfortable primary Browse Campus Events button */}
              <Button
                onClick={() => setActiveTab("events")}
                className="bg-[#0047AB] hover:bg-[#003785] text-white px-5 py-2.5 text-sm font-bold shadow-xs self-start sm:self-auto"
              >
                Browse Campus Events →
              </Button>
            </div>

            {/* Requirement 5: Clean Empty State */}
            {passes.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#E5E7EB] bg-white p-12 text-center shadow-xs">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F0FF] text-[#0047AB] text-3xl mb-4">
                  🎟️
                </div>
                <h3 className="text-lg font-bold text-[#0A0A0A]">No tickets booked yet</h3>
                <p className="mt-2 text-xs text-[#64748B] max-w-md mx-auto leading-relaxed">
                  {isGuest
                    ? "You haven't booked any event tickets yet. Explore upcoming campus events to reserve your pass, or activate membership to unlock discounted rates."
                    : "You haven't registered for any upcoming events yet. Explore upcoming campus events to reserve your pass."}
                </p>

                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={() => setActiveTab("events")}
                    className="bg-[#0047AB] hover:bg-[#003785] text-white px-6 py-2.5 text-sm font-bold shadow-xs"
                  >
                    Browse Campus Events →
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-8 lg:grid-cols-2">
                {passes.map((pass, pIdx) => {
                  const isJustBooked = pass.id === justBookedTicketId;

                  return (
                    <div
                      key={pass.id}
                      className="rounded-3xl border border-[#E5E7EB] bg-[#0A0A0A] p-6 shadow-xl flex flex-col justify-between text-white relative overflow-hidden group hover:border-cyan-400/60 transition-all duration-300"
                    >
                      {/* Ambient Cobalt/Cyan Spotlight */}
                      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#0047AB] blur-3xl opacity-20 pointer-events-none group-hover:opacity-35 transition-opacity duration-500" />

                      {/* Top Metadata Header */}
                      <div className="flex items-center justify-between mb-4 relative z-10 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-cyan-300">✦ {pass.id}</span>
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            pass.tier === "member"
                              ? "bg-[#E8F0FF] text-[#0047AB]"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {pass.tier === "member" ? "Member Pass" : "Guest Ticket"}
                          </span>
                          {isJustBooked && (
                            <Badge variant="success">Booked Ticket</Badge>
                          )}
                        </div>
                        {pass.status === "valid" ? (
                          <Badge variant="success">Ready for Entry</Badge>
                        ) : (
                          <Badge variant="neutral">Checked In</Badge>
                        )}
                      </div>

                      {/* 3D Holographic Foil Pass Component */}
                      <div className="w-full flex justify-center py-2 relative z-10">
                        <SkylineHolographicTicket
                          ticketId={pass.id}
                          eventName={pass.eventName.toUpperCase()}
                          attendeeName={currentUser.name.toUpperCase()}
                          venue={pass.venue.toUpperCase()}
                          date={pass.date.toUpperCase()}
                          time={pass.time.toUpperCase()}
                          stubText="OFFICIAL PASS"
                          barcodeNumber={pass.qrCode.replace(/[^0-9]/g, "").slice(0, 6) || "912215"}
                          status={pass.status}
                          tier={pass.tier}
                          onClick={() => {
                            setActiveHoloIndex(pIdx);
                            setInspectPass(pass);
                            setPassModalView("qr");
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
                            <p className="text-xs font-mono font-bold text-white truncate max-w-[120px]">{pass.qrCode}</p>
                            <p className="text-[10px] text-cyan-300 font-medium">Ready for door scan · Tilt for 3D glare</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setInspectPass(pass);
                              setPassModalView("qr");
                            }}
                            className="bg-[#000000] text-white hover:bg-[#262626] border border-black/80 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-50 disabled:pointer-events-none text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                          >
                            <QrCode className="w-3.5 h-3.5 text-white" />
                            <span>Door QR</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: MERCHANDISE SHOP & PURCHASED ORDERS (REQUIREMENT 7)    */}
        {/* ============================================================ */}
        {activeTab === "orders" && (
          <div className="space-y-10">
            {/* Purchase Confirmation Alert */}
            {merchPurchaseSuccess && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-900 flex items-center justify-between animate-in fade-in">
                <span>{merchPurchaseSuccess}</span>
                <span className="text-emerald-600 font-mono text-[10px]">PICKUP READY</span>
              </div>
            )}

            {/* PART A: OFFICIAL MERCHANDISE SHOP CATALOG */}
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
                    onClick={navigateToDues}
                    className="border-[#0047AB]/30 text-[#0047AB] hover:bg-[#E8F0FF] text-xs self-start sm:self-auto"
                  >
                    Activate Membership to Save up to ₹300/item →
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
                                  disabled={Boolean(submittingProductId)}
                                  onClick={() => setSelectedSizes((prev) => ({ ...prev, [product.id]: sz }))}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                                    currentSize === sz
                                      ? "bg-[#0047AB] text-white shadow-xs"
                                      : "bg-[#F7F8FA] text-[#0A0A0A] border border-[#E5E7EB] hover:border-[#0047AB]"
                                  } ${submittingProductId ? "opacity-60 cursor-not-allowed" : ""}`}
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
                                disabled={Boolean(submittingProductId)}
                                onClick={() =>
                                  setSelectedQuantities((prev) => ({
                                    ...prev,
                                    [product.id]: Math.max(1, (prev[product.id] || 1) - 1),
                                  }))
                                }
                                className={`h-6 w-6 rounded bg-white border border-[#E5E7EB] text-[#0A0A0A] font-bold text-xs hover:bg-[#E8F0FF] flex items-center justify-center transition ${submittingProductId ? "opacity-60 cursor-not-allowed" : ""}`}
                              >
                                -
                              </button>
                              <span className="text-xs font-mono font-extrabold px-1 text-[#0A0A0A]">
                                {currentQty}
                              </span>
                              <button
                                type="button"
                                disabled={Boolean(submittingProductId)}
                                onClick={() =>
                                  setSelectedQuantities((prev) => ({
                                    ...prev,
                                    [product.id]: Math.min(10, (prev[product.id] || 1) + 1),
                                  }))
                                }
                                className={`h-6 w-6 rounded bg-white border border-[#E5E7EB] text-[#0A0A0A] font-bold text-xs hover:bg-[#E8F0FF] flex items-center justify-center transition ${submittingProductId ? "opacity-60 cursor-not-allowed" : ""}`}
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

                          {merchErrors[product.id] && (
                            <div className="mb-2 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium flex items-center justify-between">
                              <span className="truncate">⚠️ {merchErrors[product.id]}</span>
                              <button
                                type="button"
                                onClick={() => setMerchErrors((prev) => ({ ...prev, [product.id]: null }))}
                                className="text-rose-500 hover:text-rose-700 font-bold ml-2 shrink-0"
                              >
                                ✕
                              </button>
                            </div>
                          )}

                          <Button
                            className={`w-full text-xs font-bold shadow-xs transition-colors ${
                              submittingProductId === product.id
                                ? "bg-[#003785] text-white cursor-wait"
                                : submittingProductId
                                ? "bg-[#0047AB]/60 text-white cursor-not-allowed opacity-60"
                                : "bg-[#0047AB] hover:bg-[#003785] text-white"
                            }`}
                            disabled={Boolean(submittingProductId)}
                            onClick={() => handlePurchaseProduct(product)}
                          >
                            {submittingProductId === product.id ? (
                              <span className="flex items-center justify-center gap-1.5">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Processing…</span>
                              </span>
                            ) : (
                              `Order Now (${currentQty} ${currentQty === 1 ? "Item" : "Items"}) →`
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PART B: PENDING ORDERS (Truthful display for pending checkouts) */}
            {pendingOrders.length > 0 && (
              <div className="pt-8 border-t border-[#E5E7EB] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#0A0A0A]">Pending Orders (Payment Required)</h3>
                  <Badge variant="warning">{pendingOrders.length} Pending</Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {pendingOrders.map((order) => (
                    <div key={order.id} className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 flex justify-between items-center">
                      <div>
                        <span className="font-mono text-xs font-bold text-[#0047AB]">{order.id}</span>
                        <h4 className="font-bold text-sm text-[#0A0A0A] mt-1">{order.itemName}</h4>
                        <p className="text-xs text-[#64748B]">{order.variant} · {order.quantity} Units</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="warning">Payment Pending</Badge>
                        <p className="text-sm font-extrabold text-[#0A0A0A] mt-1">₹{(order.pricePaise / 100).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PART C: PURCHASED MERCHANDISE ORDERS (REQUIREMENT 7: Strictly rendered if confirmedOrders > 0) */}
            {confirmedOrders.length > 0 && (
              <div className="pt-8 border-t border-[#E5E7EB] space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-[#0A0A0A]">Your Purchased Merchandise</h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#E8F0FF] text-[#0047AB] text-xs font-extrabold border border-[#0047AB]/20">
                        {confirmedOrders.reduce((sum, o) => sum + (o.quantity || 1), 0)} Items Purchased
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

                {/* Visual Showcase: Units Displayed According to Number Purchased */}
                <div className="rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#0047AB] bg-[#E8F0FF] px-2.5 py-0.5 rounded-full">
                        Purchased Items Showcase
                      </span>
                      <span className="text-xs text-[#64748B] font-medium">
                        ({confirmedOrders.reduce((sum, o) => sum + (o.quantity || 1), 0)} Total Units Allocated)
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ✓ Ready for Club Desk Pickup
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {confirmedOrders.flatMap((order) => {
                      const qty = order.quantity || 1;
                      return Array.from({ length: qty }).map((_, uIdx) => (
                        <div
                          key={`${order.id}-unit-${uIdx}`}
                          onClick={() => setInspectOrder(order)}
                          className="group/thumb cursor-pointer rounded-2xl border border-[#E5E7EB] bg-[#F7F8FA] overflow-hidden hover:border-[#0047AB] hover:shadow-md transition flex flex-col"
                        >
                          <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                            <img
                              src={order.imageUrl}
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

                {/* Purchased Orders Cards with Fulfilment Badges */}
                <div className="grid gap-6 md:grid-cols-2">
                  {confirmedOrders.map((order) => {
                    const quantity = order.quantity || 1;
                    const isCollected = order.status === "collected";

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
                              {isCollected ? (
                                <Badge variant="neutral">Collected</Badge>
                              ) : (
                                <Badge variant="success">Ready for Pickup</Badge>
                              )}
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

                          {/* Product Pictures Frame */}
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
                                    src={order.imageUrl}
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
              </div>
            )}

            {/* REQUIREMENT 7: Clean Empty State when user has 0 orders */}
            {confirmedOrders.length === 0 && pendingOrders.length === 0 && (
              <div className="rounded-3xl border border-dashed border-[#E5E7EB] bg-white p-10 text-center shadow-xs">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F0FF] text-[#0047AB] text-2xl mb-3">
                  👕
                </div>
                <h4 className="text-base font-bold text-[#0A0A0A]">No merchandise orders placed yet</h4>
                <p className="mt-1 text-xs text-[#64748B] max-w-sm mx-auto leading-relaxed">
                  Select any of the official campus apparel items above to place your order. Verified pickup collection slips are issued upon payment.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 5: REIMBURSEMENT CLAIMS (MEMBER WORKSPACE ONLY)           */}
        {/* ============================================================ */}
        {activeTab === "claims" && isMember && (
          <div className="space-y-6">
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Submit New Claim Form */}
              <div className="lg:col-span-1">
                <Card className="border border-[#E5E7EB] shadow-xs bg-white">
                  <CardHeader>
                    <CardTitle className="text-[#0A0A0A]">Submit Reimbursement</CardTitle>
                    <CardDescription className="text-[#64748B]">
                      Upload physical or electronic receipts for club-related volunteer expenses.
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
                          <option value="Supplies">Event Supplies &amp; Stationary</option>
                          <option value="Refreshments">Refreshments &amp; Food</option>
                          <option value="Printing">Printing &amp; Marketing</option>
                          <option value="Travel">Local Logistics &amp; Travel</option>
                        </select>
                      </div>

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
                        Submit Claim with Receipt →
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
                      Submit expense claims with receipts using the form to have them reviewed by the Treasurer.
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

      {/* DEMO PAYMENT MODAL FOR TICKETS */}
      {mounted && pendingBooking && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 sm:p-6 backdrop-blur-md overflow-hidden animate-in fade-in"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !confirmingPayment) setPendingBooking(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-payment-dialog-title"
            className="relative flex flex-col rounded-3xl bg-white p-6 shadow-2xl border border-[#E5E7EB] overflow-hidden"
            style={{ width: "min(100% - 2rem, 30rem)", maxHeight: "min(90vh, calc(100dvh - 2rem))" }}
          >
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 mb-4 shrink-0">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0047AB] bg-[#E8F0FF] px-2.5 py-0.5 rounded-full">
                  Demo Payment Adapter
                </span>
                <h3 id="booking-payment-dialog-title" className="text-lg font-bold text-[#0A0A0A] mt-1">
                  Confirm Ticket Booking
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close Booking Dialog"
                onClick={() => {
                  if (!confirmingPayment) setPendingBooking(null);
                }}
                disabled={confirmingPayment}
                className="h-8 w-8 rounded-full bg-[#F7F8FA] border border-[#E5E7EB] flex items-center justify-center text-[#64748B] hover:bg-[#E5E7EB] font-bold transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0047AB]"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="rounded-2xl bg-[#F7F8FA] p-4 border border-[#E5E7EB] text-xs">
                <p className="font-bold text-[#0A0A0A] text-sm">{pendingBooking.activity.title}</p>
                <div className="mt-2 space-y-1 text-[#64748B]">
                  <p>📍 Venue: <strong className="text-[#0A0A0A]">{pendingBooking.activity.location}</strong></p>
                  <p>🗓️ Date: <strong className="text-[#0A0A0A]">{new Date(pendingBooking.activity.startsAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</strong></p>
                  <p>🎫 Tier: <strong className="text-[#0A0A0A]">{isMember ? "Member Rate" : "Guest Rate"}</strong></p>
                </div>
                <div className="mt-3 pt-3 border-t border-[#E5E7EB] flex justify-between items-center text-sm">
                  <span className="font-semibold text-[#0A0A0A]">Total Amount:</span>
                  <span className="text-xl font-black text-[#0047AB]">
                    ₹{(pendingBooking.booking.amountPaise / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 leading-relaxed">
                <p className="font-bold">Simulated Payment Confirmation</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  This checkout uses the Skyline simulated demo payment flow. No real currency is collected. Confirming will generate a verified cryptographic ticket pass.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  onClick={() => confirmBookingTicket(pendingBooking.booking.id)}
                  disabled={confirmingPayment}
                  className="w-full bg-[#0047AB] hover:bg-[#003785] text-white py-3 text-xs font-bold"
                >
                  {confirmingPayment ? "Confirming & Issuing Ticket..." : `Confirm Payment · ₹${(pendingBooking.booking.amountPaise / 100).toFixed(2)} →`}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPendingBooking(null)}
                  disabled={confirmingPayment}
                  className="w-full text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* RECEIPT INSPECTION MODAL */}
      {mounted && inspectReceipt && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 sm:p-6 backdrop-blur-md overflow-hidden animate-in fade-in"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectReceipt(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-dialog-title"
            className="relative flex flex-col rounded-3xl bg-white p-6 shadow-2xl border border-[#E5E7EB] overflow-hidden"
            style={{ width: "min(100% - 2rem, 34rem)", maxHeight: "min(90vh, calc(100dvh - 2rem))" }}
          >
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4 shrink-0">
              <div>
                <h3 id="receipt-dialog-title" className="text-lg font-bold text-[#0A0A0A]">Receipt Document</h3>
                <p className="text-xs text-[#64748B] font-mono">{inspectReceipt.receiptName}</p>
              </div>
              <button
                type="button"
                aria-label="Close Receipt"
                onClick={() => setInspectReceipt(null)}
                className="h-8 w-8 rounded-full bg-[#F7F8FA] border border-[#E5E7EB] flex items-center justify-center text-[#64748B] hover:bg-[#E5E7EB] hover:text-[#0A0A0A] font-bold transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0047AB]"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1">
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

              <div className="rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] p-3.5 text-xs text-[#0A0A0A] flex justify-between">
                <span>Total Amount: <strong>₹{(inspectReceipt.amountPaise / 100).toFixed(2)}</strong></span>
                <span>Status: <strong>{inspectReceipt.status}</strong></span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 shrink-0 border-t border-[#E5E7EB]">
              <Button variant="outline" size="sm" onClick={() => setInspectReceipt(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* PASS INSPECTION MODAL (DOOR QR VERIFICATION - REQUIREMENT 2) */}
      {mounted && inspectPass && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 sm:p-6 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectPass(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="inspect-pass-dialog-title"
            className="relative flex flex-col rounded-3xl bg-[#0A0A0A] text-white p-5 sm:p-7 shadow-2xl border border-white/20 overflow-hidden"
            style={{ width: "min(100% - 2rem, 36rem)", maxHeight: "min(90vh, calc(100dvh - 2rem))" }}
          >
            {/* Modal Header */}
            <div className="w-full flex justify-between items-center pb-4 border-b border-white/10 gap-2 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="p-2 rounded-xl bg-black border border-white/20 text-white shrink-0">
                  <QrCode className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-mono text-cyan-300 uppercase font-bold tracking-wider">
                    Door QR Pass Verification
                  </span>
                  <h3 id="inspect-pass-dialog-title" className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wider truncate">
                    {inspectPass.eventName}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono truncate">{inspectPass.id} · {inspectPass.venue}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectPass(null)}
                className="h-8 w-8 shrink-0 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-slate-300 hover:bg-white/20 hover:text-white font-bold ml-2 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Close Pass Modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Content: Scannable High-Contrast QR Code */}
            <div className="flex-1 overflow-y-auto overscroll-contain py-6 flex flex-col items-center justify-center text-center">
              <div className="p-4 bg-white rounded-2xl shadow-2xl mb-4 border border-white/20">
                <QRCode value={inspectPass.qrCode} size={210} />
              </div>
              <p className="font-mono text-base font-black text-white tracking-widest break-all px-4">
                {inspectPass.qrCode}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>High-Contrast Door QR · Ready for Officer Camera Scan</span>
              </div>
              <div className="mt-3 text-xs text-slate-300 space-y-0.5">
                <p className="font-bold text-white text-sm uppercase tracking-wide">{currentUser.name}</p>
                <p className="text-slate-400 font-mono text-[11px]">
                  {inspectPass.date} · {inspectPass.time} · {inspectPass.venue}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="w-full pt-4 border-t border-white/10 flex justify-between items-center text-xs text-slate-400 shrink-0">
              <span className="font-mono text-[11px]">
                {inspectPass.tier === "member" ? "MEMBER SUBSIDIZED RATE" : "REGULAR GUEST RATE"}
              </span>
              <Button
                size="sm"
                className="bg-[#000000] text-white hover:bg-[#262626] border border-white/20 font-semibold px-4"
                onClick={() => setInspectPass(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* COLLECTION SLIP MODAL (OFFICIAL PICKUP VOUCHER - REQUIREMENT 4) */}
      {mounted && inspectOrder && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 sm:p-6 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectOrder(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pickup-voucher-dialog-title"
            className="relative flex flex-col rounded-3xl bg-[#0A0A0A] border border-white/20 text-white shadow-2xl p-5 sm:p-7 overflow-hidden"
            style={{
              width: "min(100% - 2rem, 40rem)",
              maxHeight: "min(90vh, calc(100dvh - 2rem))",
            }}
          >
            {/* Header (fixed at top with shrink-0) */}
            <div className="w-full flex items-center justify-between pb-4 border-b border-white/10 shrink-0 gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono text-cyan-300 uppercase font-bold tracking-wider">
                    Official Pickup Voucher
                  </span>
                  {inspectOrder.rawStatus === "fulfilled" || inspectOrder.status === "collected" ? (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold">
                      Fulfilled · Collected
                    </span>
                  ) : inspectOrder.rawStatus === "confirmed" || inspectOrder.status === "pending_collection" ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 text-[10px] font-bold">
                      Ready for Pickup
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-950/90 text-amber-300 border border-amber-500/50 text-[10px] font-bold">
                      Payment Pending · Not Ready
                    </span>
                  )}
                </div>
                <h3
                  id="pickup-voucher-dialog-title"
                  className="text-base font-extrabold text-white mt-1 break-all"
                  title={inspectOrder.id}
                >
                  {inspectOrder.id}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Ordered: {inspectOrder.orderDate} · {inspectOrder.tier === "member" ? "Member Rate" : "Guest Rate"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectOrder(null)}
                aria-label="Close Pickup Voucher"
                className="h-9 w-9 shrink-0 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-slate-300 hover:bg-white/20 hover:text-white font-bold transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                ✕
              </button>
            </div>

            {/* Internal Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain py-4 space-y-4 pr-1">
              {/* Selected Order Items List (Handles single-item and multi-item orders) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-300 font-semibold px-1">
                  <span>
                    Allocated Items ({(inspectOrder.items && inspectOrder.items.length > 0
                      ? inspectOrder.items.reduce((s, it) => s + it.quantity, 0)
                      : inspectOrder.quantity || 1)} Units):
                  </span>
                  <span className="text-cyan-300 font-mono text-[10px] uppercase tracking-wider">
                    {inspectOrder.rawStatus === "confirmed" || inspectOrder.status === "pending_collection"
                      ? "Verified Allocation"
                      : inspectOrder.rawStatus === "fulfilled" || inspectOrder.status === "collected"
                      ? "Picked Up"
                      : "Reservation Hold"}
                  </span>
                </div>

                <div className="space-y-2">
                  {(inspectOrder.items && inspectOrder.items.length > 0
                    ? inspectOrder.items
                    : [
                        {
                          name: inspectOrder.itemName,
                          variant: inspectOrder.variant,
                          quantity: inspectOrder.quantity || 1,
                          pricePaise: inspectOrder.pricePaise,
                          imageUrl: inspectOrder.imageUrl || "/merchandise/skyline-hoodie.jpg",
                        },
                      ]
                  ).map((lineItem, lIdx) => (
                    <div
                      key={`${inspectOrder.id}-line-${lIdx}`}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10"
                    >
                      <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-black/50 border border-white/10">
                        <img
                          src={lineItem.imageUrl}
                          alt={lineItem.name}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute top-1 left-1">
                          <span className="px-1.5 py-0.2 rounded bg-[#0047AB] text-white text-[9px] font-black">
                            x{lineItem.quantity}
                          </span>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-white break-words leading-tight">
                          {lineItem.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5 break-words">
                          {lineItem.variant}
                        </p>
                        <p className="text-[10px] text-cyan-300 font-semibold font-mono mt-0.5">
                          Unit Price: ₹{((lineItem.pricePaise / lineItem.quantity) / 100).toFixed(2)} · Subtotal: ₹{(lineItem.pricePaise / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collection Desk Reference & QR */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center flex flex-col items-center">
                <div className="p-3 bg-white rounded-2xl mb-3 shadow-md">
                  <QRCode value={inspectOrder.collectionCode || inspectOrder.id} size={140} />
                </div>
                <span className="font-mono text-base sm:text-lg font-black tracking-widest text-cyan-300 break-all px-2">
                  {inspectOrder.collectionCode || inspectOrder.id}
                </span>
                <p className="text-xs text-slate-300 mt-1 font-semibold">
                  West Wing Club Room 104 · Door Desk Verification
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Present this voucher QR code to a Club Officer to claim your physical items.
                </p>
              </div>
            </div>

            {/* Footer (fixed at bottom with shrink-0) */}
            <div className="w-full flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-white/10 shrink-0 gap-3">
              <span className="truncate">
                Total Paid: <strong className="text-white">₹{(inspectOrder.pricePaise / 100).toFixed(2)}</strong>
              </span>
              <Button
                size="sm"
                className="bg-[#0047AB] hover:bg-[#003785] text-white text-xs px-5 shadow-xs shrink-0"
                onClick={() => setInspectOrder(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
