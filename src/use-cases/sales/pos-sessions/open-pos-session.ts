import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ErrorCodes } from '@/@errors/error-codes';
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

export class OrphanSessionExistsError extends BadRequestError {
  constructor(public readonly orphanSessionId: string) {
    super(
      'An orphan open session already exists for this terminal. Close it before opening a new one.',
      ErrorCodes.ORPHAN_SESSION_EXISTS,
    );
  }
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

    const orphan = await this.posSessionsRepository.findOrphanByTerminal(
      request.terminalId,
      request.tenantId,
    );

    if (orphan) {
      throw new OrphanSessionExistsError(orphan.id.toString());
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
