import { PrismaClient } from "@prisma/client";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

/**
 * Explicit error thrown when attempting to use the database client
 * before the Database Developer has created the schema and generated the client.
 */
export class DatabaseDependencyError extends Error {
  constructor(
    message = "Database client has not been initialized. Prisma schema and migrations (owned by Database Developer) must be applied before executing database queries."
  ) {
    super(message);
    this.name = "DatabaseDependencyError";
  }
}

/**
 * Returns a defensive proxy that throws DatabaseDependencyError upon any model or query access.
 * Does not silently mock successful reads/writes or hide database absence.
 */
function createUninitializedClient(): PrismaClient {
  return new Proxy({} as PrismaClient, {
    get(_target, prop) {
      if (prop === "then" || prop === Symbol.toStringTag) {
        return undefined;
      }
      return () => {
        throw new DatabaseDependencyError();
      };
    },
  });
}

/**
 * Lazily instantiates the PrismaClient singleton.
 * Prevents build-time module evaluation crashes while ensuring
 * that any actual runtime database query fails fast with DatabaseDependencyError.
 */
function getOrInitPrisma(): PrismaClient {
  if (globalThis.prismaGlobal) {
    return globalThis.prismaGlobal;
  }

  try {
    const client = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });

    if (process.env.NODE_ENV !== "production") {
      globalThis.prismaGlobal = client;
    }

    return client;
  } catch {
    // Unmigrated or ungenerated client; return defensive client that fails on query execution
    return createUninitializedClient();
  }
}

/**
 * Exported PrismaClient instance.
 * Defers client instantiation until query execution.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getOrInitPrisma();
    const value = (client as any)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
