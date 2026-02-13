import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PasswordResetRequiredError } from '@/@errors/use-cases/password-reset-required-error';
import { PinSetupRequiredError } from '@/@errors/use-cases/pin-setup-required-error';
import { UserBlockedError } from '@/@errors/use-cases/user-blocked-error';
import { BLOCK_MINUTES, MAX_ATTEMPTS } from '@/config/auth';
import { Pin } from '@/entities/core/value-objects/pin';
import { Token } from '@/entities/core/value-objects/token';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UserDTO, userToDTO } from '@/mappers/core/user/user-to-dto';
import type { UsersRepository } from '@/repositories/core/users-repository';
import crypto from 'crypto';
import type { FastifyReply } from 'fastify';
import { CreateSessionUseCase } from '../sessions/create-session';

interface AuthenticateWithAccessPinUseCaseRequest {
  userId: string;
  accessPin: string;
  ip: string;
  userAgent?: string;
  reply: FastifyReply;
}

interface AuthenticateWithAccessPinUseCaseResponse {
  user: UserDTO;
  sessionId: string;
  token: string;
  refreshToken: string;
}

export class AuthenticateWithAccessPinUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private createSessionUseCase: CreateSessionUseCase,
  ) {}

  async execute({
    userId,
    accessPin,
    ip,
    userAgent,
    reply,
  }: AuthenticateWithAccessPinUseCaseRequest): Promise<AuthenticateWithAccessPinUseCaseResponse> {
    const validId = new UniqueEntityID(userId);
    const existingUser = await this.usersRepository.findById(validId);

    if (!existingUser || existingUser.deletedAt) {
      throw new BadRequestError('Invalid credentials');
    }

    if (existingUser.blockedUntil && new Date() < existingUser.blockedUntil) {
      throw new UserBlockedError(existingUser.blockedUntil);
    }

    // Must reset password first if forced
    if (existingUser.forcePasswordReset) {
      const tempResetToken = crypto.randomBytes(32).toString('hex');
      const tempResetExpires = new Date(Date.now() + 30 * 60 * 1000);

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

    // User must have an access PIN configured
    if (!existingUser.accessPin || existingUser.forceAccessPinSetup) {
      throw new PinSetupRequiredError({
        userId: existingUser.id.toString(),
        pinType: 'access',
      });
    }

    const doesPinMatch = await Pin.compare(
      accessPin,
      existingUser.accessPin.value,
    );

    if (!doesPinMatch) {
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

      throw new BadRequestError('Invalid credentials');
    }

    // Reset failed attempts on success
    existingUser.failedLoginAttempts = 0;
    existingUser.blockedUntil = undefined;

    await this.usersRepository.update({
      id: existingUser.id,
      failedLoginAttempts: 0,
      blockedUntil: null,
    });

    existingUser.lastLoginAt = new Date();

    await this.usersRepository.updateLastLoginAt(
      existingUser.id,
      existingUser.lastLoginAt,
    );

    const { session, token, refreshToken } =
      await this.createSessionUseCase.execute({
        userId: existingUser.id.toString(),
        ip,
        userAgent,
        loginMethod: 'access_pin',
        reply,
      });

    const user = userToDTO(existingUser);

    return { user, sessionId: session.id, token, refreshToken };
  }
}
