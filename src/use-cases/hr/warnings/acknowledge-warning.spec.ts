import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeWarning } from '@/entities/hr/employee-warning';
import {
  WarningSeverity,
  WarningStatus,
  WarningType,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeeWarningsRepository } from '@/repositories/hr/in-memory/in-memory-employee-warnings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { AcknowledgeWarningUseCase } from './acknowledge-warning';

let warningsRepository: InMemoryEmployeeWarningsRepository;
let sut: AcknowledgeWarningUseCase;
const tenantId = new UniqueEntityID().toString();

describe('Acknowledge Warning Use Case', () => {
  beforeEach(() => {
    warningsRepository = new InMemoryEmployeeWarningsRepository();
    sut = new AcknowledgeWarningUseCase(warningsRepository);
  });

  it('should acknowledge a warning', async () => {
    const warningEntity = EmployeeWarning.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: new UniqueEntityID(),
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
    });

    expect(warning.hasBeenAcknowledged()).toBe(true);
    expect(warning.acknowledgedAt).toBeDefined();
  });

  it('should throw error if warning not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        warningId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow();
  });

  it('should throw error if warning is already acknowledged', async () => {
    const warningEntity = EmployeeWarning.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: new UniqueEntityID(),
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
      }),
    ).rejects.toThrow('Advertência já foi reconhecida');
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
      }),
    ).rejects.toThrow('Somente advertências ativas podem ser reconhecidas');
  });
});
