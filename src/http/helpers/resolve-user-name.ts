import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';

export async function resolveUserName(userId: string): Promise<string> {
  try {
    const { user } = await makeGetUserByIdUseCase().execute({ userId });
    return user.profile?.name
      ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
      : user.username || user.email;
  } catch {
    return userId;
  }
}
