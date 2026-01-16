import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Prisma } from '@prisma/client';

export function mapPositionPrismaToDomain(
  positionDb: Prisma.PositionGetPayload<{
    include: {
      department: true;
    };
  }>,
) {
  return {
    name: positionDb.name,
    code: positionDb.code,
    description: positionDb.description ?? undefined,
    departmentId: positionDb.departmentId
      ? new UniqueEntityID(positionDb.departmentId)
      : undefined,
    level: positionDb.level,
    minSalary: positionDb.minSalary ? Number(positionDb.minSalary) : undefined,
    maxSalary: positionDb.maxSalary ? Number(positionDb.maxSalary) : undefined,
    baseSalary: positionDb.baseSalary
      ? Number(positionDb.baseSalary)
      : undefined,
    isActive: positionDb.isActive,
    deletedAt: positionDb.deletedAt ?? undefined,
    createdAt: positionDb.createdAt,
    updatedAt: positionDb.updatedAt,
  };
}
