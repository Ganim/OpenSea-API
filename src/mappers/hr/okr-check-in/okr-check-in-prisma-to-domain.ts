import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OKRCheckIn as PrismaOKRCheckIn } from '@prisma/generated/client.js';

export function mapOKRCheckInPrismaToDomain(checkIn: PrismaOKRCheckIn) {
  return {
    tenantId: new UniqueEntityID(checkIn.tenantId),
    keyResultId: new UniqueEntityID(checkIn.keyResultId),
    employeeId: new UniqueEntityID(checkIn.employeeId),
    previousValue: checkIn.previousValue,
    newValue: checkIn.newValue,
    note: checkIn.note ?? undefined,
    confidence: checkIn.confidence,
    createdAt: checkIn.createdAt,
  };
}
