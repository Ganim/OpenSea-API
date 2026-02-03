import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TimeBank as PrismaTimeBank } from '@prisma/generated/client.js';

export function mapTimeBankPrismaToDomain(timeBank: PrismaTimeBank) {
  return {
    tenantId: new UniqueEntityID(timeBank.tenantId),
    employeeId: new UniqueEntityID(timeBank.employeeId),
    balance: Number(timeBank.balance),
    year: timeBank.year,
    createdAt: timeBank.createdAt,
    updatedAt: timeBank.updatedAt,
  };
}
