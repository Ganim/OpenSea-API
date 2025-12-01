import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Prisma } from '@prisma/client';

export function mapDepartmentPrismaToDomain(
  departmentDb: Prisma.DepartmentGetPayload<{
    include: {
      parent: true;
      manager: true;
    };
  }>,
) {
  return {
    name: departmentDb.name,
    code: departmentDb.code,
    description: departmentDb.description ?? undefined,
    parentId: departmentDb.parentId
      ? new UniqueEntityID(departmentDb.parentId)
      : undefined,
    managerId: departmentDb.managerId
      ? new UniqueEntityID(departmentDb.managerId)
      : undefined,
    isActive: departmentDb.isActive,
    deletedAt: departmentDb.deletedAt ?? undefined,
    createdAt: departmentDb.createdAt,
    updatedAt: departmentDb.updatedAt,
  };
}
