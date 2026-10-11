import { PrismaClient } from "@prisma/client";
import { auth } from "../../Backend/lib/auth/auth";

const prisma = new PrismaClient();

/**
 * getOrCreateUser — idempotent user bootstrap.
 * If a user with this email already exists (created by Better Auth in a prior
 * seed or a real sign-up), returns the existing record without touching the
 * password or any linked sessions/accounts.
 * Only calls auth.api.signUpEmail on first run when the email is absent.
 */
async function getOrCreateUser(email: string, name: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  try {
    const res = await auth.api.signUpEmail({ body: { email, name, password } });
    if (res?.user) return res.user;
  } catch {
    // Partial insert — fall through to re-query below
  }

  const fresh = await prisma.user.findUnique({ where: { email } });
  if (!fresh) throw new Error(`Failed to create or retrieve user: ${email}`);
  return fresh;
}

async function main() {
  console.log("🌱 Starting Skyline ERP demo seeding...");

  // ---------------------------------------------------------------------------
  // 1. Core Demo Accounts
  // Passwords are only set on first creation. Existing hashed passwords are
  // never overwritten — Better Auth owns the credential lifecycle.
  // ---------------------------------------------------------------------------
  console.log("\nSeeding core demo accounts...");

  const student = await getOrCreateUser(
    "student@skyline.edu",
    "Sam Student",
    "StudentPassword123!"
  );
  console.log(`  ✔ Student    : ${student.email} (${student.id})`);

  const officer = await getOrCreateUser(
    "officer@skyline.edu",
    "Olivia Officer",
    "OfficerPassword123!"
  );
  console.log(`  ✔ Officer    : ${officer.email} (${officer.id})`);

  const treasurer = await getOrCreateUser(
    "treasurer@skyline.edu",
    "Trevor Treasurer",
    "TreasurerPassword123!"
  );
  console.log(`  ✔ Treasurer  : ${treasurer.email} (${treasurer.id})`);

  // Additional volunteer — used for task assignment & claims demo
  const volunteer = await getOrCreateUser(
    "volunteer@skyline.edu",
    "Veer Volunteer",
    "VolunteerPassword123!"
  );
  console.log(`  ✔ Volunteer  : ${volunteer.email} (${volunteer.id})`);

  // ---------------------------------------------------------------------------
  // 2. Administrative Roles — decoupled from student membership eligibility
  // ---------------------------------------------------------------------------
  await prisma.role.upsert({
    where: { userId_role: { userId: officer.id, role: "officer" } },
    create: { userId: officer.id, role: "officer" },
    update: {},
  });
  console.log("  ✔ Role 'officer' → Olivia");

  await prisma.role.upsert({
    where: { userId_role: { userId: treasurer.id, role: "treasurer" } },
    create: { userId: treasurer.id, role: "treasurer" },
    update: {},
  });
  console.log("  ✔ Role 'treasurer' → Trevor");

  // ---------------------------------------------------------------------------
  // 3. Club Settings (singleton — keyed by fixed ID)
  // ---------------------------------------------------------------------------
  await prisma.clubSettings.upsert({
    where: { id: "club-settings-skyline" },
    create: {
      id: "club-settings-skyline",
      name: "Skyline Student Association",
      description:
        "Official student association of Skyline University fostering community and technology.",
    },
    update: { name: "Skyline Student Association" },
  });
  console.log("  ✔ Club settings initialized");

  // ---------------------------------------------------------------------------
  // 4. Membership Period — Academic Year 2026-2027
  // duesPaise = 50000 → ₹500.00
  // ---------------------------------------------------------------------------
  const period = await prisma.membershipPeriod.upsert({
    where: { academicYear: "2026-2027" },
    create: {
      id: "period-2026-2027",
      academicYear: "2026-2027",
      label: "Academic Year 2026-2027",
      startsAt: new Date("2026-08-01T00:00:00Z"),
      endsAt: new Date("2027-07-31T23:59:59Z"),
      duesPaise: BigInt(50000),
    },
    update: {
      label: "Academic Year 2026-2027",
      duesPaise: BigInt(50000),
    },
  });
  console.log(`  ✔ Membership period 2026-2027 — dues ₹500 (id: ${period.id})`);

  // ---------------------------------------------------------------------------
  // 5. Club Events (Activities)
  //
  // Three events seeded with stable IDs:
  //   activity-hackathon-2026    — 24h coding competition (ticketed)
  //   activity-tech-summit-2026  — one-day industry symposium (ticketed)
  //   activity-bake-sale-2026    — bake sale fundraiser (non-ticketed)
  //
  // Confirmed bookings and tickets tied to these IDs are never affected.
  // Only metadata fields (price, capacity, description) are updated on re-run.
  // ---------------------------------------------------------------------------
  console.log("\nSeeding club events...");

  // Event 1 — Annual Hackathon (existing record preserved)
  const hackathon = await prisma.activity.upsert({
    where: { id: "activity-hackathon-2026" },
    create: {
      id: "activity-hackathon-2026",
      kind: "event",
      title: "Annual Skyline Hackathon 2026",
      description:
        "Join 200+ students for 24 hours of innovation, mentorship, and prize awards! Build a real-world project with your team and compete for cash prizes.",
      venue: "Student Union Grand Hall",
      startsAt: new Date("2026-11-15T09:00:00Z"),
      endsAt: new Date("2026-11-16T18:00:00Z"),
      capacity: 100,
      memberPricePaise: BigInt(25000),   // ₹250.00
      regularPricePaise: BigInt(50000),  // ₹500.00
      published: true,
      ticketed: true,
      createdById: officer.id,
    },
    update: {
      capacity: 100,
      memberPricePaise: BigInt(25000),
      regularPricePaise: BigInt(50000),
      published: true,
    },
  });
  console.log(`  ✔ ${hackathon.title} — member ₹250 / regular ₹500 / cap 100`);

  const summit = await prisma.activity.upsert({
    where: { id: "evt-01" },
    create: {
      id: "evt-01",
      kind: "event",
      title: "Skyline Tech & Innovation Summit 2026",
      description: "Keynotes from notable industry alumni, student technology pitch showcase, and networking luncheon kit.",
      venue: "Main Campus Auditorium",
      startsAt: new Date("2026-10-24T10:00:00Z"),
      endsAt: new Date("2026-10-24T17:00:00Z"),
      capacity: 50,
      memberPricePaise: BigInt(15000),
      regularPricePaise: BigInt(25000),
      published: true,
      ticketed: true,
      createdById: officer.id,
    },
    update: {
      capacity: 50,
      memberPricePaise: BigInt(15000),
      regularPricePaise: BigInt(25000),
    },
  });
  console.log(`  ✔ Activity: ${summit.title} (member: ₹150, regular: ₹250)`);

  const gala = await prisma.activity.upsert({
    where: { id: "evt-02" },
    create: {
      id: "evt-02",
      kind: "event",
      title: "Skyline Cultural Gala & Music Festival",
      description: "An evening of student acoustic bands, classical performance troupes, artisan campus stalls, and live showcase.",
      venue: "Campus Open Amphitheatre",
      startsAt: new Date("2026-11-12T18:00:00Z"),
      endsAt: new Date("2026-11-12T22:30:00Z"),
      capacity: 100,
      memberPricePaise: BigInt(15000),
      regularPricePaise: BigInt(25000),
      published: true,
      ticketed: true,
      createdById: officer.id,
    },
    update: {
      capacity: 100,
      memberPricePaise: BigInt(15000),
      regularPricePaise: BigInt(25000),
    },
  });
  console.log(`  ✔ Activity: ${gala.title} (member: ₹150, regular: ₹250)`);

  const hackSprint = await prisma.activity.upsert({
    where: { id: "evt-03" },
    create: {
      id: "evt-03",
      kind: "event",
      title: "Emerging Leaders Hackathon & Case Sprint",
      description: "12-hour collaborative design and strategy sprint addressing campus initiatives with direct officer mentorship.",
      venue: "Innovation Sandbox, West Wing",
      startsAt: new Date("2026-11-28T09:00:00Z"),
      endsAt: new Date("2026-11-28T21:00:00Z"),
      capacity: 30,
      memberPricePaise: BigInt(0),
      regularPricePaise: BigInt(10000),
      published: true,
      ticketed: true,
      createdById: officer.id,
    },
    update: {
      capacity: 30,
      memberPricePaise: BigInt(0),
      regularPricePaise: BigInt(10000),
    },
  });
  console.log(`  ✔ Activity: ${hackSprint.title} (member: ₹0, regular: ₹100)`);

  // Event 4 — Tech Summit (symposium)
  const techSummit = await prisma.activity.upsert({
    where: { id: "activity-tech-summit-2026" },
    create: {
      id: "activity-tech-summit-2026",
      kind: "event",
      title: "Skyline Tech Summit 2026",
      description:
        "A one-day symposium featuring industry speakers, panel discussions on AI & open-source, and networking with tech professionals from Bangalore's startup ecosystem.",
      venue: "Main Auditorium, Block C",
      startsAt: new Date("2026-12-06T10:00:00Z"),
      endsAt: new Date("2026-12-06T18:00:00Z"),
      capacity: 200,
      memberPricePaise: BigInt(0),       // Free for members
      regularPricePaise: BigInt(20000),  // ₹200.00
      published: true,
      ticketed: true,
      createdById: officer.id,
    },
    update: {
      capacity: 200,
      memberPricePaise: BigInt(0),
      regularPricePaise: BigInt(20000),
      published: true,
    },
  });
  console.log(`  ✔ ${techSummit.title} — member free / regular ₹200 / cap 200`);

  // Event 5 — Bake Sale Fundraiser (non-ticketed)
  const bakeSale = await prisma.activity.upsert({
    where: { id: "activity-bake-sale-2026" },
    create: {
      id: "activity-bake-sale-2026",
      kind: "event",
      title: "Annual Club Bake Sale & Fundraiser",
      description:
        "Help us raise funds for club equipment and travel grants! Volunteer bakers and table managers needed. All proceeds go to the club treasury.",
      venue: "Campus Atrium, Ground Floor",
      startsAt: new Date("2026-10-25T09:00:00Z"),
      endsAt: new Date("2026-10-25T17:00:00Z"),
      capacity: null,       // Open — no seat limit
      memberPricePaise: BigInt(0),
      regularPricePaise: BigInt(0),
      published: true,
      ticketed: false,      // Fundraiser — entry free, income via cash receipts
      createdById: officer.id,
    },
    update: {
      published: true,
      ticketed: false,
    },
  });
  console.log(`  ✔ ${bakeSale.title} — open fundraiser, non-ticketed`);

  // ---------------------------------------------------------------------------
  // 6. Activity Staff Capabilities
  // ---------------------------------------------------------------------------
  const staffRows = [
    { activityId: hackathon.id, userId: officer.id, capability: "checkin" },
    { activityId: summit.id, userId: officer.id, capability: "checkin" },
    { activityId: gala.id, userId: officer.id, capability: "checkin" },
    { activityId: hackSprint.id, userId: officer.id, capability: "checkin" },
    { activityId: techSummit.id, userId: officer.id, capability: "checkin" },
    { activityId: bakeSale.id, userId: volunteer.id, capability: "volunteer" },
  ];

  for (const row of staffRows) {
    await prisma.activityStaff.upsert({
      where: {
        activityId_userId_capability: {
          activityId: row.activityId,
          userId: row.userId,
          capability: row.capability,
        },
      },
      create: row,
      update: {},
    });
  }
  console.log("  ✔ Activity staff capabilities assigned");

  // ---------------------------------------------------------------------------
  // 7. Merchandise Products & Variant Stock
  //
  // Upsert key for Variant: (productId, size, color) — unique in schema.
  // stockTotal is the declared shelf quantity; it is safe to refresh on
  // re-run because it reflects max available, not a running counter.
  // stockReserved and stockSold are NEVER touched here — they are managed
  // exclusively by the purchase service layer.
  // ---------------------------------------------------------------------------
  console.log("\nSeeding merchandise...");

  // Product 1 — Club Hoodie (existing record preserved, sizes expanded)
  const hoodie = await prisma.product.upsert({
    where: { id: "prod-hoodie-2026" },
    create: {
      id: "prod-hoodie-2026",
      name: "Skyline Premium Club Hoodie",
      description:
        "Heavyweight navy cotton fleece embroidered with the Skyline Student Association crest. Unisex fit.",
      imagePath: "/images/merch/hoodie-navy.jpg",
      regularPricePaise: BigInt(150000), // ₹1,500.00
      memberPricePaise: BigInt(120000),  // ₹1,200.00
      active: true,
      createdById: officer.id,
    },
    update: {
      regularPricePaise: BigInt(150000),
      memberPricePaise: BigInt(120000),
      active: true,
    },
  });

  for (const s of [
    { size: "S",   stock: 10 },
    { size: "M",   stock: 25 },
    { size: "L",   stock: 30 },
    { size: "XL",  stock: 15 },
    { size: "XXL", stock: 8  },
  ]) {
    await prisma.variant.upsert({
      where: { productId_size_color: { productId: hoodie.id, size: s.size, color: "Navy" } },
      create: { productId: hoodie.id, size: s.size, color: "Navy", stockTotal: s.stock, stockReserved: 0, stockSold: 0 },
      update: { stockTotal: s.stock },
    });
  }
  console.log(`  ✔ ${hoodie.name} — S/M/L/XL/XXL in Navy`);

  // Product 2 — Classic T-Shirt (new, two colourways)
  const tshirt = await prisma.product.upsert({
    where: { id: "prod-tshirt-2026" },
    create: {
      id: "prod-tshirt-2026",
      name: "Skyline Classic T-Shirt",
      description:
        "100% cotton crew-neck tee with the Skyline wordmark printed on the chest. Available in White and Black.",
      imagePath: "/images/merch/tshirt-white.jpg",
      regularPricePaise: BigInt(60000), // ₹600.00
      memberPricePaise: BigInt(45000),  // ₹450.00
      active: true,
      createdById: officer.id,
    },
    update: {
      regularPricePaise: BigInt(60000),
      memberPricePaise: BigInt(45000),
      active: true,
    },
  });

  for (const v of [
    { size: "S",  color: "White", stock: 20 },
    { size: "M",  color: "White", stock: 30 },
    { size: "L",  color: "White", stock: 25 },
    { size: "XL", color: "White", stock: 15 },
    { size: "S",  color: "Black", stock: 15 },
    { size: "M",  color: "Black", stock: 25 },
    { size: "L",  color: "Black", stock: 20 },
    { size: "XL", color: "Black", stock: 10 },
  ]) {
    await prisma.variant.upsert({
      where: { productId_size_color: { productId: tshirt.id, size: v.size, color: v.color } },
      create: { productId: tshirt.id, size: v.size, color: v.color, stockTotal: v.stock, stockReserved: 0, stockSold: 0 },
      update: { stockTotal: v.stock },
    });
  }
  console.log(`  ✔ ${tshirt.name} — S/M/L/XL in White & Black`);

  // Product 3 — Canvas Tote Bag (new, one-size)
  const toteBag = await prisma.product.upsert({
    where: { id: "prod-tote-2026" },
    create: {
      id: "prod-tote-2026",
      name: "Skyline Canvas Tote Bag",
      description:
        "Heavy-duty natural canvas tote with the Skyline crest screenprinted in cobalt blue. One size fits all.",
      imagePath: "/images/merch/tote-natural.jpg",
      regularPricePaise: BigInt(35000), // ₹350.00
      memberPricePaise: BigInt(25000),  // ₹250.00
      active: true,
      createdById: officer.id,
    },
    update: {
      regularPricePaise: BigInt(35000),
      memberPricePaise: BigInt(25000),
      active: true,
    },
  });

  await prisma.variant.upsert({
    where: { productId_size_color: { productId: toteBag.id, size: "One Size", color: "Natural" } },
    create: { productId: toteBag.id, size: "One Size", color: "Natural", stockTotal: 50, stockReserved: 0, stockSold: 0 },
    update: { stockTotal: 50 },
  });
  console.log(`  ✔ ${toteBag.name} — One Size, Natural canvas`);

  // ---------------------------------------------------------------------------
  // 8. Volunteer Tasks
  //
  // 6 tasks across 3 events (Hackathon ×3, Tech Summit ×2, Bake Sale ×1).
  // assigneeId = null means unassigned; officer assigns from the Desk.
  // Only the title is updated on re-run — status and assignee are not reset
  // so that in-progress task edits made through the UI are preserved.
  // ---------------------------------------------------------------------------
  console.log("\nSeeding volunteer tasks...");

  const tasks = [
    // Hackathon tasks
    {
      id: "task-hackathon-venue-setup",
      activityId: hackathon.id,
      title: "Setup Registration Desk & QR Scanners",
      description:
        "Arrive at 8:00 AM to set up welcome kits, print attendee badges, and verify door scanners are synced with the check-in app.",
      status: "open",
      dueAt: new Date("2026-11-15T08:30:00Z"),
      assigneeId: volunteer.id,
    },
    {
      id: "task-hackathon-prizes",
      activityId: hackathon.id,
      title: "Procure & Label Prize Hampers",
      description:
        "Collect prize hampers from the admin office, label them (1st / 2nd / 3rd / Best UI), and store securely until the closing ceremony.",
      status: "open",
      dueAt: new Date("2026-11-14T17:00:00Z"),
      assigneeId: null,
    },
    {
      id: "task-hackathon-catering",
      activityId: hackathon.id,
      title: "Coordinate Overnight Catering",
      description:
        "Confirm dinner, midnight snacks, and breakfast order with Campus Canteen. Collect all itemised receipts for reimbursement claim submission.",
      status: "open",
      dueAt: new Date("2026-11-13T12:00:00Z"),
      assigneeId: null,
    },
    // Tech Summit tasks
    {
      id: "task-summit-speaker-comms",
      activityId: techSummit.id,
      title: "Send Speaker Briefing Packs",
      description:
        "Email confirmed speakers with the agenda, AV requirements checklist, venue map, and parking instructions. Follow up by 2 Dec if no acknowledgement.",
      status: "open",
      dueAt: new Date("2026-11-29T18:00:00Z"),
      assigneeId: null,
    },
    {
      id: "task-summit-livestream",
      activityId: techSummit.id,
      title: "Set Up Livestream & Recording",
      description:
        "Test OBS/Zoom Webinar in the auditorium. Ensure backup recording on local drive. Share stream link 1 hour before doors open on Summit day.",
      status: "open",
      dueAt: new Date("2026-12-06T08:30:00Z"),
      assigneeId: null,
    },
    // Bake Sale task
    {
      id: "task-bakesale-supplies",
      activityId: bakeSale.id,
      title: "Buy Baking Supplies & Packaging",
      description:
        "Purchase flour (5 kg), sugar (3 kg), butter (10 packs), baking paper, and 50 branded bags from D-Mart. Keep all receipts for a reimbursement claim.",
      status: "open",
      dueAt: new Date("2026-10-23T18:00:00Z"),
      assigneeId: volunteer.id,
    },
  ];

  for (const t of tasks) {
    await prisma.task.upsert({
      where: { id: t.id },
      create: t,
      update: { title: t.title, description: t.description },
    });
  }
  console.log("  ✔ 6 volunteer tasks seeded (Hackathon ×3, Tech Summit ×2, Bake Sale ×1)");

  // ---------------------------------------------------------------------------
  // 9. Announcements (2 public + 2 members-only)
  //
  // Audience values match schema enum: 'public' | 'members'
  // publishedAt = non-null means LIVE; null = DRAFT (not yet visible to users).
  // Only title is updated on re-run to preserve any officer edits made via UI.
  // ---------------------------------------------------------------------------
  console.log("\nSeeding announcements...");

  const announcements = [
    {
      id: "announcement-welcome-2026",
      title: "Welcome to Skyline Student Association (2026-2027)!",
      body: "We are thrilled to begin the new academic year. Check out upcoming events, get discounted tickets as a club member, and explore the club merchandise store!",
      audience: "public",
      authorId: officer.id,
      activityId: null,
      publishedAt: new Date("2026-10-01T10:00:00Z"),
    },
    {
      id: "announcement-hackathon-open-2026",
      title: "Hackathon 2026 Registration is Now Open!",
      body: "The Annual Skyline Hackathon is back — 24 hours, 100 seats, and ₹50,000 in prizes. Members get tickets at ₹250 (regular ₹500). Secure your spot before it sells out!",
      audience: "public",
      authorId: officer.id,
      activityId: hackathon.id,
      publishedAt: new Date("2026-10-10T09:00:00Z"),
    },
    {
      id: "announcement-gbm-nov-2026",
      title: "General Body Meeting — November 2026 Agenda",
      body: "**Date:** Saturday, 1 November 2026, 11:00 AM\n**Venue:** Seminar Hall 2, Block B\n\n**Agenda:**\n1. Treasurer's financial update (Q2 dues collection)\n2. Hackathon task assignment review\n3. Merchandise reorder decision\n4. Any Other Business\n\nAttendance is mandatory for all committee members.",
      audience: "members",
      authorId: officer.id,
      activityId: null,
      publishedAt: new Date("2026-10-25T08:00:00Z"),
    },
    {
      id: "announcement-bakesale-volunteers-2026",
      title: "URGENT: Bake Sale Volunteer Slots Still Open",
      body: "We still need 4 more volunteers for the Bake Sale on 25 October. Roles: table managers, cashiers, and bakers. Please DM Olivia by **22 October**. Volunteers receive a free Skyline Tote Bag!",
      audience: "members",
      authorId: officer.id,
      activityId: bakeSale.id,
      publishedAt: new Date("2026-10-18T12:00:00Z"),
    },
  ];

  for (const a of announcements) {
    await prisma.announcement.upsert({
      where: { id: a.id },
      create: a,
      update: { title: a.title },
    });
  }
  console.log("  ✔ 4 announcements seeded (2 public, 2 members-only)");

  // ---------------------------------------------------------------------------
  // 10. Sample Pending Expense Claim
  //
  // Demonstrates the Treasurer claims queue on the Desk.
  // NO CashbookEntry is written here — that is written only when a treasurer
  // approves the claim through ClaimService.approve() in the service layer.
  // Status field is NOT updated on re-run (treasurer may have already acted).
  // ---------------------------------------------------------------------------
  console.log("\nSeeding sample expense claim...");

  await prisma.claim.upsert({
    where: { id: "claim-bakesale-supplies-001" },
    create: {
      id: "claim-bakesale-supplies-001",
      claimantId: volunteer.id,
      activityId: bakeSale.id,
      title: "Bake Sale Supplies — D-Mart Run",
      reason:
        "Purchased baking flour (5 kg), caster sugar (3 kg), butter (10 packs), baking paper rolls, and 50 branded paper bags for the Bake Sale on 25 Oct. Receipt available on request.",
      amountPaise: BigInt(187500), // ₹1,875.00
      status: "submitted",
      reviewerId: null,
      reviewNote: null,
      payoutRef: null,
      paidAt: null,
    },
    update: {
      // Never reset status or financials — preserve any treasurer action
      title: "Bake Sale Supplies — D-Mart Run",
    },
  });
  console.log("  ✔ Sample pending claim: ₹1,875 from Veer Volunteer (Bake Sale supplies)");

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\n🎉 Skyline ERP demo data seeded successfully!");
  console.log("   Accounts      : student | officer | treasurer | volunteer @skyline.edu");
  console.log("   Events        : Hackathon (Nov 15-16) · Tech Summit (Dec 6) · Bake Sale (Oct 25)");
  console.log("   Merchandise   : Hoodie · T-Shirt · Tote Bag  (18 variants total)");
  console.log("   Tasks         : 6 volunteer tasks across 3 events");
  console.log("   Announcements : 4 (2 public, 2 members-only)");
  console.log("   Claims        : 1 pending ₹1,875 — awaiting treasurer review");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
