import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosTerminal } from '@/entities/sales/pos-terminal';
import { InMemoryPosCashMovementsRepository } from '@/repositories/sales/in-memory/in-memory-pos-cash-movements-repository';
import { InMemoryPosSessionsRepository } from '@/repositories/sales/in-memory/in-memory-pos-sessions-repository';
import { InMemoryPosTerminalsRepository } from '@/repositories/sales/in-memory/in-memory-pos-terminals-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { OpenPosSessionUseCase } from './open-pos-session';

let posSessionsRepository: InMemoryPosSessionsRepository;
let posTerminalsRepository: InMemoryPosTerminalsRepository;
let posCashMovementsRepository: InMemoryPosCashMovementsRepository;
let openPosSession: OpenPosSessionUseCase;

const TENANT_ID = 'tenant-1';
const OPERATOR_USER_ID = 'operator-1';

function createActiveTerminal(
  overrides?: Partial<{ id: string; tenantId: string; isActive: boolean }>,
): PosTerminal {
  return PosTerminal.create({
    id: new UniqueEntityID(overrides?.id ?? 'terminal-1'),
    tenantId: new UniqueEntityID(overrides?.tenantId ?? TENANT_ID),
    name: 'Test Terminal',
    deviceId: `device-${overrides?.id ?? 'terminal-1'}`,
    mode: 'FAST_CHECKOUT',
    warehouseId: new UniqueEntityID('warehouse-1'),
    isActive: overrides?.isActive ?? true,
  });
}

describe('OpenPosSessionUseCase', () => {
  beforeEach(() => {
    posSessionsRepository = new InMemoryPosSessionsRepository();
    posTerminalsRepository = new InMemoryPosTerminalsRepository();
    posCashMovementsRepository = new InMemoryPosCashMovementsRepository();
    openPosSession = new OpenPosSessionUseCase(
      posSessionsRepository,
      posTerminalsRepository,
      posCashMovementsRepository,
    );
  });

  it('should be able to open a POS session', async () => {
    const terminal = createActiveTerminal();
    posTerminalsRepository.items.push(terminal);

    const { session } = await openPosSession.execute({
      tenantId: TENANT_ID,
      terminalId: 'terminal-1',
      operatorUserId: OPERATOR_USER_ID,
      openingBalance: 200,
    });

    expect(session).toBeDefined();
    expect(session.status).toBe('OPEN');
    expect(session.openingBalance).toBe(200);
    expect(session.terminalId.toString()).toBe('terminal-1');
    expect(session.operatorUserId.toString()).toBe(OPERATOR_USER_ID);
    expect(posSessionsRepository.items).toHaveLength(1);
  });

  it('should create an opening cash movement when opening a session', async () => {
    const terminal = createActiveTerminal();
    posTerminalsRepository.items.push(terminal);

    await openPosSession.execute({
      tenantId: TENANT_ID,
      terminalId: 'terminal-1',
      operatorUserId: OPERATOR_USER_ID,
      openingBalance: 150,
    });

    expect(posCashMovementsRepository.items).toHaveLength(1);
    expect(posCashMovementsRepository.items[0].type).toBe('OPENING');
    expect(posCashMovementsRepository.items[0].amount).toBe(150);
  });

  it('should not open a session for a non-existent terminal', async () => {
    await expect(() =>
      openPosSession.execute({
        tenantId: TENANT_ID,
        terminalId: 'non-existent-terminal',
        operatorUserId: OPERATOR_USER_ID,
        openingBalance: 100,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not open a session for an inactive terminal', async () => {
    const inactiveTerminal = createActiveTerminal({ isActive: false });
    posTerminalsRepository.items.push(inactiveTerminal);

    await expect(() =>
      openPosSession.execute({
        tenantId: TENANT_ID,
        terminalId: 'terminal-1',
        operatorUserId: OPERATOR_USER_ID,
        openingBalance: 100,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not open a second session on a terminal that already has an open session', async () => {
    const terminal = createActiveTerminal();
    posTerminalsRepository.items.push(terminal);

    await openPosSession.execute({
      tenantId: TENANT_ID,
      terminalId: 'terminal-1',
      operatorUserId: OPERATOR_USER_ID,
      openingBalance: 100,
    });

    await expect(() =>
      openPosSession.execute({
        tenantId: TENANT_ID,
        terminalId: 'terminal-1',
        operatorUserId: 'operator-2',
        openingBalance: 200,
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
