import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosCashMovement } from '@/entities/sales/pos-cash-movement';
import { PosSession } from '@/entities/sales/pos-session';
import { InMemoryPosCashMovementsRepository } from '@/repositories/sales/in-memory/in-memory-pos-cash-movements-repository';
import { InMemoryPosSessionsRepository } from '@/repositories/sales/in-memory/in-memory-pos-sessions-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock prisma before importing the use case (it imports prisma at module level)
vi.mock('@/lib/prisma', () => ({
  prisma: {
    posTransactionPayment: {
      groupBy: vi.fn().mockResolvedValue([]),
    },
    posTransaction: {
      groupBy: vi.fn().mockResolvedValue([]),
    },
  },
}));

import { GetPosSessionSummaryUseCase } from './get-pos-session-summary';

let posSessionsRepository: InMemoryPosSessionsRepository;
let posCashMovementsRepository: InMemoryPosCashMovementsRepository;
let sut: GetPosSessionSummaryUseCase;

const tenantId = 'tenant-1';

describe('GetPosSessionSummaryUseCase', () => {
  beforeEach(() => {
    posSessionsRepository = new InMemoryPosSessionsRepository();
    posCashMovementsRepository = new InMemoryPosCashMovementsRepository();

    sut = new GetPosSessionSummaryUseCase(
      posSessionsRepository,
      posCashMovementsRepository,
    );
  });

  it('should throw ResourceNotFoundError for non-existing session', async () => {
    await expect(
      sut.execute({ tenantId, sessionId: 'non-existing' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should return session summary with cash movements', async () => {
    const session = PosSession.create({
      tenantId: new UniqueEntityID(tenantId),
      terminalId: new UniqueEntityID('terminal-1'),
      operatorUserId: new UniqueEntityID('user-1'),
      openingBalance: 200,
    });
    posSessionsRepository.items.push(session);

    const supply = PosCashMovement.create({
      tenantId: new UniqueEntityID(tenantId),
      sessionId: session.id,
      type: 'SUPPLY',
      amount: 100,
      performedByUserId: new UniqueEntityID('user-1'),
    });
    const withdrawal = PosCashMovement.create({
      tenantId: new UniqueEntityID(tenantId),
      sessionId: session.id,
      type: 'WITHDRAWAL',
      amount: 50,
      performedByUserId: new UniqueEntityID('user-1'),
    });

    posCashMovementsRepository.items.push(supply, withdrawal);

    const result = await sut.execute({
      tenantId,
      sessionId: session.id.toString(),
    });

    expect(result.sessionId).toBe(session.id.toString());
    expect(result.openingBalance).toBe(200);
    expect(result.totalSupplies).toBe(100);
    expect(result.totalWithdrawals).toBe(50);
    // expectedCash = opening(200) + cash_sales(0) + supplies(100) - withdrawals(50) = 250
    expect(result.expectedCashBalance).toBe(250);
  });
});
