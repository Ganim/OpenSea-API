import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeWarning } from '@/entities/hr/employee-warning';
import {
  WarningSeverity,
  WarningStatus,
  WarningType,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeeWarningsRepository } from '@/repositories/hr/in-memory/in-memory-employee-warnings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetWarningUseCase } from './get-warning';

let warningsRepository: InMemoryEmployeeWarningsRepository;
let sut: GetWarningUseCase;
const tenantId = new UniqueEntityID().toString();

describe('Get Warning Use Case', () => {
  beforeEach(() => {
    warningsRepository = new InMemoryEmployeeWarningsRepository();
    sut = new GetWarningUseCase(warningsRepository);
  });

  it('should get a warning by id', async () => {
    const warningEntity = EmployeeWarning.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: new UniqueEntityID(),
      issuedBy: new UniqueEntityID(),
      type: WarningType.verbal(),
      severity: WarningSeverity.low(),
      status: WarningStatus.active(),
      reason: 'Atraso reiterado',
      incidentDate: new Date('2024-03-01'),
      employeeAcknowledged: false,
    });

    warningsRepository.items.push(warningEntity);

    const { warning } = await sut.execute({
      tenantId,
      warningId: warningEntity.id.toString(),
    });

    expect(warning.id.equals(warningEntity.id)).toBe(true);
    expect(warning.reason).toBe('Atraso reiterado');
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
