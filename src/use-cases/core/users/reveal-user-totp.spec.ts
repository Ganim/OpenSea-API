import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { isValidRotatingCode } from '@/lib/rotating-code';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { makeUser } from '@/utils/tests/factories/core/make-user';
import { beforeEach, describe, expect, it } from 'vitest';
import { RevealUserTotpUseCase } from './reveal-user-totp';

let usersRepository: InMemoryUsersRepository;
let sut: RevealUserTotpUseCase;

describe('RevealUserTotpUseCase', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    sut = new RevealUserTotpUseCase(usersRepository);
  });

  it('retorna um código TOTP válido do secret do usuário', async () => {
    const { user: admin } = await makeUser({
      email: 'admin@example.com',
      password: 'Admin@123',
      usersRepository,
    });
    const { user: target } = await makeUser({
      email: 'target@example.com',
      password: 'Target@123',
      usersRepository,
    });

    const result = await sut.execute({
      targetUserId: target.id,
      requestedByUserId: admin.id,
    });

    expect(result.code).toHaveLength(6);
    expect(result.periodSeconds).toBe(60);
    expect(result.expiresAt).toBeInstanceOf(Date);

    // O código retornado deve validar com o secret do usuário
    const freshUser = await usersRepository.findById(
      new UniqueEntityID(target.id),
    );
    expect(isValidRotatingCode(freshUser!.totpSecret, result.code)).toBe(true);
  });

  it('rejeita quando o admin tenta revelar o próprio token', async () => {
    const { user: admin } = await makeUser({
      email: 'admin@example.com',
      password: 'Admin@123',
      usersRepository,
    });

    await expect(
      sut.execute({
        targetUserId: admin.id,
        requestedByUserId: admin.id,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('lança ResourceNotFoundError quando target não existe', async () => {
    const { user: admin } = await makeUser({
      email: 'admin@example.com',
      password: 'Admin@123',
      usersRepository,
    });

    await expect(
      sut.execute({
        targetUserId: '00000000-0000-0000-0000-000000000000',
        requestedByUserId: admin.id,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('impede admin não-super-admin de revelar token de super-admin', async () => {
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

    const superEntity = await usersRepository.findById(
      new UniqueEntityID(superAdmin.id),
    );
    if (superEntity) {
      (
        superEntity as unknown as { props: { isSuperAdmin: boolean } }
      ).props.isSuperAdmin = true;
    }

    await expect(
      sut.execute({
        targetUserId: superAdmin.id,
        requestedByUserId: admin.id,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
