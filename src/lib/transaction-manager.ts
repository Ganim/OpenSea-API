import { prisma } from './prisma';

/**
 * Prisma transaction client type.
 * This is the `tx` parameter received inside `prisma.$transaction(async (tx) => ...)`.
 * It has the same model accessors as PrismaClient but runs within a transaction.
 */
export type TransactionClient = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/**
 * Abstract transaction manager interface for use in use cases.
 * Keeps the domain layer decoupled from Prisma specifics.
 */
export interface TransactionManager {
  run<T>(fn: (tx: TransactionClient) => Promise<T>): Promise<T>;
}

/**
 * Prisma implementation of TransactionManager.
 * Uses interactive transactions with a 30-second timeout.
 */
export class PrismaTransactionManager implements TransactionManager {
  async run<T>(fn: (tx: TransactionClient) => Promise<T>): Promise<T> {
    return prisma.$transaction(
      (tx) => fn(tx as unknown as TransactionClient),
      { timeout: 30_000 },
    );
  }
}
