import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  PosCashMovement,
  type PosCashMovementType,
} from '@/entities/sales/pos-cash-movement';
import type { PosCashMovementsRepository } from '@/repositories/sales/pos-cash-movements-repository';
import type { PosSessionsRepository } from '@/repositories/sales/pos-sessions-repository';

interface CreatePosCashMovementUseCaseRequest {
  tenantId: string;
  sessionId: string;
  type: PosCashMovementType;
  amount: number;
  reason?: string;
  performedByUserId: string;
  authorizedByUserId?: string;
}

interface CreatePosCashMovementUseCaseResponse {
  movement: PosCashMovement;
}

export class CreatePosCashMovementUseCase {
  constructor(
    private posCashMovementsRepository: PosCashMovementsRepository,
    private posSessionsRepository: PosSessionsRepository,
  ) {}

  async execute(
    request: CreatePosCashMovementUseCaseRequest,
  ): Promise<CreatePosCashMovementUseCaseResponse> {
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

    if (request.amount <= 0) {
      throw new BadRequestError('Amount must be greater than zero.');
    }

    const movement = PosCashMovement.create({
      tenantId: new UniqueEntityID(request.tenantId),
      sessionId: new UniqueEntityID(request.sessionId),
      type: request.type,
      amount: request.amount,
      reason: request.reason,
      performedByUserId: new UniqueEntityID(request.performedByUserId),
      authorizedByUserId: request.authorizedByUserId
        ? new UniqueEntityID(request.authorizedByUserId)
        : undefined,
    });

    await this.posCashMovementsRepository.create(movement);

    return { movement };
  }
}
