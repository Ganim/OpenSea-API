import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosTerminalOperator } from '@/entities/sales/pos-terminal-operator';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryPosTerminalOperatorsRepository } from '@/repositories/sales/in-memory/in-memory-pos-terminal-operators-repository';
import { InMemoryPosTerminalsRepository } from '@/repositories/sales/in-memory/in-memory-pos-terminals-repository';
import { makeEmployee } from '@/utils/tests/factories/hr/make-employee';
import { makePosTerminal } from '@/utils/tests/factories/sales/make-pos-terminal';

import { AssignOperatorUseCase } from './assign-operator';

let posTerminalsRepository: InMemoryPosTerminalsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let operatorsRepository: InMemoryPosTerminalOperatorsRepository;
let sut: AssignOperatorUseCase;

const tenantId = new UniqueEntityID().toString();
const adminUserId = new UniqueEntityID().toString();

describe('Assign Operator to POS Terminal Use Case', () => {
  beforeEach(() => {
    posTerminalsRepository = new InMemoryPosTerminalsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    operatorsRepository = new InMemoryPosTerminalOperatorsRepository();
    sut = new AssignOperatorUseCase(
      posTerminalsRepository,
      employeesRepository,
      operatorsRepository,
    );
  });

  it('cria vínculo ativo quando terminal e employee existem no mesmo tenant', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
    });
    posTerminalsRepository.items.push(terminal);
    const employee = makeEmployee({ tenantId: new UniqueEntityID(tenantId) });
    employeesRepository.items.push(employee);

    const { operator } = await sut.execute({
      tenantId,
      terminalId: terminal.id.toString(),
      employeeId: employee.id.toString(),
      assignedByUserId: adminUserId,
    });

    expect(operator).toBeInstanceOf(PosTerminalOperator);
    expect(operator.isActive).toBe(true);
    expect(operator.terminalId.toString()).toBe(terminal.id.toString());
    expect(operator.employeeId.toString()).toBe(employee.id.toString());
    expect(operator.tenantId).toBe(tenantId);
    expect(operator.assignedByUserId.toString()).toBe(adminUserId);
    expect(operator.revokedAt).toBeNull();
    expect(operator.revokedByUserId).toBeNull();
    expect(operatorsRepository.items).toHaveLength(1);
  });

  it('lança ResourceNotFoundError quando o terminal não existe no tenant', async () => {
    const employee = makeEmployee({ tenantId: new UniqueEntityID(tenantId) });
    employeesRepository.items.push(employee);
    const missingTerminalId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId,
        terminalId: missingTerminalId,
        employeeId: employee.id.toString(),
        assignedByUserId: adminUserId,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('lança ResourceNotFoundError quando o employee não existe no tenant', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
    });
    posTerminalsRepository.items.push(terminal);
    const missingEmployeeId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId,
        terminalId: terminal.id.toString(),
        employeeId: missingEmployeeId,
        assignedByUserId: adminUserId,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('lança BadRequestError quando vínculo ativo já existe entre terminal e employee', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
    });
    posTerminalsRepository.items.push(terminal);
    const employee = makeEmployee({ tenantId: new UniqueEntityID(tenantId) });
    employeesRepository.items.push(employee);

    await sut.execute({
      tenantId,
      terminalId: terminal.id.toString(),
      employeeId: employee.id.toString(),
      assignedByUserId: adminUserId,
    });

    await expect(
      sut.execute({
        tenantId,
        terminalId: terminal.id.toString(),
        employeeId: employee.id.toString(),
        assignedByUserId: adminUserId,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);

    expect(operatorsRepository.items).toHaveLength(1);
  });

  it('reativa vínculo revogado existente em vez de criar duplicata', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
    });
    posTerminalsRepository.items.push(terminal);
    const employee = makeEmployee({ tenantId: new UniqueEntityID(tenantId) });
    employeesRepository.items.push(employee);

    const previousAdminUserId = new UniqueEntityID(adminUserId);
    const revokedOperator = PosTerminalOperator.create({
      terminalId: terminal.id,
      employeeId: employee.id,
      tenantId,
      assignedByUserId: previousAdminUserId,
      assignedAt: new Date('2026-01-01T10:00:00Z'),
    });
    revokedOperator.revoke(new UniqueEntityID(adminUserId));
    operatorsRepository.items.push(revokedOperator);
    expect(revokedOperator.isActive).toBe(false);
    expect(revokedOperator.revokedAt).not.toBeNull();

    const newAssignerUserId = new UniqueEntityID().toString();

    const { operator } = await sut.execute({
      tenantId,
      terminalId: terminal.id.toString(),
      employeeId: employee.id.toString(),
      assignedByUserId: newAssignerUserId,
    });

    expect(operator.id.toString()).toBe(revokedOperator.id.toString());
    expect(operator.isActive).toBe(true);
    expect(operator.revokedAt).toBeNull();
    expect(operator.revokedByUserId).toBeNull();
    expect(operator.assignedByUserId.toString()).toBe(newAssignerUserId);
    expect(operator.assignedAt.getTime()).toBeGreaterThan(
      new Date('2026-01-01T10:00:00Z').getTime(),
    );
    expect(operatorsRepository.items).toHaveLength(1);
  });
});
