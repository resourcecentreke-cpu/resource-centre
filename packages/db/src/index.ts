// Singleton Prisma client shared across the backend.
// NOTE: run `pnpm db:generate` after Phase 1 so @prisma/client types exist.
import { PrismaClient } from '@prisma/client';

export * from '@prisma/client';

// Read NODE_ENV via globalThis so this entry compiles without @types/node
// (it's built standalone for production runtime); `process` exists at runtime.
const globalForPrisma = globalThis as unknown as {
  __rcPrisma?: PrismaClient;
  process?: { env?: Record<string, string | undefined> };
};
const NODE_ENV = globalForPrisma.process?.env?.NODE_ENV;

export const prisma: PrismaClient =
  globalForPrisma.__rcPrisma ??
  new PrismaClient({ log: NODE_ENV === 'development' ? ['warn', 'error'] : ['error'] });

if (NODE_ENV !== 'production') globalForPrisma.__rcPrisma = prisma;
