import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// When running on Vercel serverless functions with SQLite, ensure DB file is accessible in /tmp
if (process.env.VERCEL && process.env.DATABASE_URL?.includes('file:')) {
  const tmpDbPath = '/tmp/dev.db';
  const localDbPath = path.resolve(process.cwd(), 'prisma/dev.db');
  const rootDbPath = path.resolve(process.cwd(), 'dev.db');
  const source = fs.existsSync(localDbPath)
    ? localDbPath
    : fs.existsSync(rootDbPath)
    ? rootDbPath
    : null;

  if (source && !fs.existsSync(tmpDbPath)) {
    try {
      fs.copyFileSync(source, tmpDbPath);
      process.env.DATABASE_URL = 'file:/tmp/dev.db';
    } catch (e) {
      console.warn('Failed to copy db to /tmp on Vercel:', e);
    }
  } else if (fs.existsSync(tmpDbPath)) {
    process.env.DATABASE_URL = 'file:/tmp/dev.db';
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

