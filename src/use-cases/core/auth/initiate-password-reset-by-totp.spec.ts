import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { getCurrentRotatingCode } from '@/lib/rotating-code';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { makeUser } from '@/utils/tests/factories/core/make-user';
import { beforeEach, describe, expect, it } from 'vitest';
import { InitiatePasswordResetByTotpUseCase } from './initiate-password-reset-by-totp';

let usersRepository: InMemoryUsersRepository;
let sut: InitiatePasswordResetByTotpUseCase;

describe('InitiatePasswordResetByTotpUseCase', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    sut = new InitiatePasswordResetByTotpUseCase(usersRepository);
  });

  it('emite resetToken quando o TOTP é válido', async () => {
    const { user } = await makeUser({
      email: 'user@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    const freshUser = await usersRepository.findById(
      new UniqueEntityID(user.id),
    );
    const { code } = getCurrentRotatingCode(freshUser!.totpSecret);

    const result = await sut.execute({
      email: 'user@example.com',
      totpCode: code,
    });

    expect(result.resetToken).toHaveLength(64);
    expect(result.expiresAt).toBeInstanceOf(Date);
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('persiste o resetToken no passwordResetToken do usuário', async () => {
    const { user } = await makeUser({
      email: 'user@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    const freshUser = await usersRepository.findById(
      new UniqueEntityID(user.id),
    );
    const { code } = getCurrentRotatingCode(freshUser!.totpSecret);

    const { resetToken } = await sut.execute({
      email: 'user@example.com',
      totpCode: code,
    });

    const afterExec = await usersRepository.findById(
      new UniqueEntityID(user.id),
    );
    expect(afterExec!.passwordResetToken?.toString()).toBe(resetToken);
  });

  it('lança UnauthorizedError genérica quando email não existe', async () => {
    await expect(
      sut.execute({
        email: 'no-such-user@example.com',
        totpCode: 'ABC123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('lança UnauthorizedError genérica quando TOTP é inválido', async () => {
    await makeUser({
      email: 'user@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    await expect(
      sut.execute({
        email: 'user@example.com',
        totpCode: 'XXXXXX',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('aceita TOTP em lowercase (normalização)', async () => {
    const { user } = await makeUser({
      email: 'user@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    const freshUser = await usersRepository.findById(
      new UniqueEntityID(user.id),
    );
    const { code } = getCurrentRotatingCode(freshUser!.totpSecret);

    const result = await sut.execute({
      email: 'user@example.com',
      totpCode: code.toLowerCase(),
    });

    expect(result.resetToken).toBeDefined();
  });
});
