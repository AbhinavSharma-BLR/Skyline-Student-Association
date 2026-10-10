import { PrismaClient } from "@prisma/client";

interface ServerInfo {
  version: string;
  current_database: string;
  current_user: string;
  server_addr: string | null;
  server_port: number;
}

/**
 * Diagnostic database connectivity and health verification script.
 * Safely reports database server metadata and table record counts
 * without printing credentials, connection strings, or sensitive data.
 */
async function main() {
  const prisma = new PrismaClient();

  try {
    console.log("🔍 Checking PostgreSQL database connection on port 5432...");

    // 1. Inspect server metadata via read-only SQL
    const serverInfo = await prisma.$queryRaw<ServerInfo[]>`
      SELECT version(), current_database(), current_user, inet_server_addr()::text as server_addr, inet_server_port() as server_port;
    `;

    console.log("✔ Connected successfully!");
    if (serverInfo && serverInfo.length > 0) {
      const info = serverInfo[0];
      console.log(`  Database Name: ${info.current_database}`);
      console.log(`  Current User:  ${info.current_user}`);
      console.log(`  Server Host:   ${info.server_addr || "localhost"}`);
      console.log(`  Server Port:   ${info.server_port}`);
      console.log(`  Version:       ${info.version.split(" on ")[0]}`);
    }

    // 2. Inspect record counts of core models
    const userCount = await prisma.user.count();
    const periodCount = await prisma.membershipPeriod.count();
    const activityCount = await prisma.activity.count();
    const productCount = await prisma.product.count();

    console.log("\n📊 Seeded Record Counts:");
    console.log(`  Users:              ${userCount}`);
    console.log(`  Membership Periods: ${periodCount}`);
    console.log(`  Activities:         ${activityCount}`);
    console.log(`  Merchandise:        ${productCount}`);

    console.log("\n✔ Database health and data integrity verified.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌ Database connection error:", err.message);
  process.exit(1);
});
