import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { IpAddress } from '@/entities/core/value-objects/ip-address';
import { Token } from '@/entities/core/value-objects/token';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  refreshTokenToDTO,
  type RefreshTokenDTO,
} from '@/mappers/core/refresh-token/refresh-token-to-dto';
import {
  sessionToDTO,
  type SessionDTO,
} from '@/mappers/core/session/session-to-dto';
import { RefreshTokensRepository } from '@/repositories/core/refresh-tokens-repository';
import { SessionsRepository } from '@/repositories/core/sessions-repository';
import type { UsersRepository } from '@/repositories/core/users-repository';
import type { PermissionService } from '@/services/rbac/permission-service';
import type { FastifyReply } from 'fastify';

export interface RefreshSessionUseCaseRequest {
  refreshToken: string;
  ip: string;
  reply: FastifyReply;
}

export interface RefreshSessionUseCaseResponse {
  session: SessionDTO;
  refreshToken: RefreshTokenDTO;
  permissions: string[];
}

export class RefreshSessionUseCase {
  constructor(
    private sessionsRepository: SessionsRepository,
    private usersRepository: UsersRepository,
    private refreshTokensRepository: RefreshTokensRepository,
    private permissionService: PermissionService,
  ) {}

  async execute({
    refreshToken,
    ip,
    reply,
  }: RefreshSessionUseCaseRequest): Promise<RefreshSessionUseCaseResponse> {
    const validIp = IpAddress.create(ip);
    const tokenValue = Token.create(refreshToken);

    // Find refresh token in database
    const storedRefreshToken =
      await this.refreshTokensRepository.findByToken(tokenValue);

    if (!storedRefreshToken) {
      throw new UnauthorizedError('Invalid refresh token.');
    }

    // Validate refresh token
    if (storedRefreshToken.revokedAt) {
      throw new UnauthorizedError('Refresh token has been revoked.');
    }

    if (storedRefreshToken.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedError('Refresh token has expired.');
    }

    // Get session
    const storedSession = await this.sessionsRepository.findById(
      storedRefreshToken.sessionId,
    );

    if (!storedSession) {
      throw new ResourceNotFoundError('Session not found.');
    }

    if (storedSession.expiredAt) {
      throw new UnauthorizedError('Session has expired.');
    }

    if (storedSession.revokedAt) {
      throw new UnauthorizedError('Session has been revoked.');
    }

    // Get user
    const storedUser = await this.usersRepository.findById(
      storedRefreshToken.userId,
    );

    if (!storedUser || storedUser.deletedAt) {
      throw new ResourceNotFoundError('User not found.');
    }

    // Revoke old refresh token (single-use)
    await this.refreshTokensRepository.revokeById(storedRefreshToken.id);

    // Generate new refresh token JWT
    const newJWTRefreshToken = await reply.jwtSign(
      {
        sessionId: storedRefreshToken.sessionId.toString(),
        jti: new UniqueEntityID().toString(),
      },
      {
        sign: {
          sub: storedRefreshToken.userId.toString(),
          expiresIn: '7d',
        },
      },
    );

    const validJWTRefreshToken = Token.create(newJWTRefreshToken);

    // Create new refresh token in database
    const newDBRefreshToken = await this.refreshTokensRepository.create({
      userId: storedRefreshToken.userId,
      sessionId: storedRefreshToken.sessionId,
      token: validJWTRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    if (!newDBRefreshToken) {
      throw new BadRequestError('Unable to create refresh token.');
    }

    // Update session with new IP
    const newSession = await this.sessionsRepository.update({
      sessionId: storedRefreshToken.sessionId,
      ip: validIp,
    });

    if (!newSession) {
      throw new BadRequestError('Unable to update session.');
    }

    // Get user permissions for the new access token
    const permissionCodes = await this.permissionService.getUserPermissionCodes(
      storedRefreshToken.userId,
    );

    const session = sessionToDTO(newSession);
    const newRefreshToken = refreshTokenToDTO(newDBRefreshToken);

    return { session, refreshToken: newRefreshToken, permissions: permissionCodes };
  }
}
