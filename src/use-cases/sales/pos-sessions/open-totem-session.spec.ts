import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosSession } from '@/entities/sales/pos-session';
import { InMemoryPosCashMovementsRepository } from '@/repositories/sales/in-memory/in-memory-pos-cash-movements-repository';
import { InMemoryPosSessionsRepository } from '@/repositories/sales/in-memory/in-memory-pos-sessions-repository';
import { InMemoryPosTerminalsRepository } from '@/repositories/sales/in-memory/in-memory-pos-terminals-repository';
import { makePosTerminal } from '@/utils/tests/factories/sales/make-pos-terminal';
import { beforeEach, describe, expect, it } from 'vitest';
import { OpenTotemSessionUseCase } from './open-totem-session';

let posSessionsRepository: InMemoryPosSessionsRepository;
let posTerminalsRepository: InMemoryPosTerminalsRepository;
let posCashMovementsRepository: InMemoryPosCashMovementsRepository;
let sut: OpenTotemSessionUseCase;

const tenantId = 'tenant-1';

describe('OpenTotemSessionUseCase', () => {
  beforeEach(() => {
    posSessionsRepository = new InMemoryPosSessionsRepository();
    posTerminalsRepository = new InMemoryPosTerminalsRepository();
    posCashMovementsRepository = new InMemoryPosCashMovementsRepository();

    sut = new OpenTotemSessionUseCase(
      posSessionsRepository,
      posTerminalsRepository,
      posCashMovementsRepository,
    );
  });

  it('should open a session for a valid totem terminal', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
      mode: 'TOTEM',
      totemCode: 'TOTEM-001',
      isActive: true,
    });
    posTerminalsRepository.items.push(terminal);

    const result = await sut.execute({
      tenantId,
      totemCode: 'TOTEM-001',
      operatorUserId: 'user-1',
    });

    expect(result.session).toBeTruthy();
    expect(result.session.status).toBe('OPEN');
    expect(result.session.openingBalance).toBe(0);
    expect(posSessionsRepository.items).toHaveLength(1);
    expect(posCashMovementsRepository.items).toHaveLength(1);
    expect(posCashMovementsRepository.items[0].type).toBe('OPENING');
  });

  it('should throw ResourceNotFoundError for non-existing totem code', async () => {
    await expect(
      sut.execute({
        tenantId,
        totemCode: 'NONEXISTENT',
        operatorUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError if terminal belongs to different tenant', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID('other-tenant'),
      mode: 'TOTEM',
      totemCode: 'TOTEM-002',
      isActive: true,
    });
    posTerminalsRepository.items.push(terminal);

    await expect(
      sut.execute({
        tenantId,
        totemCode: 'TOTEM-002',
        operatorUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError if terminal mode is not TOTEM', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
      mode: 'CASHIER',
      totemCode: 'TOTEM-003',
      isActive: true,
    });
    posTerminalsRepository.items.push(terminal);

    await expect(
      sut.execute({
        tenantId,
        totemCode: 'TOTEM-003',
        operatorUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError if terminal is inactive', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
      mode: 'TOTEM',
      totemCode: 'TOTEM-004',
      isActive: false,
    });
    posTerminalsRepository.items.push(terminal);

    await expect(
      sut.execute({
        tenantId,
        totemCode: 'TOTEM-004',
        operatorUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw error if orphan open session exists', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
      mode: 'TOTEM',
      totemCode: 'TOTEM-005',
      isActive: true,
    });
    posTerminalsRepository.items.push(terminal);

    const orphan = PosSession.create({
      tenantId: new UniqueEntityID(tenantId),
      terminalId: terminal.id,
      operatorUserId: new UniqueEntityID('user-1'),
      openingBalance: 0,
      status: 'OPEN',
    });
    posSessionsRepository.items.push(orphan);

    await expect(
      sut.execute({
        tenantId,
        totemCode: 'TOTEM-005',
        operatorUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
