import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Permission } from '@/entities/rbac/permission';
import { PermissionCode } from '@/entities/rbac/value-objects/permission-code';
import type { Permission as PrismaPermission } from '@prisma/client';

export function mapPermissionPrismaToDomain(
  prismaPermission: PrismaPermission,
): Permission {
  return Permission.create(
    {
      id: new UniqueEntityID(prismaPermission.id),
      code: PermissionCode.create(prismaPermission.code),
      name: prismaPermission.name,
      description: prismaPermission.description,
      module: prismaPermission.module,
      resource: prismaPermission.resource,
      action: prismaPermission.action,
      isSystem: prismaPermission.isSystem,
      metadata: prismaPermission.metadata as Record<string, unknown>,
      createdAt: prismaPermission.createdAt,
      updatedAt: prismaPermission.updatedAt,
    },
    new UniqueEntityID(prismaPermission.id),
  );
}
