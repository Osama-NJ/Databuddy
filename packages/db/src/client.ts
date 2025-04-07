import { PrismaClient } from "../generated/client";
// import { createAuditMiddleware } from './middleware';

export * from '../generated/client';

// Helper function to access environment variables in both Node.js and Cloudflare Workers
function getEnv(key: string) {
  return process.env[key] || 
         (typeof globalThis.process !== 'undefined' ? globalThis.process.env?.[key] : null) || 
         (typeof globalThis !== 'undefined' && key in globalThis ? (globalThis as any)[key] : null);
}

// Helper to check NODE_ENV
function isProduction() {
  const nodeEnv = getEnv('NODE_ENV');
  return nodeEnv === 'production';
}

/**
 * Get a properly configured PrismaClient instance
 */
const getPrismaClient = () => {
  const client = new PrismaClient({
    // log: ['error'],
  });
  
  // Add audit middleware
  // client.$use(createAuditMiddleware());
  
  return client;
};

// Add prisma to the global type
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
};

// Export a singleton instance of PrismaClient
export const prisma = globalForPrisma.prisma ?? getPrismaClient();

// Prevent multiple instances during development due to HMR
if (!isProduction()) {
  globalForPrisma.prisma = prisma;
}

// Export a function to create a client with custom context
export const createClientWithContext = (context: { userId?: string; ipAddress?: string; userAgent?: string }) => {
  const client = new PrismaClient();
  // client.$use(createAuditMiddleware(context));
  return client;
};
