// Singleton Prisma client shared across the backend.
// NOTE: run `pnpm db:generate` after Phase 1 so @prisma/client types exist.
import { PrismaClient } from '@prisma/client';

export * from '@prisma/client';

const globalForPrisma = globalThis as unknown as { __rcPrisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.__rcPrisma ??
  new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'] });

if (process.env.NODE_ENV !== 'production') globalForPrisma.__rcPrisma = prisma;
