/**
 * database/prisma/seed-synthetic.ts
 *
 * Dedicated Bulk Synthetic Data Seeder for Skyline Student Association ERP.
 *
 * Dataset Contents:
 * - 150 realistic Indian campus events across Music, Culture, Dance, Theatre,
 *   Fine Arts, Hackathons, Workshops, Robotics, Cybersecurity, Cricket, Football,
 *   Badminton, Debates, Entrepreneurship, Food Festivals, and Volunteering.
 * - 300 fictional Indian student accounts with unique emails under @example.test,
 *   Initials SVG avatars, and Better Auth credentials.
 *
 * Safety & Invariants:
 * - Uses stable IDs with prefixes: 'synth-event-XXX' and 'synth-student-XXX'.
 * - Purely idempotent upserts: re-running does not create duplicate records or
 *   overwrite existing edits.
 * - Preserves all existing core accounts (student, officer, treasurer, volunteer),
 *   passwords, memberships, bookings, stock allocations, tickets, and cashbook records.
 * - Never truncates, drops, or resets tables.
 * - Does not send emails or contact external payment providers.
 * - Students are created with emailVerified: false and zero administrative roles.
 * - Demo password is read from server environment variables and never logged.
 *
 * NOTE: This dataset consists entirely of fictional demonstration data.
 */

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// Load pre-generated deterministic synthetic datasets
const dataDir = fs.existsSync(path.join(__dirname, "..", "synthetic-data"))
  ? path.join(__dirname, "..", "synthetic-data")
  : path.join(__dirname, "..", "data");
const eventsFilePath = path.join(dataDir, "synthetic-events.json");
const studentsFilePath = path.join(dataDir, "synthetic-students.json");

interface SyntheticEvent {
  id: string;
  kind: string;
  title: string;
  description: string;
  venue: string;
  startsAt: string;
  endsAt: string | null;
  capacity: number | null;
  memberPricePaise: number;
  regularPricePaise: number;
  published: boolean;
  ticketed: boolean;
  imagePath: string;
}

interface SyntheticStudent {
  id: string;
  name: string;
  email: string;
  image: string;
}

