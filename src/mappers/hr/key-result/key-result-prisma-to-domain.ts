import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { KeyResult as PrismaKeyResult } from '@prisma/generated/client.js';

export function mapKeyResultPrismaToDomain(keyResult: PrismaKeyResult) {
  return {
    tenantId: new UniqueEntityID(keyResult.tenantId),
    objectiveId: new UniqueEntityID(keyResult.objectiveId),
    title: keyResult.title,
    description: keyResult.description ?? undefined,
    type: keyResult.type,
    startValue: keyResult.startValue,
    targetValue: keyResult.targetValue,
    currentValue: keyResult.currentValue,
    unit: keyResult.unit ?? undefined,
    status: keyResult.status,
    weight: keyResult.weight,
    createdAt: keyResult.createdAt,
    updatedAt: keyResult.updatedAt,
  };
}
