import { beforeEach, describe, expect, it } from 'vitest';

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosTerminalOperator } from '@/entities/sales/pos-terminal-operator';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryPosTerminalOperatorsRepository } from '@/repositories/sales/in-memory/in-memory-pos-terminal-operators-repository';
import { InMemoryPosTerminalsRepository } from '@/repositories/sales/in-memory/in-memory-pos-terminals-repository';
import { makeEmployee } from '@/utils/tests/factories/hr/make-employee';
import { makePosTerminal } from '@/utils/tests/factories/sales/make-pos-terminal';

import { ListTerminalOperatorsUseCase } from './list-terminal-operators';

let posTerminalsRepository: InMemoryPosTerminalsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let operatorsRepository: InMemoryPosTerminalOperatorsRepository;
let sut: ListTerminalOperatorsUseCase;

const tenantId = new UniqueEntityID().toString();
const adminUserId = new UniqueEntityID().toString();

describe('List POS Terminal Operators Use Case', () => {
  beforeEach(() => {
    posTerminalsRepository = new InMemoryPosTerminalsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    operatorsRepository = new InMemoryPosTerminalOperatorsRepository();
    sut = new ListTerminalOperatorsUseCase(
      posTerminalsRepository,
      operatorsRepository,
      employeesRepository,
    );
  });

  it('retorna apenas operadores ativos por padrão, ordenados por assignedAt DESC e enriquecidos com nome do employee', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
    });
    posTerminalsRepository.items.push(terminal);

    const employeeAlice = makeEmployee({
      tenantId: new UniqueEntityID(tenantId),
      fullName: 'Alice Anderson',
    });
    const employeeBob = makeEmployee({
      tenantId: new UniqueEntityID(tenantId),
      fullName: 'Bob Brown',
    });
    const employeeCarol = makeEmployee({
      tenantId: new UniqueEntityID(tenantId),
      fullName: 'Carol Clark',
    });
    employeesRepository.items.push(employeeAlice, employeeBob, employeeCarol);

    const operatorAlice = PosTerminalOperator.create({
      terminalId: terminal.id,
      employeeId: employeeAlice.id,
      tenantId,
      assignedByUserId: new UniqueEntityID(adminUserId),
      assignedAt: new Date('2026-03-01T10:00:00Z'),
    });
    const operatorBob = PosTerminalOperator.create({
      terminalId: terminal.id,
      employeeId: employeeBob.id,
      tenantId,
      assignedByUserId: new UniqueEntityID(adminUserId),
      assignedAt: new Date('2026-03-15T10:00:00Z'),
    });
    const operatorCarol = PosTerminalOperator.create({
      terminalId: terminal.id,
      employeeId: employeeCarol.id,
      tenantId,
      assignedByUserId: new UniqueEntityID(adminUserId),
      assignedAt: new Date('2026-03-10T10:00:00Z'),
    });
    // Revoked — must be filtered out by default
    operatorCarol.revoke(new UniqueEntityID(adminUserId));

    operatorsRepository.items.push(operatorAlice, operatorBob, operatorCarol);

    const { data, meta } = await sut.execute({
      tenantId,
      terminalId: terminal.id.toString(),
      page: 1,
      limit: 20,
    });

    expect(data).toHaveLength(2);
    // ORDER: Bob (Mar 15) first, then Alice (Mar 1).
    expect(data[0].employeeId).toBe(employeeBob.id.toString());
    expect(data[0].employeeName).toBe('Bob Brown');
    expect(data[1].employeeId).toBe(employeeAlice.id.toString());
    expect(data[1].employeeName).toBe('Alice Anderson');

    expect(meta.total).toBe(2);
    expect(meta.page).toBe(1);
    expect(meta.limit).toBe(20);
    expect(meta.pages).toBe(1);
  });

  it('retorna todos os operadores (ativos + revogados) quando isActive=all', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
    });
    posTerminalsRepository.items.push(terminal);

    const activeEmployee = makeEmployee({
      tenantId: new UniqueEntityID(tenantId),
      fullName: 'Active Employee',
    });
    const revokedEmployee = makeEmployee({
      tenantId: new UniqueEntityID(tenantId),
      fullName: 'Revoked Employee',
    });
    employeesRepository.items.push(activeEmployee, revokedEmployee);

    const activeOperator = PosTerminalOperator.create({
      terminalId: terminal.id,
      employeeId: activeEmployee.id,
      tenantId,
      assignedByUserId: new UniqueEntityID(adminUserId),
      assignedAt: new Date('2026-03-01T10:00:00Z'),
    });
    const revokedOperator = PosTerminalOperator.create({
      terminalId: terminal.id,
      employeeId: revokedEmployee.id,
      tenantId,
      assignedByUserId: new UniqueEntityID(adminUserId),
      assignedAt: new Date('2026-03-05T10:00:00Z'),
    });
    revokedOperator.revoke(new UniqueEntityID(adminUserId));

    operatorsRepository.items.push(activeOperator, revokedOperator);

    const { data, meta } = await sut.execute({
      tenantId,
      terminalId: terminal.id.toString(),
      page: 1,
      limit: 20,
      isActive: 'all',
    });

    expect(data).toHaveLength(2);
    expect(meta.total).toBe(2);
    const employeeNames = data.map((row) => row.employeeName);
    expect(employeeNames).toContain('Active Employee');
    expect(employeeNames).toContain('Revoked Employee');
  });

  it('paginação: página 2 com limit=1 retorna o operador mais antigo (segundo mais recente)', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
    });
    posTerminalsRepository.items.push(terminal);

    const employeeOne = makeEmployee({
      tenantId: new UniqueEntityID(tenantId),
      fullName: 'Employee One',
    });
    const employeeTwo = makeEmployee({
      tenantId: new UniqueEntityID(tenantId),
      fullName: 'Employee Two',
    });
    employeesRepository.items.push(employeeOne, employeeTwo);

    const operatorOne = PosTerminalOperator.create({
      terminalId: terminal.id,
      employeeId: employeeOne.id,
      tenantId,
      assignedByUserId: new UniqueEntityID(adminUserId),
      assignedAt: new Date('2026-03-01T10:00:00Z'),
    });
    const operatorTwo = PosTerminalOperator.create({
      terminalId: terminal.id,
      employeeId: employeeTwo.id,
      tenantId,
      assignedByUserId: new UniqueEntityID(adminUserId),
      assignedAt: new Date('2026-03-10T10:00:00Z'),
    });
    operatorsRepository.items.push(operatorOne, operatorTwo);

    const { data, meta } = await sut.execute({
      tenantId,
      terminalId: terminal.id.toString(),
      page: 2,
      limit: 1,
    });

    expect(data).toHaveLength(1);
    expect(data[0].employeeId).toBe(employeeOne.id.toString());
    expect(meta.total).toBe(2);
    expect(meta.page).toBe(2);
    expect(meta.limit).toBe(1);
    expect(meta.pages).toBe(2);
  });

  it('lança ResourceNotFoundError quando o terminal não existe no tenant', async () => {
    const missingTerminalId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId,
        terminalId: missingTerminalId,
        page: 1,
        limit: 20,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('substitui employeeName por string vazia quando employee não é encontrado (defense-in-depth)', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
    });
    posTerminalsRepository.items.push(terminal);

    const orphanEmployeeId = new UniqueEntityID();

    const operator = PosTerminalOperator.create({
      terminalId: terminal.id,
      employeeId: orphanEmployeeId,
      tenantId,
      assignedByUserId: new UniqueEntityID(adminUserId),
    });
    operatorsRepository.items.push(operator);

    const { data, meta } = await sut.execute({
      tenantId,
      terminalId: terminal.id.toString(),
      page: 1,
      limit: 20,
    });

    expect(data).toHaveLength(1);
    expect(data[0].employeeId).toBe(orphanEmployeeId.toString());
    expect(data[0].employeeName).toBe('');
    expect(data[0].employeeShortId).toBe('');
    expect(meta.total).toBe(1);
  });
});
