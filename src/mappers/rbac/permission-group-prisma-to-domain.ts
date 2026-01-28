import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionGroup } from '@/entities/rbac/permission-group';
import type { PermissionGroup as PrismaPermissionGroup } from '@prisma/generated/client.js';

export function mapPermissionGroupPrismaToDomain(
  prismaGroup: PrismaPermissionGroup,
): PermissionGroup {
  return PermissionGroup.create(
    {
      id: new UniqueEntityID(prismaGroup.id),
      name: prismaGroup.name,
      slug: prismaGroup.slug,
      description: prismaGroup.description,
      isSystem: prismaGroup.isSystem,
      isActive: prismaGroup.isActive,
      color: prismaGroup.color,
      priority: prismaGroup.priority,
      parentId: prismaGroup.parentId
        ? new UniqueEntityID(prismaGroup.parentId)
        : null,
      createdAt: prismaGroup.createdAt,
      updatedAt: prismaGroup.updatedAt,
      deletedAt: prismaGroup.deletedAt,
    },
    new UniqueEntityID(prismaGroup.id),
  );
}
