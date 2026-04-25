import { describe, expect, it } from 'vitest';

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

import { PosTerminalOperator } from './pos-terminal-operator';

describe('PosTerminalOperator entity', () => {
  it('cria com isActive = true por padrão', () => {
    const op = PosTerminalOperator.create({
      terminalId: new UniqueEntityID('term-1'),
      employeeId: new UniqueEntityID('emp-1'),
      tenantId: 'tenant-1',
      assignedByUserId: new UniqueEntityID('user-1'),
    });

    expect(op.isActive).toBe(true);
    expect(op.revokedAt).toBeNull();
    expect(op.revokedByUserId).toBeNull();
  });

  it('aceita assignedAt explícito', () => {
    const date = new Date('2026-01-01T10:00:00Z');
    const op = PosTerminalOperator.create({
      terminalId: new UniqueEntityID('term-1'),
      employeeId: new UniqueEntityID('emp-1'),
      tenantId: 'tenant-1',
      assignedByUserId: new UniqueEntityID('user-1'),
      assignedAt: date,
    });

    expect(op.assignedAt).toBe(date);
  });

  it('revoke() seta isActive false, revokedAt e revokedByUserId', () => {
    const op = PosTerminalOperator.create({
      terminalId: new UniqueEntityID('term-1'),
      employeeId: new UniqueEntityID('emp-1'),
      tenantId: 'tenant-1',
      assignedByUserId: new UniqueEntityID('user-1'),
    });

    const revoker = new UniqueEntityID('user-revoker');
    op.revoke(revoker);

    expect(op.isActive).toBe(false);
    expect(op.revokedAt).not.toBeNull();
    expect(op.revokedAt).toBeInstanceOf(Date);
    expect(op.revokedByUserId?.toString()).toBe('user-revoker');
  });

  it('reactivate() limpa revokedAt/revokedByUserId, atualiza assignedAt e seta novo assignedByUserId', () => {
    const op = PosTerminalOperator.create({
      terminalId: new UniqueEntityID('term-1'),
      employeeId: new UniqueEntityID('emp-1'),
      tenantId: 'tenant-1',
      assignedByUserId: new UniqueEntityID('user-1'),
      assignedAt: new Date('2026-01-01T10:00:00Z'),
    });
    op.revoke(new UniqueEntityID('user-revoker'));
    expect(op.isActive).toBe(false);

    const newAssigner = new UniqueEntityID('user-new-assigner');
    op.reactivate(newAssigner);

    expect(op.isActive).toBe(true);
    expect(op.revokedAt).toBeNull();
    expect(op.revokedByUserId).toBeNull();
    expect(op.assignedByUserId.toString()).toBe('user-new-assigner');
    expect(op.assignedAt.getTime()).toBeGreaterThan(
      new Date('2026-01-01T10:00:00Z').getTime(),
    );
  });

  it('aceita id explícito', () => {
    const explicitId = new UniqueEntityID('explicit-id');
    const op = PosTerminalOperator.create(
      {
        terminalId: new UniqueEntityID('term-1'),
        employeeId: new UniqueEntityID('emp-1'),
        tenantId: 'tenant-1',
        assignedByUserId: new UniqueEntityID('user-1'),
      },
      explicitId,
    );

    expect(op.id.toString()).toBe('explicit-id');
  });
});
