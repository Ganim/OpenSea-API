import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosCoordinationMode } from '@/entities/sales/value-objects/pos-coordination-mode';
import { PosOperatorSessionMode } from '@/entities/sales/value-objects/pos-operator-session-mode';
import { InMemoryPosTerminalsRepository } from '@/repositories/sales/in-memory/in-memory-pos-terminals-repository';
import { makePosTerminal } from '@/utils/tests/factories/sales/make-pos-terminal';

import { UpdateSessionModeUseCase } from './update-session-mode';

let posTerminalsRepository: InMemoryPosTerminalsRepository;
let sut: UpdateSessionModeUseCase;

const tenantId = new UniqueEntityID().toString();
const adminUserId = new UniqueEntityID().toString();

describe('Update POS Terminal Session Mode Use Case', () => {
  beforeEach(() => {
    posTerminalsRepository = new InMemoryPosTerminalsRepository();
    sut = new UpdateSessionModeUseCase(posTerminalsRepository);
  });

  it('atualiza coordinationMode preservando demais valores', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
    });
    posTerminalsRepository.items.push(terminal);

    const { terminal: updated } = await sut.execute({
      tenantId,
      terminalId: terminal.id.toString(),
      operatorSessionMode: 'PER_SALE',
      coordinationMode: 'BOTH',
      updatedByUserId: adminUserId,
    });

    expect(updated.operatorSessionMode.value).toBe('PER_SALE');
    expect(updated.coordinationMode.value).toBe('BOTH');
    expect(updated.operatorSessionTimeout).toBeNull();
  });

  it('força operatorSessionTimeout para null quando modo é PER_SALE', async () => {
    const terminal = makePosTerminal(
      {
        tenantId: new UniqueEntityID(tenantId),
        operatorSessionMode: PosOperatorSessionMode.STAY_LOGGED_IN(),
        operatorSessionTimeout: 1800,
      },
      undefined,
    );
    posTerminalsRepository.items.push(terminal);

    const { terminal: updated } = await sut.execute({
      tenantId,
      terminalId: terminal.id.toString(),
      operatorSessionMode: 'PER_SALE',
      operatorSessionTimeout: 600,
      updatedByUserId: adminUserId,
    });

    expect(updated.operatorSessionMode.value).toBe('PER_SALE');
    expect(updated.operatorSessionTimeout).toBeNull();
  });

  it('aceita STAY_LOGGED_IN com operatorSessionTimeout válido', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
    });
    posTerminalsRepository.items.push(terminal);

    const { terminal: updated } = await sut.execute({
      tenantId,
      terminalId: terminal.id.toString(),
      operatorSessionMode: 'STAY_LOGGED_IN',
      operatorSessionTimeout: 1800,
      updatedByUserId: adminUserId,
    });

    expect(updated.operatorSessionMode.value).toBe('STAY_LOGGED_IN');
    expect(updated.operatorSessionTimeout).toBe(1800);
  });

  it('aceita autoCloseSessionAt em formato HH:MM válido', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
    });
    posTerminalsRepository.items.push(terminal);

    const { terminal: updated } = await sut.execute({
      tenantId,
      terminalId: terminal.id.toString(),
      operatorSessionMode: 'PER_SALE',
      autoCloseSessionAt: '23:30',
      updatedByUserId: adminUserId,
    });

    expect(updated.autoCloseSessionAt).toBe('23:30');
  });

  it('limpa autoCloseSessionAt quando recebe null', async () => {
    const terminal = makePosTerminal(
      {
        tenantId: new UniqueEntityID(tenantId),
        autoCloseSessionAt: '22:00',
      },
      undefined,
    );
    posTerminalsRepository.items.push(terminal);

    const { terminal: updated } = await sut.execute({
      tenantId,
      terminalId: terminal.id.toString(),
      operatorSessionMode: 'PER_SALE',
      autoCloseSessionAt: null,
      updatedByUserId: adminUserId,
    });

    expect(updated.autoCloseSessionAt).toBeNull();
  });

  it('lança BadRequestError quando STAY_LOGGED_IN sem operatorSessionTimeout', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
    });
    posTerminalsRepository.items.push(terminal);

    await expect(
      sut.execute({
        tenantId,
        terminalId: terminal.id.toString(),
        operatorSessionMode: 'STAY_LOGGED_IN',
        updatedByUserId: adminUserId,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('lança BadRequestError quando STAY_LOGGED_IN com operatorSessionTimeout <= 0', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
    });
    posTerminalsRepository.items.push(terminal);

    await expect(
      sut.execute({
        tenantId,
        terminalId: terminal.id.toString(),
        operatorSessionMode: 'STAY_LOGGED_IN',
        operatorSessionTimeout: 0,
        updatedByUserId: adminUserId,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('lança BadRequestError quando autoCloseSessionAt fora do formato HH:MM', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
    });
    posTerminalsRepository.items.push(terminal);

    await expect(
      sut.execute({
        tenantId,
        terminalId: terminal.id.toString(),
        operatorSessionMode: 'PER_SALE',
        autoCloseSessionAt: '25:00',
        updatedByUserId: adminUserId,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('lança ResourceNotFoundError quando terminal não existe no tenant', async () => {
    const missingTerminalId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId,
        terminalId: missingTerminalId,
        operatorSessionMode: 'PER_SALE',
        updatedByUserId: adminUserId,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('lança ResourceNotFoundError ao tentar atualizar terminal de outro tenant (isolation)', async () => {
    const otherTenantId = new UniqueEntityID().toString();
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(otherTenantId),
    });
    posTerminalsRepository.items.push(terminal);

    await expect(
      sut.execute({
        tenantId,
        terminalId: terminal.id.toString(),
        operatorSessionMode: 'PER_SALE',
        updatedByUserId: adminUserId,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('persiste mudanças via repositório (save chamado com terminal mutado)', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
      coordinationMode: PosCoordinationMode.STANDALONE(),
    });
    posTerminalsRepository.items.push(terminal);

    await sut.execute({
      tenantId,
      terminalId: terminal.id.toString(),
      operatorSessionMode: 'STAY_LOGGED_IN',
      operatorSessionTimeout: 900,
      coordinationMode: 'CASHIER',
      updatedByUserId: adminUserId,
    });

    const persisted = await posTerminalsRepository.findById(
      terminal.id,
      tenantId,
    );
    expect(persisted?.operatorSessionMode.value).toBe('STAY_LOGGED_IN');
    expect(persisted?.operatorSessionTimeout).toBe(900);
    expect(persisted?.coordinationMode.value).toBe('CASHIER');
  });
});
