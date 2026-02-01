import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { LoginMethod } from '@/entities/core/session';
import { IpAddress } from '@/entities/core/value-objects/ip-address';
import { Token } from '@/entities/core/value-objects/token';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  sessionToDTO,
  type SessionDTO,
} from '@/mappers/core/session/session-to-dto';
import type { RefreshTokensRepository } from '@/repositories/core/refresh-tokens-repository';
import type { SessionsRepository } from '@/repositories/core/sessions-repository';
import type { UsersRepository } from '@/repositories/core/users-repository';
import { SessionInfoService } from '@/services/session';
import type { FastifyReply } from 'fastify';

interface CreateSessionUseCaseRequest {
  userId: string;
  ip: string;
  userAgent?: string;
  loginMethod?: LoginMethod;
  reply: FastifyReply;
}

interface CreateSessionUseCaseResponse {
  session: SessionDTO;
  token: string;
  refreshToken: string;
}

export class CreateSessionUseCase {
  constructor(
    private sessionsRepository: SessionsRepository,
    private usersRepository: UsersRepository,
    private refreshTokensRepository: RefreshTokensRepository,
  ) {}

  async execute({
    userId,
    ip,
    userAgent,
    loginMethod,
    reply,
  }: CreateSessionUseCaseRequest): Promise<CreateSessionUseCaseResponse> {
    const validId = new UniqueEntityID(userId);
    const validIp = IpAddress.create(ip);

    const user = await this.usersRepository.findById(validId);

    if (!user || user.deletedAt) {
      throw new ResourceNotFoundError('User not found.');
    }

    // Parse device info and get geolocation
    const { deviceInfo, geoLocation } =
      SessionInfoService.getSessionContextSync({
        userAgent,
        ip,
      });

    const newSession = await this.sessionsRepository.create({
      userId: validId,
      ip: validIp,
      deviceInfo,
      geoLocation,
      loginMethod: loginMethod ?? 'password',
    });

    if (!newSession) {
      throw new BadRequestError(
        'Unable to create session. Please verify the provided user ID and IP address.',
      );
    }

    const token = await reply.jwtSign(
      {
        sessionId: newSession.id.toString(),
        isSuperAdmin: user.isSuperAdmin ?? false,
      },
      { sign: { sub: user.id.toString() } },
    );

    const refreshToken = await reply.jwtSign(
      {
        sessionId: newSession.id.toString(),
        jti: new UniqueEntityID().toString(),
      },
      { sign: { sub: user.id.toString(), expiresIn: '7d' } },
    );

    // Persistir refresh token para que os casos de uso de logout/refresh funcionem
    const validRefreshToken = Token.create(refreshToken);

    await this.refreshTokensRepository.create({
      userId: validId,
      sessionId: newSession.id,
      token: validRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
    });

    const session = sessionToDTO(newSession);

    return { session, token, refreshToken };
  }
}
