import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosSession } from '@/entities/sales/pos-session';
import type { PosSessionsRepository } from '@/repositories/sales/pos-sessions-repository';

interface CloseOrphanSessionUseCaseRequest {
  tenantId: string;
  sessionId: string;
  closedByUserId: string;
}

interface CloseOrphanSessionUseCaseResponse {
  session: PosSession;
}

export class CloseOrphanSessionUseCase {
  constructor(private posSessionsRepository: PosSessionsRepository) {}

  async execute(
    request: CloseOrphanSessionUseCaseRequest,
  ): Promise<CloseOrphanSessionUseCaseResponse> {
    const session = await this.posSessionsRepository.findById(
      new UniqueEntityID(request.sessionId),
      request.tenantId,
    );

    if (!session) {
      throw new ResourceNotFoundError('Session not found.');
    }

    if (session.status !== 'OPEN') {
      throw new BadRequestError('Session is not open.');
    }

    session.status = 'CLOSED';
    session.closedAt = new Date();
    session.orphanClosed = true;
    session.notes =
      (session.notes ? session.notes + '\n' : '') +
      `Force-closed as orphan by user ${request.closedByUserId} at ${new Date().toISOString()}`;

    await this.posSessionsRepository.save(session);

    return { session };
  }
}
