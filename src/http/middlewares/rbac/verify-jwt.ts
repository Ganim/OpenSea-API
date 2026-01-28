import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PrismaSessionsRepository } from '@/repositories/core/prisma/prisma-sessions-repository';
import type { FastifyRequest } from 'fastify';

export async function verifyJwt(request: FastifyRequest) {
  try {
    await request.jwtVerify();

    // After JWT is verified, check if the session is still active
    const sessionId = request.user.sessionId;
    if (sessionId) {
      const sessionsRepository = new PrismaSessionsRepository();
      const session = await sessionsRepository.findById(
        new UniqueEntityID(sessionId),
      );

      // Session doesn't exist or is revoked/expired
      if (!session) {
        throw new UnauthorizedError('Session not found or has been revoked');
      }

      // Check if session was revoked
      if (session.revokedAt) {
        throw new UnauthorizedError('Session has been revoked');
      }

      // Check if session has expired
      if (session.expiredAt && session.expiredAt < new Date()) {
        throw new UnauthorizedError('Session has expired');
      }
    }
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new UnauthorizedError('User not authorized');
  }
}
