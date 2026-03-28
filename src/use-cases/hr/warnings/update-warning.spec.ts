import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeWarning } from '@/entities/hr/employee-warning';
import {
  WarningSeverity,
  WarningStatus,
  WarningType,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeeWarningsRepository } from '@/repositories/hr/in-memory/in-memory-employee-warnings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateWarningUseCase } from './update-warning';

let warningsRepository: InMemoryEmployeeWarningsRepository;
let sut: UpdateWarningUseCase;
const tenantId = new UniqueEntityID().toString();

describe('Update Warning Use Case', () => {
  beforeEach(() => {
    warningsRepository = new InMemoryEmployeeWarningsRepository();
    sut = new UpdateWarningUseCase(warningsRepository);
  });

  it('should update warning reason', async () => {
    const warningEntity = EmployeeWarning.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: new UniqueEntityID(),
      issuedBy: new UniqueEntityID(),
      type: WarningType.verbal(),
      severity: WarningSeverity.low(),
      status: WarningStatus.active(),
      reason: 'Motivo original',
      incidentDate: new Date(),
      employeeAcknowledged: false,
    });

    warningsRepository.items.push(warningEntity);

    const { warning } = await sut.execute({
      tenantId,
      warningId: warningEntity.id.toString(),
      reason: 'Motivo atualizado com mais detalhes',
    });

    expect(warning.reason).toBe('Motivo atualizado com mais detalhes');
  });

  it('should throw error if warning not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        warningId: new UniqueEntityID().toString(),
        reason: 'Test',
      }),
    ).rejects.toThrow();
  });

  it('should throw error if warning is not active', async () => {
    const warningEntity = EmployeeWarning.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: new UniqueEntityID(),
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
        reason: 'Nova razão',
      }),
    ).rejects.toThrow('Somente advertências ativas podem ser editadas');
  });

  it('should throw error if suspension exceeds 30 days', async () => {
    const warningEntity = EmployeeWarning.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: new UniqueEntityID(),
      issuedBy: new UniqueEntityID(),
      type: WarningType.suspension(),
      severity: WarningSeverity.high(),
      status: WarningStatus.active(),
      reason: 'Falta grave',
      incidentDate: new Date(),
      employeeAcknowledged: false,
      suspensionDays: 3,
    });

    warningsRepository.items.push(warningEntity);

    await expect(
      sut.execute({
        tenantId,
        warningId: warningEntity.id.toString(),
        suspensionDays: 31,
      }),
    ).rejects.toThrow('Suspensão não pode exceder 30 dias (CLT Art. 474)');
  });
});
