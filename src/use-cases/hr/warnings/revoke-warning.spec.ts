import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeWarning } from '@/entities/hr/employee-warning';
import {
  WarningSeverity,
  WarningStatus,
  WarningType,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeeWarningsRepository } from '@/repositories/hr/in-memory/in-memory-employee-warnings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RevokeWarningUseCase } from './revoke-warning';

let warningsRepository: InMemoryEmployeeWarningsRepository;
let sut: RevokeWarningUseCase;
const tenantId = new UniqueEntityID().toString();

describe('Revoke Warning Use Case', () => {
  beforeEach(() => {
    warningsRepository = new InMemoryEmployeeWarningsRepository();
    sut = new RevokeWarningUseCase(warningsRepository);
  });

  it('should revoke an active warning', async () => {
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
      revokeReason: 'Advertência aplicada por engano',
    });

    expect(warning.isRevoked()).toBe(true);
    expect(warning.revokeReason).toBe('Advertência aplicada por engano');
    expect(warning.revokedAt).toBeDefined();
  });

  it('should throw error if warning not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        warningId: new UniqueEntityID().toString(),
        revokeReason: 'Motivo',
      }),
    ).rejects.toThrow();
  });

  it('should throw error if warning is already revoked', async () => {
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
        revokeReason: 'Outro motivo',
      }),
    ).rejects.toThrow('Somente advertências ativas podem ser revogadas');
  });
});
