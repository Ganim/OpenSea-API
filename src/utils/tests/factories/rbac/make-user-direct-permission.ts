import { makeGrantDirectPermissionUseCase } from '@/use-cases/rbac/user-direct-permissions/factories/make-grant-direct-permission-use-case';

interface MakeUserDirectPermissionOptions {
  userId: string;
  permissionId: string;
  effect?: 'allow' | 'deny';
  conditions?: Record<string, unknown> | null;
  expiresAt?: Date | null;
  grantedBy?: string | null;
}

export async function makeUserDirectPermission(
  options: MakeUserDirectPermissionOptions,
) {
  const grantDirectPermissionUseCase = makeGrantDirectPermissionUseCase();

  const { directPermission } = await grantDirectPermissionUseCase.execute({
    userId: options.userId,
    permissionId: options.permissionId,
    effect: options.effect ?? 'allow',
    conditions: options.conditions ?? null,
    expiresAt: options.expiresAt ?? null,
    grantedBy: options.grantedBy ?? null,
  });

  return directPermission;
}
