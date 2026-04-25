import { describe, it, expect } from 'vitest';

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosTerminalOperator } from '@/entities/sales/pos-terminal-operator';

import { InMemoryPosTerminalOperatorsRepository } from './in-memory-pos-terminal-operators-repository';

describe('InMemoryPosTerminalOperatorsRepository', () => {
  it('compiles and instantiates', async () => {
    const repo = new InMemoryPosTerminalOperatorsRepository();
    expect(repo.items).toEqual([]);
  });

  it('creates, finds, and paginates operators', async () => {
    const repo = new InMemoryPosTerminalOperatorsRepository();
    const terminalId = new UniqueEntityID();
    const employeeId = new UniqueEntityID();
    const userId = new UniqueEntityID();

    const operator = PosTerminalOperator.create({
      terminalId,
      employeeId,
      tenantId: 'tenant-1',
      assignedByUserId: userId,
    });

    await repo.create(operator);

    const byId = await repo.findById(operator.id, 'tenant-1');
    expect(byId?.id.toString()).toBe(operator.id.toString());

    const byPair = await repo.findByTerminalAndEmployee(
      terminalId,
      employeeId,
      'tenant-1',
    );
    expect(byPair?.id.toString()).toBe(operator.id.toString());

    const active = await repo.findActiveByTerminalId(terminalId, 'tenant-1');
    expect(active).toHaveLength(1);

    const page = await repo.findManyByTerminalIdPaginated({
      terminalId: terminalId.toString(),
      tenantId: 'tenant-1',
      page: 1,
      limit: 10,
    });
    expect(page.total).toBe(1);
    expect(page.data).toHaveLength(1);
  });
});
