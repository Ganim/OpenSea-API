import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { Email } from '@/entities/core/value-objects/email';
import { Token } from '@/entities/core/value-objects/token';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryAuthLinksRepository } from '@/repositories/core/in-memory/in-memory-auth-links-repository';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { makeUser } from '@/utils/tests/factories/core/make-user';
import { compare } from 'bcryptjs';
import dayjs from 'dayjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { ResetPasswordByTokenUseCase } from './reset-password-by-token';

let usersRepository: InMemoryUsersRepository;
let authLinksRepository: InMemoryAuthLinksRepository;
let sut: ResetPasswordByTokenUseCase;

describe('ResetPasswordByTokenUseCase', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    authLinksRepository = new InMemoryAuthLinksRepository();
    sut = new ResetPasswordByTokenUseCase(usersRepository, authLinksRepository);
  });

  it('should reset password for valid token', async () => {
    const { user } = await makeUser({
      email: 'user@example.com',
      password: 'OldPass@123',
      usersRepository,
    });

    const passwordResetToken = Token.create('valid-reset-token');
    const passwordResetExpires = dayjs().add(1, 'hour').toDate();

    await usersRepository.updatePasswordReset(
      new UniqueEntityID(user.id),
      passwordResetToken,
      passwordResetExpires,
    );

    await sut.execute({
      token: passwordResetToken.toString(),
      password: 'NewPass@123',
    });

    const userEmail = Email.create(user.email);
    const updatedUser = await usersRepository.findByEmail(userEmail);

    const isPasswordHashed = await compare(
      'NewPass@123',
      updatedUser!.password.toString(),
    );

    expect(isPasswordHashed).toBe(true);
  });

  it('should sync credentials across AuthLinks with credentials on password reset', async () => {
    const { user } = await makeUser({
      email: 'user@example.com',
      password: 'OldPass@123',
      usersRepository,
    });

    const userId = new UniqueEntityID(user.id);

    const passwordResetToken = Token.create('valid-reset-token');
    const passwordResetExpires = dayjs().add(1, 'hour').toDate();

    await usersRepository.updatePasswordReset(
      userId,
      passwordResetToken,
      passwordResetExpires,
    );

    await authLinksRepository.create({
      userId,
      provider: 'EMAIL',
      identifier: 'user@example.com',
      credential: 'old-hash',
    });

    await authLinksRepository.create({
      userId,
      provider: 'ENROLLMENT',
      identifier: 'EMP-001',
      credential: 'old-hash',
    });

    await sut.execute({
      token: passwordResetToken.toString(),
      password: 'NewPass@123',
    });

    const emailLink = await authLinksRepository.findByUserIdAndProvider(
      userId,
      'EMAIL',
    );
    const enrollmentLink = await authLinksRepository.findByUserIdAndProvider(
      userId,
      'ENROLLMENT',
    );

    const isEmailLinkUpdated = await compare(
      'NewPass@123',
      emailLink?.credential ?? '',
    );
    const isEnrollmentLinkUpdated = await compare(
      'NewPass@123',
      enrollmentLink?.credential ?? '',
    );

    expect(isEmailLinkUpdated).toBe(true);
    expect(isEnrollmentLinkUpdated).toBe(true);
  });

  it('should throw BadRequestError if token is invalid', async () => {
    await expect(
      sut.execute({ token: 'invalid-token', password: 'NewPass@123' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError if token is expired', async () => {
    const { user } = await makeUser({
      email: 'user@example.com',
      password: 'OldPass@123',
      usersRepository,
    });

    const passwordResetToken = Token.create('valid-reset-token');
    const passwordResetExpires = dayjs().subtract(1, 'hour').toDate();

    await usersRepository.updatePasswordReset(
      new UniqueEntityID(user.id),
      passwordResetToken,
      passwordResetExpires,
    );

    await expect(
      sut.execute({
        token: passwordResetToken.toString(),
        password: 'NewPass@123',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
