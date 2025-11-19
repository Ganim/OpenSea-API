import type { User } from '@/entities/core/user';
import type { PermissionGroup } from '@/entities/rbac/permission-group';
import { makeAssignGroupToUserUseCase } from '@/use-cases/rbac/associations/factories/make-assign-group-to-user-use-case';

interface AssignGroupToUserOptions {
  expiresAt?: Date;
  grantedBy?: string;
}

export async function assignGroupToUser(
  userId: string,
  groupId: string,
  options: AssignGroupToUserOptions = {},
) {
  const assignGroupToUserUseCase = makeAssignGroupToUserUseCase();

  await assignGroupToUserUseCase.execute({
    userId,
    groupId,
    expiresAt: options.expiresAt ?? null,
    grantedBy: options.grantedBy ?? null,
  });
}

export async function makeUserWithGroups(
  user: User,
  groups: PermissionGroup[],
) {
  for (const group of groups) {
    await assignGroupToUser(user.id.toString(), group.id.toString());
  }

  return user;
}
