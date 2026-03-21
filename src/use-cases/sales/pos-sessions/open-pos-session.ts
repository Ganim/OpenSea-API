import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosCashMovement } from '@/entities/sales/pos-cash-movement';
import { PosSession } from '@/entities/sales/pos-session';
import type { PosCashMovementsRepository } from '@/repositories/sales/pos-cash-movements-repository';
import type { PosSessionsRepository } from '@/repositories/sales/pos-sessions-repository';
import type { PosTerminalsRepository } from '@/repositories/sales/pos-terminals-repository';

interface OpenPosSessionUseCaseRequest {
  tenantId: string;
  terminalId: string;
  operatorUserId: string;
  openingBalance: number;
}

interface OpenPosSessionUseCaseResponse {
  session: PosSession;
}

export class OpenPosSessionUseCase {
  constructor(
    private posSessionsRepository: PosSessionsRepository,
    private posTerminalsRepository: PosTerminalsRepository,
    private posCashMovementsRepository: PosCashMovementsRepository,
  ) {}

  async execute(
    request: OpenPosSessionUseCaseRequest,
  ): Promise<OpenPosSessionUseCaseResponse> {
    const terminal = await this.posTerminalsRepository.findById(
      new UniqueEntityID(request.terminalId),
      request.tenantId,
    );

    if (!terminal) {
      throw new ResourceNotFoundError('Terminal not found.');
    }

    if (!terminal.isActive) {
      throw new BadRequestError('Terminal is not active.');
    }

    const existingSession =
      await this.posSessionsRepository.findActiveByTerminal(
        request.terminalId,
        request.tenantId,
      );

    if (existingSession) {
      throw new BadRequestError(
        'This terminal already has an active session. Close it first.',
      );
    }

    const session = PosSession.create({
      tenantId: new UniqueEntityID(request.tenantId),
      terminalId: new UniqueEntityID(request.terminalId),
      operatorUserId: new UniqueEntityID(request.operatorUserId),
      openingBalance: request.openingBalance,
    });

    await this.posSessionsRepository.create(session);

    // Record opening cash movement
    const openingMovement = PosCashMovement.create({
      tenantId: new UniqueEntityID(request.tenantId),
      sessionId: session.id,
      type: 'OPENING',
      amount: request.openingBalance,
      performedByUserId: new UniqueEntityID(request.operatorUserId),
    });

    await this.posCashMovementsRepository.create(openingMovement);

    return { session };
  }
}
