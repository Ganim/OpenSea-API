import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { PasswordResetRequiredError } from '@/@errors/use-cases/password-reset-required-error';
import { UserBlockedError } from '@/@errors/use-cases/user-blocked-error';
import { BLOCK_MINUTES, MAX_ATTEMPTS } from '@/config/auth';
import type { LoginMethod } from '@/entities/core/session';
import { Password } from '@/entities/core/value-objects/password';
import { Token } from '@/entities/core/value-objects/token';
import { UserDTO, userToDTO } from '@/mappers/core/user/user-to-dto';
import type { AuthLinksRepository } from '@/repositories/core/auth-links-repository';
import type { UsersRepository } from '@/repositories/core/users-repository';
import crypto from 'crypto';
import type { FastifyReply } from 'fastify';
import { CreateSessionUseCase } from '../sessions/create-session';
import {
  detectIdentifierType,
  normalizeIdentifier,
} from './utils/detect-identifier-type';

interface AuthenticateUnifiedUseCaseRequest {
  identifier: string;
  password: string;
  ip: string;
  userAgent?: string;
  reply: FastifyReply;
}

interface AuthenticateUnifiedUseCaseResponse {
  user: UserDTO;
  sessionId: string;
  token: string;
  refreshToken: string;
}

export class AuthenticateUnifiedUseCase {
  constructor(
    private authLinksRepository: AuthLinksRepository,
    private usersRepository: UsersRepository,
    private createSessionUseCase: CreateSessionUseCase,
  ) {}

  async execute({
    identifier,
    password,
    ip,
    userAgent,
    reply,
  }: AuthenticateUnifiedUseCaseRequest): Promise<AuthenticateUnifiedUseCaseResponse> {
    const provider = detectIdentifierType(identifier);
    const normalized = normalizeIdentifier(provider, identifier);

    const authLink = await this.authLinksRepository.findByProviderAndIdentifier(
      provider,
      normalized,
    );

    if (!authLink) {
      throw new BadRequestError('Credenciais inválidas.');
    }

    if (authLink.status === 'INACTIVE') {
      throw new ForbiddenError(
        'Este método de login está desabilitado. Contate o administrador.',
      );
    }

    const existingUser = await this.usersRepository.findById(authLink.userId);

    if (!existingUser || existingUser.deletedAt) {
      throw new BadRequestError('Credenciais inválidas.');
    }

    if (existingUser.blockedUntil && new Date() < existingUser.blockedUntil) {
      throw new UserBlockedError(existingUser.blockedUntil);
    }

    if (!authLink.hasCredential) {
      throw new BadRequestError('Credenciais inválidas.');
    }

    const doesPasswordMatch = await Password.compare(
      password,
      authLink.credential!,
    );

    if (!doesPasswordMatch) {
      existingUser.failedLoginAttempts += 1;

      if (existingUser.failedLoginAttempts >= MAX_ATTEMPTS) {
        existingUser.blockedUntil = new Date(
          Date.now() + BLOCK_MINUTES * 60 * 1000,
        );

        await this.usersRepository.update({
          id: existingUser.id,
          blockedUntil: existingUser.blockedUntil,
          failedLoginAttempts: existingUser.failedLoginAttempts,
        });

        throw new UserBlockedError(existingUser.blockedUntil);
      } else {
        await this.usersRepository.update({
          id: existingUser.id,
          failedLoginAttempts: existingUser.failedLoginAttempts,
        });
      }

      throw new BadRequestError('Credenciais inválidas.');
    }

    existingUser.failedLoginAttempts = 0;
    existingUser.blockedUntil = undefined;

    await this.usersRepository.update({
      id: existingUser.id,
      failedLoginAttempts: 0,
      blockedUntil: null,
    });

    // Check for forced password reset
    if (existingUser.forcePasswordReset) {
      const tempResetToken = crypto.randomBytes(32).toString('hex');
      const tempResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      await this.usersRepository.updatePasswordReset(
        existingUser.id,
        Token.create(tempResetToken),
        tempResetExpires,
      );

      throw new PasswordResetRequiredError({
        userId: existingUser.id.toString(),
        reason: existingUser.forcePasswordResetReason,
        resetToken: tempResetToken,
        requestedAt: existingUser.forcePasswordResetRequestedAt,
      });
    }

    existingUser.lastLoginAt = new Date();

    await this.usersRepository.updateLastLoginAt(
      existingUser.id,
      existingUser.lastLoginAt,
    );

    await this.authLinksRepository.updateLastUsedAt(authLink.id, new Date());

    const loginMethod = provider.toLowerCase() as LoginMethod;

    const { session, token, refreshToken } =
      await this.createSessionUseCase.execute({
        userId: existingUser.id.toString(),
        ip,
        userAgent,
        loginMethod,
        reply,
      });

    const user = userToDTO(existingUser);

    return { user, sessionId: session.id, token, refreshToken };
  }
}
