import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosCashMovement } from '@/entities/sales/pos-cash-movement';
import { PosSession } from '@/entities/sales/pos-session';
import type { PosCashMovementsRepository } from '@/repositories/sales/pos-cash-movements-repository';
import type { PosSessionsRepository } from '@/repositories/sales/pos-sessions-repository';
import type { PosTerminalsRepository } from '@/repositories/sales/pos-terminals-repository';
import { OrphanSessionExistsError } from './open-pos-session';

interface OpenTotemSessionUseCaseRequest {
  tenantId: string;
  totemCode: string;
  operatorUserId: string;
}

interface OpenTotemSessionUseCaseResponse {
  session: PosSession;
}

export class OpenTotemSessionUseCase {
  constructor(
    private posSessionsRepository: PosSessionsRepository,
    private posTerminalsRepository: PosTerminalsRepository,
    private posCashMovementsRepository: PosCashMovementsRepository,
  ) {}

  async execute(
    request: OpenTotemSessionUseCaseRequest,
  ): Promise<OpenTotemSessionUseCaseResponse> {
    const terminal = await this.posTerminalsRepository.findByTotemCode(
      request.totemCode,
    );

    if (!terminal) {
      throw new ResourceNotFoundError('Totem terminal not found.');
    }

    if (terminal.tenantId.toString() !== request.tenantId) {
      throw new BadRequestError('Totem belongs to a different tenant.');
    }

    if (terminal.mode !== 'TOTEM') {
      throw new BadRequestError('Terminal is not configured as a TOTEM.');
    }

    if (!terminal.isActive) {
      throw new BadRequestError('Terminal is not active.');
    }

    const orphan = await this.posSessionsRepository.findOrphanByTerminal(
      terminal.id.toString(),
      request.tenantId,
    );

    if (orphan) {
      throw new OrphanSessionExistsError(orphan.id.toString());
    }

    const operatorUserId = terminal.systemUserId ?? request.operatorUserId;

    const session = PosSession.create({
      tenantId: terminal.tenantId,
      terminalId: terminal.id,
      operatorUserId: new UniqueEntityID(operatorUserId),
      openingBalance: 0,
    });

    await this.posSessionsRepository.create(session);

    const openingMovement = PosCashMovement.create({
      tenantId: terminal.tenantId,
      sessionId: session.id,
      type: 'OPENING',
      amount: 0,
      performedByUserId: new UniqueEntityID(request.operatorUserId),
    });

    await this.posCashMovementsRepository.create(openingMovement);

    return { session };
  }
}
