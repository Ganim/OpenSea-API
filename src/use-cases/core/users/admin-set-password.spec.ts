import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Password } from '@/entities/core/value-objects/password';
import { InMemoryAuthLinksRepository } from '@/repositories/core/in-memory/in-memory-auth-links-repository';
import { InMemorySessionsRepository } from '@/repositories/core/in-memory/in-memory-sessions-repository';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { makeUser } from '@/utils/tests/factories/core/make-user';
import { IpAddress } from '@/entities/core/value-objects/ip-address';
import { beforeEach, describe, expect, it } from 'vitest';
import { AdminSetPasswordUseCase } from './admin-set-password';

let usersRepository: InMemoryUsersRepository;
let authLinksRepository: InMemoryAuthLinksRepository;
let sessionsRepository: InMemorySessionsRepository;
let sut: AdminSetPasswordUseCase;

describe('AdminSetPasswordUseCase', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    authLinksRepository = new InMemoryAuthLinksRepository();
    sessionsRepository = new InMemorySessionsRepository();
    sut = new AdminSetPasswordUseCase(
      usersRepository,
      authLinksRepository,
      sessionsRepository,
    );
  });

  it('atualiza o hash da senha e retorna o usuário', async () => {
    const { user: admin } = await makeUser({
      email: 'admin@example.com',
      password: 'Admin@123',
      usersRepository,
    });
    const { user: target } = await makeUser({
      email: 'target@example.com',
      password: 'OldPass@123',
      usersRepository,
    });

    const result = await sut.execute({
      targetUserId: target.id,
      requestedByUserId: admin.id,
      newPassword: 'NewPass@456',
      forceChangeOnNextLogin: false,
    });

    expect(result.user.id).toBe(target.id);

    const refreshed = await usersRepository.findById(
      new UniqueEntityID(target.id),
    );
    expect(refreshed).not.toBeNull();
    const match = await Password.compare(
      'NewPass@456',
      refreshed!.password.value,
    );
    expect(match).toBe(true);
  });

  it('força troca no próximo login quando forceChangeOnNextLogin=true', async () => {
    const { user: admin } = await makeUser({
      email: 'admin@example.com',
      password: 'Admin@123',
      usersRepository,
    });
    const { user: target } = await makeUser({
      email: 'target@example.com',
      password: 'OldPass@123',
      usersRepository,
    });

    const result = await sut.execute({
      targetUserId: target.id,
      requestedByUserId: admin.id,
      newPassword: 'NewPass@456',
      forceChangeOnNextLogin: true,
    });

    expect(result.user.forcePasswordReset).toBe(true);
  });

  it('limpa forcePasswordReset prévio quando forceChangeOnNextLogin=false', async () => {
    const { user: admin } = await makeUser({
      email: 'admin@example.com',
      password: 'Admin@123',
      usersRepository,
    });
    const { user: target } = await makeUser({
      email: 'target@example.com',
      password: 'OldPass@123',
      usersRepository,
    });

    await usersRepository.setForcePasswordReset(
      new UniqueEntityID(target.id),
      null,
      'legacy',
    );

    const result = await sut.execute({
      targetUserId: target.id,
      requestedByUserId: admin.id,
      newPassword: 'NewPass@456',
      forceChangeOnNextLogin: false,
    });

    expect(result.user.forcePasswordReset).toBe(false);
  });

  it('rejeita senha fraca', async () => {
    const { user: admin } = await makeUser({
      email: 'admin@example.com',
      password: 'Admin@123',
      usersRepository,
    });
    const { user: target } = await makeUser({
      email: 'target@example.com',
      password: 'OldPass@123',
      usersRepository,
    });

    await expect(
      sut.execute({
        targetUserId: target.id,
        requestedByUserId: admin.id,
        newPassword: '123',
        forceChangeOnNextLogin: false,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('lança ResourceNotFoundError se target não existe', async () => {
    const { user: admin } = await makeUser({
      email: 'admin@example.com',
      password: 'Admin@123',
      usersRepository,
    });

    await expect(
      sut.execute({
        targetUserId: '00000000-0000-0000-0000-000000000000',
        requestedByUserId: admin.id,
        newPassword: 'NewPass@456',
        forceChangeOnNextLogin: false,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('impede admin não-super-admin de alterar senha de super-admin', async () => {
    const { user: admin } = await makeUser({
      email: 'admin@example.com',
      password: 'Admin@123',
      usersRepository,
    });
    const { user: superAdmin } = await makeUser({
      email: 'super@example.com',
      password: 'Super@123',
      usersRepository,
    });

    // Marca target como super-admin via props internos (getter-only no entity)
    const superUserEntity = await usersRepository.findById(
      new UniqueEntityID(superAdmin.id),
    );
    if (superUserEntity) {
      (
        superUserEntity as unknown as { props: { isSuperAdmin: boolean } }
      ).props.isSuperAdmin = true;
    }

    await expect(
      sut.execute({
        targetUserId: superAdmin.id,
        requestedByUserId: admin.id,
        newPassword: 'NewPass@456',
        forceChangeOnNextLogin: false,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('revoga sessões ativas do usuário alvo', async () => {
    const { user: admin } = await makeUser({
      email: 'admin@example.com',
      password: 'Admin@123',
      usersRepository,
    });
    const { user: target } = await makeUser({
      email: 'target@example.com',
      password: 'OldPass@123',
      usersRepository,
    });

    const targetUniqueId = new UniqueEntityID(target.id);
    await sessionsRepository.create({
      userId: targetUniqueId,
      ip: IpAddress.create('127.0.0.1'),
    });
    await sessionsRepository.create({
      userId: targetUniqueId,
      ip: IpAddress.create('127.0.0.2'),
    });

    const result = await sut.execute({
      targetUserId: target.id,
      requestedByUserId: admin.id,
      newPassword: 'NewPass@456',
      forceChangeOnNextLogin: false,
    });

    expect(result.revokedSessionsCount).toBe(2);
  });
});
