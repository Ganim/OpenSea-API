import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Bonus as PrismaBonus } from '@prisma/generated/client.js';

export function mapBonusPrismaToDomain(bonus: PrismaBonus) {
  return {
    tenantId: new UniqueEntityID(bonus.tenantId),
    employeeId: new UniqueEntityID(bonus.employeeId),
    name: bonus.name,
    amount: Number(bonus.amount),
    reason: bonus.reason,
    date: bonus.date,
    isPaid: bonus.isPaid,
    createdAt: bonus.createdAt,
    updatedAt: bonus.updatedAt,
  };
}
