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
const deletedByUserId = new UniqueEntityID().toString();

describe('Delete Warning Use Case', () => {
  beforeEach(() => {
    warningsRepository = new InMemoryEmployeeWarningsRepository();
    sut = new DeleteWarningUseCase(warningsRepository);
  });

  it('should soft-delete a warning (row persists with deletedAt + deletedBy set)', async () => {
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
      deletedBy: deletedByUserId,
    });

    // CLT Art. 474 — the physical row must remain, only the soft-delete
    // markers change. A hard delete would wipe the audit trail that labor
    // courts rely on during trabalhista disputes.
    expect(warningsRepository.items).toHaveLength(1);
    const persistedWarning = warningsRepository.items[0];
    expect(persistedWarning.deletedAt).toBeInstanceOf(Date);
    expect(persistedWarning.deletedBy).toBe(deletedByUserId);
    expect(persistedWarning.isDeleted()).toBe(true);
  });

  it('should hide soft-deleted warnings from default list queries', async () => {
    const employeeId = new UniqueEntityID();
    const deletedWarning = EmployeeWarning.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId,
      issuedBy: new UniqueEntityID(),
      type: WarningType.verbal(),
      severity: WarningSeverity.low(),
      status: WarningStatus.active(),
      reason: 'Atraso',
      incidentDate: new Date(),
      employeeAcknowledged: false,
    });
    warningsRepository.items.push(deletedWarning);

    await sut.execute({
      tenantId,
      warningId: deletedWarning.id.toString(),
      deletedBy: deletedByUserId,
    });

    const defaultList = await warningsRepository.findManyByEmployee(
      employeeId,
      tenantId,
    );
    expect(defaultList).toHaveLength(0);

    const auditList = await warningsRepository.findManyByEmployee(
      employeeId,
      tenantId,
      { includeDeleted: true },
    );
    expect(auditList).toHaveLength(1);
  });

  it('should throw error if warning not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        warningId: new UniqueEntityID().toString(),
        deletedBy: deletedByUserId,
      }),
    ).rejects.toThrow();
  });
});
