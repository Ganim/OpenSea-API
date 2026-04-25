import { beforeEach, describe, expect, it } from 'vitest';

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosOrderConflictStatus } from '@/entities/sales/value-objects/pos-order-conflict-status';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryPosOrderConflictsRepository } from '@/repositories/sales/in-memory/in-memory-pos-order-conflicts-repository';
import { InMemoryPosTerminalsRepository } from '@/repositories/sales/in-memory/in-memory-pos-terminals-repository';
import { makeEmployee } from '@/utils/tests/factories/hr/make-employee';
import { makePosOrderConflict } from '@/utils/tests/factories/sales/make-pos-order-conflict';
import { makePosTerminal } from '@/utils/tests/factories/sales/make-pos-terminal';

import { ListConflictsUseCase } from './list-conflicts';

let conflictsRepository: InMemoryPosOrderConflictsRepository;
let posTerminalsRepository: InMemoryPosTerminalsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: ListConflictsUseCase;

const tenantId = new UniqueEntityID().toString();
const otherTenantId = new UniqueEntityID().toString();

describe('List POS Conflicts Use Case', () => {
  beforeEach(() => {
    conflictsRepository = new InMemoryPosOrderConflictsRepository();
    posTerminalsRepository = new InMemoryPosTerminalsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new ListConflictsUseCase(
      conflictsRepository,
      posTerminalsRepository,
      employeesRepository,
    );
  });

  it('filtra por status PENDING_RESOLUTION e respeita paginação default (page=1, limit=20)', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
      terminalName: 'Caixa 01',
    });
    posTerminalsRepository.items.push(terminal);

    // 30 PENDING + 10 já resolvidos (CANCELED_REFUNDED), ambos com timestamps
    // crescentes para garantir uma ordenação determinística.
    const baseDate = new Date('2026-04-20T00:00:00Z').getTime();

    for (let pendingIndex = 0; pendingIndex < 30; pendingIndex++) {
      conflictsRepository.items.push(
        makePosOrderConflict({
          tenantId,
          posTerminalId: terminal.id.toString(),
          status: PosOrderConflictStatus.PENDING_RESOLUTION(),
          createdAt: new Date(baseDate + pendingIndex * 60_000),
        }),
      );
    }

    for (let resolvedIndex = 0; resolvedIndex < 10; resolvedIndex++) {
      conflictsRepository.items.push(
        makePosOrderConflict({
          tenantId,
          posTerminalId: terminal.id.toString(),
          status: PosOrderConflictStatus.CANCELED_REFUNDED(),
          createdAt: new Date(baseDate + resolvedIndex * 60_000),
        }),
      );
    }

    const { data, meta } = await sut.execute({
      tenantId,
      page: 1,
      limit: 20,
      status: ['PENDING_RESOLUTION'],
    });

    expect(meta.total).toBe(30);
    expect(meta.page).toBe(1);
    expect(meta.limit).toBe(20);
    expect(meta.pages).toBe(2);
    expect(data).toHaveLength(20);
    for (const row of data) {
      expect(row.status).toBe('PENDING_RESOLUTION');
    }
  });

  it('filtra por terminalId — todos os retornados pertencem ao terminal informado', async () => {
    const targetTerminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
      terminalName: 'Caixa Alvo',
    });
    const otherTerminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
      terminalName: 'Outro Caixa',
    });
    posTerminalsRepository.items.push(targetTerminal, otherTerminal);

    for (let i = 0; i < 5; i++) {
      conflictsRepository.items.push(
        makePosOrderConflict({
          tenantId,
          posTerminalId: targetTerminal.id.toString(),
        }),
      );
    }
    for (let i = 0; i < 3; i++) {
      conflictsRepository.items.push(
        makePosOrderConflict({
          tenantId,
          posTerminalId: otherTerminal.id.toString(),
        }),
      );
    }

    const { data, meta } = await sut.execute({
      tenantId,
      page: 1,
      limit: 20,
      terminalId: targetTerminal.id.toString(),
    });

    expect(meta.total).toBe(5);
    expect(data).toHaveLength(5);
    for (const row of data) {
      expect(row.posTerminalId).toBe(targetTerminal.id.toString());
      expect(row.terminalName).toBe('Caixa Alvo');
    }
  });

  it('enriquece cada item com terminalName, operatorName e operatorShortId', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
      terminalName: 'Caixa Enriquecido',
    });
    posTerminalsRepository.items.push(terminal);

    const operator = makeEmployee({
      tenantId: new UniqueEntityID(tenantId),
      fullName: 'Maria Operadora',
      shortId: 'OP1234',
    });
    employeesRepository.items.push(operator);

    conflictsRepository.items.push(
      makePosOrderConflict({
        tenantId,
        posTerminalId: terminal.id.toString(),
        posOperatorEmployeeId: operator.id.toString(),
      }),
    );

    const { data } = await sut.execute({
      tenantId,
      page: 1,
      limit: 20,
    });

    expect(data).toHaveLength(1);
    expect(data[0].terminalName).toBe('Caixa Enriquecido');
    expect(data[0].operatorName).toBe('Maria Operadora');
    expect(data[0].operatorShortId).toBe('OP1234');
  });

  it('filtra por operatorEmployeeId — retorna apenas os conflitos do operador informado', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
    });
    posTerminalsRepository.items.push(terminal);

    const targetOperator = makeEmployee({
      tenantId: new UniqueEntityID(tenantId),
      fullName: 'Operador Alvo',
      shortId: 'TGT001',
    });
    const otherOperator = makeEmployee({
      tenantId: new UniqueEntityID(tenantId),
      fullName: 'Outro Operador',
      shortId: 'OTH001',
    });
    employeesRepository.items.push(targetOperator, otherOperator);

    conflictsRepository.items.push(
      makePosOrderConflict({
        tenantId,
        posTerminalId: terminal.id.toString(),
        posOperatorEmployeeId: targetOperator.id.toString(),
      }),
      makePosOrderConflict({
        tenantId,
        posTerminalId: terminal.id.toString(),
        posOperatorEmployeeId: targetOperator.id.toString(),
      }),
      makePosOrderConflict({
        tenantId,
        posTerminalId: terminal.id.toString(),
        posOperatorEmployeeId: otherOperator.id.toString(),
      }),
    );

    const { data, meta } = await sut.execute({
      tenantId,
      page: 1,
      limit: 20,
      operatorEmployeeId: targetOperator.id.toString(),
    });

    expect(meta.total).toBe(2);
    expect(data).toHaveLength(2);
    for (const row of data) {
      expect(row.posOperatorEmployeeId).toBe(targetOperator.id.toString());
      expect(row.operatorName).toBe('Operador Alvo');
      expect(row.operatorShortId).toBe('TGT001');
    }
  });

  it('isola conflitos por tenantId — não vaza dados de outros tenants', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
      terminalName: 'Caixa Tenant Atual',
    });
    posTerminalsRepository.items.push(terminal);

    conflictsRepository.items.push(
      makePosOrderConflict({
        tenantId,
        posTerminalId: terminal.id.toString(),
      }),
      makePosOrderConflict({
        tenantId: otherTenantId,
        posTerminalId: new UniqueEntityID().toString(),
      }),
    );

    const { data, meta } = await sut.execute({
      tenantId,
      page: 1,
      limit: 20,
    });

    expect(meta.total).toBe(1);
    expect(data).toHaveLength(1);
  });

  it('preenche terminalName/operatorName com string vazia quando entidades não são resolvidas (defense-in-depth)', async () => {
    const orphanTerminalId = new UniqueEntityID().toString();
    const orphanOperatorId = new UniqueEntityID().toString();

    conflictsRepository.items.push(
      makePosOrderConflict({
        tenantId,
        posTerminalId: orphanTerminalId,
        posOperatorEmployeeId: orphanOperatorId,
      }),
    );

    const { data } = await sut.execute({
      tenantId,
      page: 1,
      limit: 20,
    });

    expect(data).toHaveLength(1);
    expect(data[0].terminalName).toBe('');
    expect(data[0].operatorName).toBe('');
    expect(data[0].operatorShortId).toBe('');
  });
});
