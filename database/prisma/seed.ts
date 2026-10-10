import { PrismaClient } from "@prisma/client";
import { auth } from "../../Backend/lib/auth/auth";

const prisma = new PrismaClient();

async function getOrCreateUser(email: string, name: string, password: string) {
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    return existing;
  }

  // Use Better Auth server API to create user with properly hashed password
  try {
    const res = await auth.api.signUpEmail({
      body: {
        email,
        name,
        password,
      },
    });

    if (res?.user) {
      return res.user;
    }
  } catch (err) {
    // If sign up fails or user was partially inserted, query again
  }

  const fresh = await prisma.user.findUnique({ where: { email } });
  if (!fresh) {
    throw new Error(`Failed to create or retrieve user: ${email}`);
  }
  return fresh;
}

async function main() {
  console.log("🌱 Starting Skyline ERP demo seeding...");

  // 1. Seed Users (Ordinary Student, Officer, Treasurer)
  console.log("Seeding core demo accounts...");
  const student = await getOrCreateUser(
    "student@skyline.edu",
    "Sam Student",
    "StudentPassword123!"
  );
  console.log(`  ✔ Student user: ${student.email} (${student.id})`);

  const officer = await getOrCreateUser(
    "officer@skyline.edu",
    "Olivia Officer",
    "OfficerPassword123!"
  );
  console.log(`  ✔ Officer user: ${officer.email} (${officer.id})`);

  const treasurer = await getOrCreateUser(
    "treasurer@skyline.edu",
    "Trevor Treasurer",
    "TreasurerPassword123!"
  );
  console.log(`  ✔ Treasurer user: ${treasurer.email} (${treasurer.id})`);

  // 2. Assign Administrative Roles (Decoupled from student membership)
  await prisma.role.upsert({
    where: {
      userId_role: {
        userId: officer.id,
        role: "officer",
      },
    },
    create: {
      userId: officer.id,
      role: "officer",
    },
    update: {},
  });
  console.log("  ✔ Role 'officer' assigned to Olivia");

  await prisma.role.upsert({
    where: {
      userId_role: {
        userId: treasurer.id,
        role: "treasurer",
      },
    },
    create: {
      userId: treasurer.id,
      role: "treasurer",
    },
    update: {},
  });
  console.log("  ✔ Role 'treasurer' assigned to Trevor");

  // 3. Seed Club Settings
  await prisma.clubSettings.upsert({
    where: { id: "club-settings-skyline" },
    create: {
      id: "club-settings-skyline",
      name: "Skyline Student Association",
      description: "Official student association of Skyline University fostering community and technology.",
    },
    update: {
      name: "Skyline Student Association",
    },
  });
  console.log("  ✔ Club settings initialized");

  // 4. Seed Current Membership Period
  const period = await prisma.membershipPeriod.upsert({
    where: { academicYear: "2026-2027" },
    create: {
      id: "period-2026-2027",
      academicYear: "2026-2027",
      label: "Academic Year 2026-2027",
      startsAt: new Date("2026-08-01T00:00:00Z"),
      endsAt: new Date("2027-07-31T23:59:59Z"),
      duesPaise: BigInt(50000), // ₹500.00
    },
    update: {
      label: "Academic Year 2026-2027",
      duesPaise: BigInt(50000),
    },
  });
  console.log(`  ✔ Membership period 2026-2027: dues = ₹500 (id: ${period.id})`);

  // 5. Seed Published Event Activity
  const activity = await prisma.activity.upsert({
    where: { id: "activity-hackathon-2026" },
    create: {
      id: "activity-hackathon-2026",
      kind: "event",
      title: "Annual Skyline Hackathon 2026",
      description: "Join 200+ students for 24 hours of innovation, mentorship, and prize awards!",
      venue: "Student Union Grand Hall",
      startsAt: new Date("2026-11-15T09:00:00Z"),
      endsAt: new Date("2026-11-16T18:00:00Z"),
      capacity: 100,
      memberPricePaise: BigInt(25000), // ₹250.00
      regularPricePaise: BigInt(50000), // ₹500.00
      published: true,
      ticketed: true,
      createdById: officer.id,
    },
    update: {
      capacity: 100,
      memberPricePaise: BigInt(25000),
      regularPricePaise: BigInt(50000),
    },
  });
  console.log(`  ✔ Activity: ${activity.title} (member: ₹250, regular: ₹500)`);

  // 6. Assign Staff Capability for Check-In
  await prisma.activityStaff.upsert({
    where: {
      activityId_userId_capability: {
        activityId: activity.id,
        userId: officer.id,
        capability: "checkin",
      },
    },
    create: {
      activityId: activity.id,
      userId: officer.id,
      capability: "checkin",
    },
    update: {},
  });
  console.log("  ✔ Olivia designated as Check-In staff for Hackathon");

  // 7. Seed Merchandise & Variant Stock
  const hoodie = await prisma.product.upsert({
    where: { id: "prod-hoodie-2026" },
    create: {
      id: "prod-hoodie-2026",
      name: "Skyline Premium Club Hoodie",
      description: "Heavyweight navy cotton fleece embroidered with the Skyline Student Association crest.",
      imagePath: "/images/merch/hoodie-navy.jpg",
      regularPricePaise: BigInt(150000), // ₹1,500.00
      memberPricePaise: BigInt(120000), // ₹1,200.00
      active: true,
      createdById: officer.id,
    },
    update: {
      regularPricePaise: BigInt(150000),
      memberPricePaise: BigInt(120000),
    },
  });

  const sizes = [
    { size: "M", stock: 25 },
    { size: "L", stock: 30 },
    { size: "XL", stock: 15 },
  ];

  for (const s of sizes) {
    await prisma.variant.upsert({
      where: {
        productId_size_color: {
          productId: hoodie.id,
          size: s.size,
          color: "Navy",
        },
      },
      create: {
        productId: hoodie.id,
        size: s.size,
        color: "Navy",
        stockTotal: s.stock,
        stockReserved: 0,
        stockSold: 0,
      },
      update: {
        stockTotal: s.stock,
      },
    });
  }
  console.log("  ✔ Merchandise product & sizes (M: 25, L: 30, XL: 15) seeded");

  // 8. Seed Volunteer Task
  await prisma.task.upsert({
    where: { id: "task-venue-setup" },
    create: {
      id: "task-venue-setup",
      activityId: activity.id,
      title: "Setup Registration Desk & QR Scanners",
      description: "Arrive at 8:00 AM to set up welcome kits, print attendee badges, and verify door scanners.",
      status: "open",
      dueAt: new Date("2026-11-15T08:30:00Z"),
      assigneeId: null,
    },
    update: {
      title: "Setup Registration Desk & QR Scanners",
    },
  });
  console.log("  ✔ Volunteer task created for Hackathon");

  // 9. Seed Announcement
  await prisma.announcement.upsert({
    where: { id: "announcement-welcome-2026" },
    create: {
      id: "announcement-welcome-2026",
      title: "Welcome to Skyline Student Association (2026-2027)!",
      body: "We are thrilled to begin the new academic year. Check out upcoming events, get discounted tickets as a club member, and explore the club merchandise store!",
      audience: "public",
      authorId: officer.id,
      activityId: null,
      publishedAt: new Date("2026-10-01T10:00:00Z"),
    },
    update: {
      title: "Welcome to Skyline Student Association (2026-2027)!",
    },
  });
  console.log("  ✔ Public welcome announcement seeded");

  console.log("🎉 Skyline ERP demo data seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
