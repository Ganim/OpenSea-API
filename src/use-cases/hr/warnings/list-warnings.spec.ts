import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeWarning } from '@/entities/hr/employee-warning';
import {
  WarningSeverity,
  WarningStatus,
  WarningType,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeeWarningsRepository } from '@/repositories/hr/in-memory/in-memory-employee-warnings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListWarningsUseCase } from './list-warnings';

let warningsRepository: InMemoryEmployeeWarningsRepository;
let sut: ListWarningsUseCase;
const tenantId = new UniqueEntityID().toString();
const employeeId = new UniqueEntityID();

function createTestWarning(
  overrides: Partial<{
    type: WarningType;
    severity: WarningSeverity;
    status: WarningStatus;
    employeeId: UniqueEntityID;
    incidentDate: Date;
  }> = {},
): EmployeeWarning {
  return EmployeeWarning.create({
    tenantId: new UniqueEntityID(tenantId),
    employeeId: overrides.employeeId ?? employeeId,
    issuedBy: new UniqueEntityID(),
    type: overrides.type ?? WarningType.verbal(),
    severity: overrides.severity ?? WarningSeverity.low(),
    status: overrides.status ?? WarningStatus.active(),
    reason: 'Test reason',
    incidentDate: overrides.incidentDate ?? new Date(),
    employeeAcknowledged: false,
  });
}

describe('List Warnings Use Case', () => {
  beforeEach(() => {
    warningsRepository = new InMemoryEmployeeWarningsRepository();
    sut = new ListWarningsUseCase(warningsRepository);
  });

  it('should list warnings with pagination', async () => {
    for (let i = 0; i < 25; i++) {
      warningsRepository.items.push(createTestWarning());
    }

    const { warnings, meta } = await sut.execute({
      tenantId,
      page: 1,
      perPage: 10,
    });

    expect(warnings).toHaveLength(10);
    expect(meta.total).toBe(25);
    expect(meta.totalPages).toBe(3);
  });

  it('should filter by employee', async () => {
    const specificEmployeeId = new UniqueEntityID();
    warningsRepository.items.push(
      createTestWarning({ employeeId: specificEmployeeId }),
    );
    warningsRepository.items.push(createTestWarning());
    warningsRepository.items.push(createTestWarning());

    const { warnings, meta } = await sut.execute({
      tenantId,
      employeeId: specificEmployeeId.toString(),
    });

    expect(warnings).toHaveLength(1);
    expect(meta.total).toBe(1);
  });

  it('should filter by type', async () => {
    warningsRepository.items.push(
      createTestWarning({ type: WarningType.written() }),
    );
    warningsRepository.items.push(
      createTestWarning({ type: WarningType.verbal() }),
    );
    warningsRepository.items.push(
      createTestWarning({ type: WarningType.written() }),
    );

    const { warnings } = await sut.execute({
      tenantId,
      type: 'WRITTEN',
    });

    expect(warnings).toHaveLength(2);
  });

  it('should filter by severity', async () => {
    warningsRepository.items.push(
      createTestWarning({ severity: WarningSeverity.critical() }),
    );
    warningsRepository.items.push(
      createTestWarning({ severity: WarningSeverity.low() }),
    );

    const { warnings } = await sut.execute({
      tenantId,
      severity: 'CRITICAL',
    });

    expect(warnings).toHaveLength(1);
  });

  it('should filter by status', async () => {
    warningsRepository.items.push(
      createTestWarning({ status: WarningStatus.active() }),
    );
    warningsRepository.items.push(
      createTestWarning({ status: WarningStatus.revoked() }),
    );

    const { warnings } = await sut.execute({
      tenantId,
      status: 'REVOKED',
    });

    expect(warnings).toHaveLength(1);
  });
});
