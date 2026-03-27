import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UserDTO, userToDTO } from '@/mappers/core/user/user-to-dto';
import type { MagicLinkTokensRepository } from '@/repositories/core/magic-link-tokens-repository';
import type { UsersRepository } from '@/repositories/core/users-repository';
import crypto from 'crypto';
import type { FastifyReply } from 'fastify';
import { CreateSessionUseCase } from '../sessions/create-session';

interface VerifyMagicLinkUseCaseRequest {
  token: string;
  ip: string;
  userAgent?: string;
  reply: FastifyReply;
}

interface VerifyMagicLinkUseCaseResponse {
  user: UserDTO;
  sessionId: string;
  token: string;
  refreshToken: string;
}

export class VerifyMagicLinkUseCase {
  constructor(
    private magicLinkTokensRepository: MagicLinkTokensRepository,
    private usersRepository: UsersRepository,
    private createSessionUseCase: CreateSessionUseCase,
  ) {}

  async execute({
    token,
    ip,
    userAgent,
    reply,
  }: VerifyMagicLinkUseCaseRequest): Promise<VerifyMagicLinkUseCaseResponse> {
    // Hash the incoming token to look it up
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const magicLinkToken =
      await this.magicLinkTokensRepository.findByToken(hashedToken);

    if (!magicLinkToken) {
      throw new BadRequestError('Link inválido.');
    }

    if (magicLinkToken.isExpired) {
      throw new BadRequestError('Link expirado. Solicite um novo.');
    }

    if (magicLinkToken.isUsed) {
      throw new BadRequestError('Link já utilizado. Solicite um novo.');
    }

    // Mark as used
    await this.magicLinkTokensRepository.markAsUsed(magicLinkToken.id);

    // Find user
    const user = await this.usersRepository.findById(magicLinkToken.userId);

    if (!user || user.deletedAt) {
      throw new BadRequestError('Link inválido.');
    }

    // Update lastLoginAt
    user.lastLoginAt = new Date();
    await this.usersRepository.updateLastLoginAt(user.id, user.lastLoginAt);

    // Create session with magic_link login method
    const { session, token: jwtToken, refreshToken } =
      await this.createSessionUseCase.execute({
        userId: user.id.toString(),
        ip,
        userAgent,
        loginMethod: 'magic_link',
        reply,
      });

    const userDto = userToDTO(user);

    return {
      user: userDto,
      sessionId: session.id,
      token: jwtToken,
      refreshToken,
    };
  }
}
