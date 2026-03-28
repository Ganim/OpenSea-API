import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeWarning } from '@/entities/hr/employee-warning';
import {
  WarningSeverity,
  WarningStatus,
  WarningType,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeeWarningsRepository } from '@/repositories/hr/in-memory/in-memory-employee-warnings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteWarningUseCase } from './delete-warning';

let warningsRepository: InMemoryEmployeeWarningsRepository;
let sut: DeleteWarningUseCase;
const tenantId = new UniqueEntityID().toString();

describe('Delete Warning Use Case', () => {
  beforeEach(() => {
    warningsRepository = new InMemoryEmployeeWarningsRepository();
    sut = new DeleteWarningUseCase(warningsRepository);
  });

  it('should soft delete a warning', async () => {
    const warningEntity = EmployeeWarning.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: new UniqueEntityID(),
      issuedBy: new UniqueEntityID(),
      type: WarningType.verbal(),
      severity: WarningSeverity.low(),
      status: WarningStatus.active(),
      reason: 'Atraso',
      incidentDate: new Date(),
      employeeAcknowledged: false,
    });

    warningsRepository.items.push(warningEntity);

    await sut.execute({
      tenantId,
      warningId: warningEntity.id.toString(),
    });

    expect(warningsRepository.items).toHaveLength(0);
  });

  it('should throw error if warning not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        warningId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow();
  });
});
