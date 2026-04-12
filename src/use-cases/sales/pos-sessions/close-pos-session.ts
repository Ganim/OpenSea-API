import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosCashMovement } from '@/entities/sales/pos-cash-movement';
import type { PosSession } from '@/entities/sales/pos-session';
import type { PosCashMovementsRepository } from '@/repositories/sales/pos-cash-movements-repository';
import type { PosSessionsRepository } from '@/repositories/sales/pos-sessions-repository';
import { prisma } from '@/lib/prisma';

interface ClosingBreakdown {
  cash?: number;
  creditCard?: number;
  debitCard?: number;
  pix?: number;
  checks?: number;
  other?: number;
}

interface ClosePosSessionUseCaseRequest {
  tenantId: string;
  sessionId: string;
  userId: string;
  closingBalance: number;
  closingBreakdown?: ClosingBreakdown;
  notes?: string;
}

interface ClosePosSessionUseCaseResponse {
  session: PosSession;
}

export class ClosePosSessionUseCase {
  constructor(
    private posSessionsRepository: PosSessionsRepository,
    private posCashMovementsRepository: PosCashMovementsRepository,
  ) {}

  async execute(
    request: ClosePosSessionUseCaseRequest,
  ): Promise<ClosePosSessionUseCaseResponse> {
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

    // Calculate expected cash from movements (opening, supplies, withdrawals)
    const movements = await this.posCashMovementsRepository.findBySessionId(
      request.sessionId,
    );

    let expectedCash = 0;
    for (const mov of movements) {
      switch (mov.type) {
        case 'OPENING':
        case 'SUPPLY':
          expectedCash += mov.amount;
          break;
        case 'WITHDRAWAL':
          expectedCash -= mov.amount;
          break;
      }
    }

    // Sum only CASH payments from completed transactions (not all methods)
    const cashPaymentResult = await prisma.posTransactionPayment.aggregate({
      where: {
        method: 'CASH',
        transaction: {
          sessionId: request.sessionId,
          status: 'COMPLETED',
        },
      },
      _sum: {
        amount: true,
      },
    });

    expectedCash += cashPaymentResult._sum.amount?.toNumber() ?? 0;

    const difference = request.closingBalance - expectedCash;

    session.status = 'CLOSED';
    session.closedAt = new Date();
    session.closingBalance = request.closingBalance;
    session.expectedBalance = expectedCash;
    session.difference = difference;
    session.closingBreakdown = request.closingBreakdown as
      | Record<string, unknown>
      | undefined;
    if (request.notes) session.notes = request.notes;

    await this.posSessionsRepository.save(session);

    // Record closing cash movement
    const closingMovement = PosCashMovement.create({
      tenantId: new UniqueEntityID(request.tenantId),
      sessionId: session.id,
      type: 'CLOSING',
      amount: request.closingBalance,
      performedByUserId: new UniqueEntityID(request.userId),
    });

    await this.posCashMovementsRepository.create(closingMovement);

    return { session };
  }
}
