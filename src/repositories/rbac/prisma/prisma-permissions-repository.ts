import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Permission } from '@/entities/rbac/permission';
import { PermissionCode } from '@/entities/rbac/value-objects/permission-code';
import { prisma } from '@/lib/prisma';
import { mapPermissionPrismaToDomain } from '@/mappers/rbac/permission-prisma-to-domain';
import type {
  CreatePermissionSchema,
  ListPermissionsParams,
  PermissionsRepository,
  UpdatePermissionSchema,
} from '../permissions-repository';

export class PrismaPermissionsRepository implements PermissionsRepository {
  // CREATE
  async create(data: CreatePermissionSchema): Promise<Permission> {
    const permission = await prisma.permission.create({
      data: {
        code: data.code.value,
        name: data.name,
        description: data.description,
        module: data.module,
        resource: data.resource,
        action: data.action,
        isSystem: data.isSystem,
        metadata: data.metadata as never,
      },
    });

    return mapPermissionPrismaToDomain(permission);
  }

  // UPDATE
  async update(data: UpdatePermissionSchema): Promise<Permission | null> {
    try {
      const permission = await prisma.permission.update({
        where: { id: data.id.toString() },
        data: {
          name: data.name,
          description: data.description,
          metadata: data.metadata as never,
        },
      });

      return mapPermissionPrismaToDomain(permission);
    } catch {
      return null;
    }
  }

  // DELETE
  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.permission.delete({
      where: { id: id.toString() },
    });
  }

  // RETRIEVE
  async findById(id: UniqueEntityID): Promise<Permission | null> {
    const permission = await prisma.permission.findUnique({
      where: { id: id.toString() },
    });

    if (!permission) return null;

    return mapPermissionPrismaToDomain(permission);
  }

  async findByCode(code: PermissionCode): Promise<Permission | null> {
    const permission = await prisma.permission.findUnique({
      where: { code: code.value },
    });

    if (!permission) return null;

    return mapPermissionPrismaToDomain(permission);
  }

  async findManyByIds(ids: UniqueEntityID[]): Promise<Permission[]> {
    const permissions = await prisma.permission.findMany({
      where: {
        id: {
          in: ids.map((id) => id.toString()),
        },
      },
    });

    return permissions.map(mapPermissionPrismaToDomain);
  }

  async findManyByCodes(codes: PermissionCode[]): Promise<Permission[]> {
    const permissions = await prisma.permission.findMany({
      where: {
        code: {
          in: codes.map((code) => code.value),
        },
      },
    });

    return permissions.map(mapPermissionPrismaToDomain);
  }

  // LIST
  async listAll(params?: ListPermissionsParams): Promise<Permission[]> {
    const { module, resource, action, isSystem, page, limit } = params || {};

    const permissions = await prisma.permission.findMany({
      where: {
        module: module,
        resource: resource,
        action: action,
        isSystem: isSystem,
      },
      skip: page && limit ? (page - 1) * limit : undefined,
      take: limit,
      orderBy: [{ module: 'asc' }, { resource: 'asc' }, { action: 'asc' }],
    });

    return permissions.map(mapPermissionPrismaToDomain);
  }

  async listByModule(module: string): Promise<Permission[]> {
    const permissions = await prisma.permission.findMany({
      where: { module },
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });

    return permissions.map(mapPermissionPrismaToDomain);
  }

  async listByResource(resource: string): Promise<Permission[]> {
    const permissions = await prisma.permission.findMany({
      where: { resource },
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });

    return permissions.map(mapPermissionPrismaToDomain);
  }

  async listSystemPermissions(): Promise<Permission[]> {
    const permissions = await prisma.permission.findMany({
      where: { isSystem: true },
      orderBy: [{ module: 'asc' }, { resource: 'asc' }, { action: 'asc' }],
    });

    return permissions.map(mapPermissionPrismaToDomain);
  }

  // UTILITY
  async exists(code: PermissionCode): Promise<boolean> {
    const permission = await prisma.permission.findUnique({
      where: { code: code.value },
      select: { id: true },
    });

    return !!permission;
  }

  async count(): Promise<number> {
    return await prisma.permission.count();
  }
}
