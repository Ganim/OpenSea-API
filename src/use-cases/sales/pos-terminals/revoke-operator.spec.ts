import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosTerminalOperator } from '@/entities/sales/pos-terminal-operator';
import { InMemoryPosTerminalOperatorsRepository } from '@/repositories/sales/in-memory/in-memory-pos-terminal-operators-repository';
import { makeEmployee } from '@/utils/tests/factories/hr/make-employee';
import { makePosTerminal } from '@/utils/tests/factories/sales/make-pos-terminal';

import { RevokeOperatorUseCase } from './revoke-operator';

let operatorsRepository: InMemoryPosTerminalOperatorsRepository;
let sut: RevokeOperatorUseCase;

const tenantId = new UniqueEntityID().toString();
const adminUserId = new UniqueEntityID().toString();

describe('Revoke Operator of POS Terminal Use Case', () => {
  beforeEach(() => {
    operatorsRepository = new InMemoryPosTerminalOperatorsRepository();
    sut = new RevokeOperatorUseCase(operatorsRepository);
  });

  it('revoga vínculo ativo existente entre terminal e employee', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
    });
    const employee = makeEmployee({ tenantId: new UniqueEntityID(tenantId) });

    const activeOperator = PosTerminalOperator.create({
      terminalId: terminal.id,
      employeeId: employee.id,
      tenantId,
      assignedByUserId: new UniqueEntityID(adminUserId),
    });
    operatorsRepository.items.push(activeOperator);
    expect(activeOperator.isActive).toBe(true);

    const revokerUserId = new UniqueEntityID().toString();

    const { operator } = await sut.execute({
      tenantId,
      terminalId: terminal.id.toString(),
      employeeId: employee.id.toString(),
      revokedByUserId: revokerUserId,
    });

    expect(operator).toBeInstanceOf(PosTerminalOperator);
    expect(operator.isActive).toBe(false);
    expect(operator.revokedAt).not.toBeNull();
    expect(operator.revokedByUserId?.toString()).toBe(revokerUserId);
    expect(operator.id.toString()).toBe(activeOperator.id.toString());
    expect(operatorsRepository.items).toHaveLength(1);
  });

  it('lança ResourceNotFoundError quando vínculo entre terminal e employee não existe', async () => {
    const missingTerminalId = new UniqueEntityID().toString();
    const missingEmployeeId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId,
        terminalId: missingTerminalId,
        employeeId: missingEmployeeId,
        revokedByUserId: adminUserId,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('lança BadRequestError quando o vínculo já está revogado', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
    });
    const employee = makeEmployee({ tenantId: new UniqueEntityID(tenantId) });

    const revokedOperator = PosTerminalOperator.create({
      terminalId: terminal.id,
      employeeId: employee.id,
      tenantId,
      assignedByUserId: new UniqueEntityID(adminUserId),
    });
    revokedOperator.revoke(new UniqueEntityID(adminUserId));
    operatorsRepository.items.push(revokedOperator);
    expect(revokedOperator.isActive).toBe(false);

    await expect(
      sut.execute({
        tenantId,
        terminalId: terminal.id.toString(),
        employeeId: employee.id.toString(),
        revokedByUserId: adminUserId,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('não revoga vínculo pertencente a outro tenant (isolation)', async () => {
    const otherTenantId = new UniqueEntityID().toString();
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(otherTenantId),
    });
    const employee = makeEmployee({
      tenantId: new UniqueEntityID(otherTenantId),
    });

    const foreignOperator = PosTerminalOperator.create({
      terminalId: terminal.id,
      employeeId: employee.id,
      tenantId: otherTenantId,
      assignedByUserId: new UniqueEntityID(adminUserId),
    });
    operatorsRepository.items.push(foreignOperator);

    await expect(
      sut.execute({
        tenantId,
        terminalId: terminal.id.toString(),
        employeeId: employee.id.toString(),
        revokedByUserId: adminUserId,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);

    expect(foreignOperator.isActive).toBe(true);
  });
});