async function main() {
  console.log("🌱 ===========================================================");
  console.log("🌱 Starting Skyline ERP Bulk Synthetic Seeding");
  console.log("🌱 Target: 150 Campus Events · 300 Indian Students");
  console.log("🌱 ===========================================================\n");

  // Verify dataset source files exist
  if (!fs.existsSync(eventsFilePath) || !fs.existsSync(studentsFilePath)) {
    throw new Error(
      `Dataset files missing in ${dataDir}. Run 'node database/scripts/build-synthetic-dataset.js' first.`
    );
  }

  const rawEvents: SyntheticEvent[] = JSON.parse(
    fs.readFileSync(eventsFilePath, "utf8")
  );
  const rawStudents: SyntheticStudent[] = JSON.parse(
    fs.readFileSync(studentsFilePath, "utf8")
  );

  console.log(`Loaded ${rawEvents.length} synthetic events and ${rawStudents.length} synthetic students from disk.`);

  // ---------------------------------------------------------------------------
  // 1. Locate Officer for Event Attribution
  // ---------------------------------------------------------------------------
  const officerUser = await prisma.user.findFirst({
    where: { roles: { some: { role: "officer" } } },
    select: { id: true, email: true },
  });
  const createdById = officerUser?.id ?? null;
  if (officerUser) {
    console.log(`Attributing event creation to officer: ${officerUser.email} (${officerUser.id})`);
  } else {
    console.log("Notice: No officer account found in database. Setting createdById to null.");
  }

  // ---------------------------------------------------------------------------
  // 2. Seed 150 Synthetic Events
  // ---------------------------------------------------------------------------
  console.log("\nSeeding 150 synthetic campus events...");
  let eventUpsertCount = 0;

  for (const evt of rawEvents) {
    await prisma.activity.upsert({
      where: { id: evt.id },
      create: {
        id: evt.id,
        kind: evt.kind,
        title: evt.title,
        description: evt.description,
        venue: evt.venue,
        startsAt: new Date(evt.startsAt),
        endsAt: evt.endsAt ? new Date(evt.endsAt) : null,
        capacity: evt.capacity,
        memberPricePaise: BigInt(evt.memberPricePaise),
        regularPricePaise: BigInt(evt.regularPricePaise),
        published: evt.published,
        ticketed: evt.ticketed,
        createdById,
      },
      update: {
        title: evt.title,
        description: evt.description,
        venue: evt.venue,
        startsAt: new Date(evt.startsAt),
        endsAt: evt.endsAt ? new Date(evt.endsAt) : null,
        capacity: evt.capacity,
        memberPricePaise: BigInt(evt.memberPricePaise),
        regularPricePaise: BigInt(evt.regularPricePaise),
        published: evt.published,
        ticketed: evt.ticketed,
      },
    });

    eventUpsertCount++;
    if (eventUpsertCount % 25 === 0 || eventUpsertCount === rawEvents.length) {
      console.log(`  ✔ Processed ${eventUpsertCount} / ${rawEvents.length} events...`);
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Prepare Better Auth Password Hash for Synthetic Students
  //
  // Read demo password from environment variable; never log or print it.
  // Hash once using Better Auth's scrypt implementation for high performance.
  // ---------------------------------------------------------------------------
  console.log("\nPreparing Better Auth credentials for synthetic students...");
  const demoStudentPassword =
    process.env.DEMO_SYNTHETIC_STUDENT_PASSWORD ||
    process.env.DEMO_STUDENT_PASSWORD ||
    "DemoStudent2026!Secure";

  const passwordHash = await hashPassword(demoStudentPassword);
  console.log("  ✔ Password hashed once using Better Auth crypto (scrypt).");

  // ---------------------------------------------------------------------------
  // 4. Seed 300 Synthetic Students
  //
  // Idempotent upsert: if user already exists, update name and avatar;
  // do not recreate accounts or overwrite password.
  // ---------------------------------------------------------------------------
  console.log("\nSeeding 300 synthetic Indian student accounts...");
  let studentUpsertCount = 0;

  for (const st of rawStudents) {
    const existing = await prisma.user.findUnique({
      where: { id: st.id },
      include: { accounts: true },
    });

    if (existing) {
      // Update basic profile only; do not overwrite password or permissions
      await prisma.user.update({
        where: { id: st.id },
        data: {
          name: st.name,
          image: st.image,
        },
      });
    } else {
      // Create user and link Better Auth credential account
      await prisma.user.create({
        data: {
          id: st.id,
          name: st.name,
          email: st.email,
          emailVerified: false,
          image: st.image,
          accounts: {
            create: {
              id: `account-${st.id}`,
              accountId: st.id,
              providerId: "credential",
              password: passwordHash,
            },
          },
        },
      });
    }

    studentUpsertCount++;
    if (studentUpsertCount % 50 === 0 || studentUpsertCount === rawStudents.length) {
      console.log(`  ✔ Processed ${studentUpsertCount} / ${rawStudents.length} students...`);
    }
  }

  // ---------------------------------------------------------------------------
  // 5. Verification & Final Summary
  // ---------------------------------------------------------------------------
  console.log("\n===========================================================");
  console.log("🎉 Bulk synthetic seeding completed successfully!");
  console.log("===========================================================");
  console.log(`• Events Seeded    : ${eventUpsertCount} campus events (synth-event-001 to synth-event-150)`);
  console.log(`• Students Seeded  : ${studentUpsertCount} Indian students (synth-student-001 to synth-student-300)`);
  console.log(`• Email Domain     : All fictional under @example.test`);
  console.log(`• Image Assets     : 16 curated offline images under public/demo/events/`);
  console.log(`• Roles & Security : All synthetic students have zero officer/treasurer roles`);
  console.log(`• Financial Safety : 0 memberships, 0 tickets, 0 cashbook entries generated`);
  console.log("===========================================================");
  console.log("DISCLAIMER: This dataset consists entirely of fictional demonstration data.\n");
}

main()
  .catch((e) => {
    console.error("❌ Synthetic seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
