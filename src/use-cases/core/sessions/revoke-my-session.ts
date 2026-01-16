import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SessionsRepository } from '@/repositories/core/sessions-repository';

interface RevokeMySessionUseCaseRequest {
  sessionId: string;
  userId: string;
}

export class RevokeMySessionUseCase {
  constructor(private sessionsRepository: SessionsRepository) {}

  async execute({
    sessionId,
    userId,
  }: RevokeMySessionUseCaseRequest): Promise<void> {
    const validId = new UniqueEntityID(sessionId);
    const session = await this.sessionsRepository.findById(validId);

    if (!session || session.expiredAt || session.revokedAt) {
      throw new ResourceNotFoundError('Session not found.');
    }

    // Verifica se a sessão pertence ao usuário
    if (session.userId.toString() !== userId) {
      throw new UnauthorizedError('You can only revoke your own sessions.');
    }

    await this.sessionsRepository.revoke(validId);
  }
}
