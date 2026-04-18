import { prisma } from '@/lib/prisma.js';

import type { RecipientSelector } from '../public/types.js';

/**
 * Resolves a RecipientSelector into a concrete list of user ids for a tenant.
 *
 * - `{ userIds }`         → direct list (still filtered to valid users of the tenant)
 * - `{ permission }`      → every user of the tenant that holds the permission code,
 *                           through permission groups or direct assignments
 * - `{ role }`            → every user of the tenant in the given permission group code
 * - `{ entity: { ... } }` → not yet supported (returns empty, logs warning)
 */
export class RecipientResolver {
  async resolve(params: {
    tenantId: string;
    selector: RecipientSelector;
  }): Promise<string[]> {
    const { tenantId, selector } = params;

    if ('userIds' in selector) {
      return this.filterValidTenantUsers(tenantId, selector.userIds);
    }

    if ('permission' in selector) {
      return this.resolveByPermission(tenantId, selector.permission);
    }

    if ('role' in selector) {
      return this.resolveByRole(tenantId, selector.role);
    }

    if ('entity' in selector) {
      // Entity-based selection requires per-module resolution. In phase 2 we
      // only document the shape; consumers should use userIds/permission/role
      // for the initial rollout.
      return [];
    }

    return [];
  }

  private async filterValidTenantUsers(
    tenantId: string,
    userIds: string[],
  ): Promise<string[]> {
    if (userIds.length === 0) return [];
    const tenantUsers = await prisma.tenantUser.findMany({
      where: {
        tenantId,
        userId: { in: userIds },
        deletedAt: null,
      },
      select: { userId: true },
    });
    return tenantUsers.map((t) => t.userId);
  }

  private async resolveByPermission(
    tenantId: string,
    permissionCode: string,
  ): Promise<string[]> {
    // Direct permissions
    const directUsers = await prisma.userDirectPermission.findMany({
      where: {
        permission: { code: permissionCode },
        user: {
          tenantUsers: { some: { tenantId, deletedAt: null } },
        },
      },
      select: { userId: true },
    });

    // Permissions via group
    const groupUsers = await prisma.userPermissionGroup.findMany({
      where: {
        group: {
          tenantId,
          permissions: {
            some: { permission: { code: permissionCode } },
          },
        },
      },
      select: { userId: true },
    });

    const set = new Set<string>();
    directUsers.forEach((u) => set.add(u.userId));
    groupUsers.forEach((u) => set.add(u.userId));
    return Array.from(set);
  }

  private async resolveByRole(
    tenantId: string,
    roleCode: string,
  ): Promise<string[]> {
    const group = await prisma.permissionGroup.findFirst({
      where: { tenantId, name: roleCode, deletedAt: null },
      include: {
        users: { select: { userId: true } },
      },
    });
    if (!group) return [];
    return group.users.map((u) => u.userId);
  }
}
