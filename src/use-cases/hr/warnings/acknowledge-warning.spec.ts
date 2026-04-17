import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import { EmployeeWarning } from '@/entities/hr/employee-warning';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WarningSeverity,
  WarningStatus,
  WarningType,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryEmployeeWarningsRepository } from '@/repositories/hr/in-memory/in-memory-employee-warnings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { AcknowledgeWarningUseCase } from './acknowledge-warning';

let warningsRepository: InMemoryEmployeeWarningsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: AcknowledgeWarningUseCase;
const tenantId = new UniqueEntityID().toString();

async function makeEmployee(options: {
  userId?: UniqueEntityID;
}): Promise<Employee> {
  const employee = await employeesRepository.create({
    tenantId,
    registrationNumber: `REG-${new UniqueEntityID().toString().slice(0, 6)}`,
    userId: options.userId,
    fullName: 'Funcionário Teste',
    cpf: CPF.create('52998224725'),
    country: 'BR',
    hireDate: new Date('2020-01-10'),
    status: EmployeeStatus.ACTIVE(),
    contractType: ContractType.CLT(),
    workRegime: WorkRegime.FULL_TIME(),
    weeklyHours: 44,
  });

  return employee;
}

describe('Acknowledge Warning Use Case', () => {
  beforeEach(() => {
    warningsRepository = new InMemoryEmployeeWarningsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new AcknowledgeWarningUseCase(
      warningsRepository,
      employeesRepository,
    );
  });

  it('should acknowledge a warning when caller is the warned employee', async () => {
    const callerUserId = new UniqueEntityID();
    const employee = await makeEmployee({ userId: callerUserId });

    const warningEntity = EmployeeWarning.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: employee.id,
      issuedBy: new UniqueEntityID(),
      type: WarningType.written(),
      severity: WarningSeverity.medium(),
      status: WarningStatus.active(),
      reason: 'Descumprimento de norma',
      incidentDate: new Date(),
      employeeAcknowledged: false,
    });

    warningsRepository.items.push(warningEntity);

    const { warning } = await sut.execute({
      tenantId,
      warningId: warningEntity.id.toString(),
      callerUserId: callerUserId.toString(),
    });

    expect(warning.hasBeenAcknowledged()).toBe(true);
    expect(warning.acknowledgedAt).toBeDefined();
  });

  it('should throw ForbiddenError when caller is not the warned employee', async () => {
    const ownerUserId = new UniqueEntityID();
    const employee = await makeEmployee({ userId: ownerUserId });

    const warningEntity = EmployeeWarning.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: employee.id,
      issuedBy: new UniqueEntityID(),
      type: WarningType.written(),
      severity: WarningSeverity.medium(),
      status: WarningStatus.active(),
      reason: 'Descumprimento',
      incidentDate: new Date(),
      employeeAcknowledged: false,
    });

    warningsRepository.items.push(warningEntity);

    const otherUserId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId,
        warningId: warningEntity.id.toString(),
        callerUserId: otherUserId,
      }),
    ).rejects.toThrow(
      'Apenas o funcionário advertido pode reconhecer esta advertência',
    );

    expect(warningEntity.hasBeenAcknowledged()).toBe(false);
  });

  it('should throw ForbiddenError when warned employee has no linked user', async () => {
    const employee = await makeEmployee({ userId: undefined });

    const warningEntity = EmployeeWarning.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: employee.id,
      issuedBy: new UniqueEntityID(),
      type: WarningType.written(),
      severity: WarningSeverity.medium(),
      status: WarningStatus.active(),
      reason: 'Descumprimento',
      incidentDate: new Date(),
      employeeAcknowledged: false,
    });

    warningsRepository.items.push(warningEntity);

    await expect(
      sut.execute({
        tenantId,
        warningId: warningEntity.id.toString(),
        callerUserId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(
      'Apenas o funcionário advertido pode reconhecer esta advertência',
    );
  });

  it('should throw error if warning not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        warningId: new UniqueEntityID().toString(),
        callerUserId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow();
  });

  it('should throw error if warning is already acknowledged', async () => {
    const callerUserId = new UniqueEntityID();
    const employee = await makeEmployee({ userId: callerUserId });

    const warningEntity = EmployeeWarning.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: employee.id,
      issuedBy: new UniqueEntityID(),
      type: WarningType.verbal(),
      severity: WarningSeverity.low(),
      status: WarningStatus.active(),
      reason: 'Motivo',
      incidentDate: new Date(),
      employeeAcknowledged: true,
      acknowledgedAt: new Date(),
    });

    warningsRepository.items.push(warningEntity);

    await expect(
      sut.execute({
        tenantId,
        warningId: warningEntity.id.toString(),
        callerUserId: callerUserId.toString(),
      }),
    ).rejects.toThrow('Advertência já foi reconhecida');
  });

  it('should throw error if warning is not active', async () => {
    const callerUserId = new UniqueEntityID();
    const employee = await makeEmployee({ userId: callerUserId });

    const warningEntity = EmployeeWarning.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: employee.id,
      issuedBy: new UniqueEntityID(),
      type: WarningType.verbal(),
      severity: WarningSeverity.low(),
      status: WarningStatus.revoked(),
      reason: 'Motivo',
      incidentDate: new Date(),
      employeeAcknowledged: false,
    });

    warningsRepository.items.push(warningEntity);

    await expect(
      sut.execute({
        tenantId,
        warningId: warningEntity.id.toString(),
        callerUserId: callerUserId.toString(),
      }),
    ).rejects.toThrow('Somente advertências ativas podem ser reconhecidas');
  });
});
