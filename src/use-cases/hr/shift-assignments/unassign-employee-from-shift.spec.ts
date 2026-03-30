import { InMemoryShiftAssignmentsRepository } from '@/repositories/hr/in-memory/in-memory-shift-assignments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UnassignEmployeeFromShiftUseCase } from './unassign-employee-from-shift';

const TENANT_ID = 'tenant-1';

let shiftAssignmentsRepository: InMemoryShiftAssignmentsRepository;
let sut: UnassignEmployeeFromShiftUseCase;

describe('Unassign Employee from Shift Use Case', () => {
  beforeEach(() => {
    shiftAssignmentsRepository = new InMemoryShiftAssignmentsRepository();
    sut = new UnassignEmployeeFromShiftUseCase(shiftAssignmentsRepository);
  });

  it('should deactivate a shift assignment', async () => {
    const assignment = await shiftAssignmentsRepository.create({
      tenantId: TENANT_ID,
      shiftId: 'shift-1',
      employeeId: 'employee-1',
      startDate: new Date('2026-04-01'),
      isActive: true,
    });

    await sut.execute({
      assignmentId: assignment.id.toString(),
      tenantId: TENANT_ID,
    });

    const deactivated = await shiftAssignmentsRepository.findById(
      assignment.id,
      TENANT_ID,
    );
    expect(deactivated?.isActive).toBe(false);
    expect(deactivated?.endDate).toBeDefined();
  });

  it('should throw when assignment does not exist', async () => {
    await expect(
      sut.execute({
        assignmentId: 'non-existent',
        tenantId: TENANT_ID,
      }),
    ).rejects.toThrow('Shift assignment not found');
  });
});
