import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionGroup } from '@/entities/rbac/permission-group';
import { prisma } from '@/lib/prisma';
import { mapPermissionGroupPrismaToDomain } from '@/mappers/rbac/permission-group-prisma-to-domain';
import type {
    CreatePermissionGroupSchema,
    ListPermissionGroupsParams,
    PermissionGroupsRepository,
    UpdatePermissionGroupSchema,
} from '../permission-groups-repository';

export class PrismaPermissionGroupsRepository
  implements PermissionGroupsRepository
{
  // CREATE
  async create(data: CreatePermissionGroupSchema): Promise<PermissionGroup> {
    const group = await prisma.permissionGroup.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        isSystem: data.isSystem,
        isActive: data.isActive,
        color: data.color,
        priority: data.priority,
        parentId: data.parentId?.toString() ?? null,
      },
    });

    return mapPermissionGroupPrismaToDomain(group);
  }

  // UPDATE
  async update(
    data: UpdatePermissionGroupSchema,
  ): Promise<PermissionGroup | null> {
    try {
      const group = await prisma.permissionGroup.update({
        where: { id: data.id.toString() },
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          isActive: data.isActive,
          color: data.color,
          priority: data.priority,
          parentId: data.parentId?.toString() ?? undefined,
          deletedAt: data.deletedAt ?? undefined,
        },
      });

      return mapPermissionGroupPrismaToDomain(group);
    } catch {
      return null;
    }
  }

  // DELETE (soft delete)
  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.permissionGroup.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: UniqueEntityID): Promise<PermissionGroup | null> {
    try {
      const group = await prisma.permissionGroup.update({
        where: { id: id.toString() },
        data: { deletedAt: null },
      });

      return mapPermissionGroupPrismaToDomain(group);
    } catch {
      return null;
    }
  }

  // RETRIEVE
  async findById(
    id: UniqueEntityID,
    includeDeleted = false,
  ): Promise<PermissionGroup | null> {
    const group = await prisma.permissionGroup.findUnique({
      where: {
        id: id.toString(),
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
    });

    if (!group) return null;

    return mapPermissionGroupPrismaToDomain(group);
  }

  async findBySlug(
    slug: string,
    includeDeleted = false,
  ): Promise<PermissionGroup | null> {
    const group = await prisma.permissionGroup.findFirst({
      where: includeDeleted
        ? { slug }
        : {
            slug,
            deletedAt: null,
          },
    });

    if (!group) return null;

    return mapPermissionGroupPrismaToDomain(group);
  }

  async findByName(name: string): Promise<PermissionGroup | null> {
    const group = await prisma.permissionGroup.findFirst({
      where: {
        name,
        deletedAt: null,
      },
    });

    if (!group) return null;

    return mapPermissionGroupPrismaToDomain(group);
  }

  async findManyByIds(ids: UniqueEntityID[]): Promise<PermissionGroup[]> {
    const groups = await prisma.permissionGroup.findMany({
      where: {
        id: { in: ids.map((id) => id.toString()) },
        deletedAt: null,
      },
    });

    return groups.map(mapPermissionGroupPrismaToDomain);
  }

  // LIST
  async listAll(
    params?: ListPermissionGroupsParams,
  ): Promise<PermissionGroup[]> {
    const {
      isActive,
      isSystem,
      includeDeleted = false,
      parentId,
      page = 1,
      limit = 100,
    } = params || {};

    const groups = await prisma.permissionGroup.findMany({
      where: {
        isActive: isActive,
        isSystem: isSystem,
        deletedAt: includeDeleted ? undefined : null,
        parentId: parentId ? parentId.toString() : undefined,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    });

    return groups.map(mapPermissionGroupPrismaToDomain);
  }

  async listActive(): Promise<PermissionGroup[]> {
    const groups = await prisma.permissionGroup.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    });

    return groups.map(mapPermissionGroupPrismaToDomain);
  }

  async listByParentId(parentId: UniqueEntityID): Promise<PermissionGroup[]> {
    const groups = await prisma.permissionGroup.findMany({
      where: { parentId: parentId.toString(), deletedAt: null },
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    });

    return groups.map(mapPermissionGroupPrismaToDomain);
  }

  async listSystemGroups(): Promise<PermissionGroup[]> {
    const groups = await prisma.permissionGroup.findMany({
      where: { isSystem: true, deletedAt: null },
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    });

    return groups.map(mapPermissionGroupPrismaToDomain);
  }

  // HIERARCHY
  async findParent(id: UniqueEntityID): Promise<PermissionGroup | null> {
    const group = await prisma.permissionGroup.findUnique({
      where: { id: id.toString() },
      include: { parent: true },
    });

    if (!group?.parent) return null;

    return mapPermissionGroupPrismaToDomain(group.parent);
  }

  async findChildren(id: UniqueEntityID): Promise<PermissionGroup[]> {
    const groups = await prisma.permissionGroup.findMany({
      where: { parentId: id.toString(), deletedAt: null },
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    });

    return groups.map(mapPermissionGroupPrismaToDomain);
  }

  async findAncestors(id: UniqueEntityID): Promise<PermissionGroup[]> {
    const ancestors: PermissionGroup[] = [];
    let currentId: string | null = id.toString();

    while (currentId) {
      const group: {
        id: string;
        parentId: string | null;
        name: string;
      } | null = await prisma.permissionGroup.findUnique({
        where: { id: currentId },
        select: { id: true, parentId: true, name: true },
      });

      if (!group || !group.parentId) break;

      const parent: {
        id: string;
        parentId: string | null;
      } | null = await prisma.permissionGroup.findUnique({
        where: { id: group.parentId },
        select: { id: true, parentId: true },
      });

      if (parent) {
        const fullParent = await prisma.permissionGroup.findUnique({
          where: { id: parent.id },
        });

        if (fullParent) {
          ancestors.push(mapPermissionGroupPrismaToDomain(fullParent));
          currentId = parent.parentId;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return ancestors;
  }

  // UTILITY
  async exists(slug: string): Promise<boolean> {
    const group = await prisma.permissionGroup.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
      select: { id: true },
    });

    return !!group;
  }

  async count(): Promise<number> {
    return await prisma.permissionGroup.count({
      where: { deletedAt: null },
    });
  }
}
