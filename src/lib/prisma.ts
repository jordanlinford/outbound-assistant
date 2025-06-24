import { PrismaClient } from '../generated/prisma';

declare global {
  var prisma: PrismaClient | undefined;
}

// Enhanced Prisma client with better connection handling
const createPrismaClient = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  // Add connection test
  client.$connect().catch((error) => {
    console.error('Failed to connect to database:', error);
  });

  return client;
};

export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Helper function to ensure Prisma is ready
export const ensurePrismaConnection = async () => {
  try {
    await prisma.$connect();
    return true;
  } catch (error) {
    console.error('Prisma connection failed:', error);
    return false;
  }
};

// Health check function
export const prismaHealthCheck = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('Prisma health check failed:', error);
    return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error', timestamp: new Date().toISOString() };
  }
}; 