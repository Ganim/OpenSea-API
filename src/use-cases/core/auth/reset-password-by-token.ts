import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { Password } from '@/entities/core/value-objects/password';
import { Token } from '@/entities/core/value-objects/token';
import { AuthLinksRepository } from '@/repositories/core/auth-links-repository';
import { UsersRepository } from '@/repositories/core/users-repository';

import dayjs from 'dayjs';

interface ResetPasswordByTokenRequest {
  token: string;
  password: string;
}

export class ResetPasswordByTokenUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly authLinksRepository: AuthLinksRepository,
  ) {}

  async execute({
    token,
    password,
  }: ResetPasswordByTokenRequest): Promise<void> {
    const validToken = Token.create(token);
    const validPassword = await Password.create(password);

    const existingUser =
      await this.usersRepository.findByPasswordResetToken(validToken);

    const isTokenExpired = dayjs().isAfter(existingUser?.passwordResetExpires);

    if (!existingUser || !existingUser.passwordResetExpires || isTokenExpired) {
      throw new BadRequestError('Token inválido ou expirado');
    }

    const updatedUser = await this.usersRepository.update({
      id: existingUser.id,
      passwordHash: validPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    if (!updatedUser) {
      throw new BadRequestError('Unable to update user password.');
    }

    await this.authLinksRepository.updateCredentialByUserId(
      existingUser.id,
      validPassword.toString(),
    );

    // Clear forced password reset if it was set
    if (existingUser.forcePasswordReset) {
      await this.usersRepository.clearForcePasswordReset(existingUser.id);
    }
  }
}
