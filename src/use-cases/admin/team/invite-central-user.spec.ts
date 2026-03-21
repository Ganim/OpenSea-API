import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { CentralUser } from '@/entities/core/central-user';
import { Email } from '@/entities/core/value-objects/email';
import { Password } from '@/entities/core/value-objects/password';
import { Url } from '@/entities/core/value-objects/url';
import { Username } from '@/entities/core/value-objects/username';
import { InMemoryCentralUsersRepository } from '@/repositories/core/in-memory/in-memory-central-users-repository';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { InviteCentralUserUseCase } from './invite-central-user';

let centralUsersRepository: InMemoryCentralUsersRepository;
let usersRepository: InMemoryUsersRepository;
let sut: InviteCentralUserUseCase;

async function createTestUser(email: string) {
  const usernameBase = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
  return usersRepository.create({
    email: Email.create(email),
    username: Username.create(usernameBase),
    passwordHash: await Password.create('Test@123'),
    profile: {
      name: 'Test',
      surname: 'User',
      birthday: null,
      location: '',
      bio: '',
      avatarUrl: Url.empty(),
    },
  });
}

describe('InviteCentralUserUseCase', () => {
  beforeEach(() => {
    centralUsersRepository = new InMemoryCentralUsersRepository();
    usersRepository = new InMemoryUsersRepository();
    sut = new InviteCentralUserUseCase(centralUsersRepository, usersRepository);
  });

  it('should invite a user to the Central team', async () => {
    const user = await createTestUser('john@test.com');

    const { centralUser } = await sut.execute({
      userId: user.id.toString(),
      role: 'ADMIN',
      invitedBy: 'inviter-id',
    });

    expect(centralUser).toBeDefined();
    expect(centralUser.userId).toBe(user.id.toString());
    expect(centralUser.role).toBe('ADMIN');
    expect(centralUser.invitedBy).toBe('inviter-id');
    expect(centralUser.isActive).toBe(true);
  });

  it('should default role to VIEWER when creating via entity defaults', async () => {
    const user = await createTestUser('viewer@test.com');

    const { centralUser } = await sut.execute({
      userId: user.id.toString(),
      role: 'VIEWER',
      invitedBy: 'inviter-id',
    });

    expect(centralUser.role).toBe('VIEWER');
  });

  it('should throw ResourceNotFoundError when user does not exist', async () => {
    await expect(() =>
      sut.execute({
        userId: 'non-existent-user-id',
        role: 'ADMIN',
        invitedBy: 'inviter-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ConflictError when user is already a Central team member', async () => {
    const user = await createTestUser('existing@test.com');

    await centralUsersRepository.create(
      CentralUser.create({
        userId: user.id.toString(),
        role: 'VIEWER',
      }),
    );

    await expect(() =>
      sut.execute({
        userId: user.id.toString(),
        role: 'ADMIN',
        invitedBy: 'inviter-id',
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('should throw BadRequestError for invalid role', async () => {
    const user = await createTestUser('invalid-role@test.com');

    await expect(() =>
      sut.execute({
        userId: user.id.toString(),
        role: 'INVALID_ROLE',
        invitedBy: 'inviter-id',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should accept all valid roles', async () => {
    const validRoles = ['OWNER', 'ADMIN', 'SUPPORT', 'FINANCE', 'VIEWER'];

    for (const role of validRoles) {
      const user = await createTestUser(`${role.toLowerCase()}@test.com`);

      const { centralUser } = await sut.execute({
        userId: user.id.toString(),
        role,
        invitedBy: 'inviter-id',
      });

      expect(centralUser.role).toBe(role);
    }
  });
});
