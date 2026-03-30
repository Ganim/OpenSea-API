import { InMemoryShiftAssignmentsRepository } from '@/repositories/hr/in-memory/in-memory-shift-assignments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListAssignmentsByShiftUseCase } from './list-assignments-by-shift';

const TENANT_ID = 'tenant-1';
const SHIFT_ID = 'shift-1';

let shiftAssignmentsRepository: InMemoryShiftAssignmentsRepository;
let sut: ListAssignmentsByShiftUseCase;

describe('List Assignments by Shift Use Case', () => {
  beforeEach(() => {
    shiftAssignmentsRepository = new InMemoryShiftAssignmentsRepository();
    sut = new ListAssignmentsByShiftUseCase(shiftAssignmentsRepository);
  });

  it('should list all assignments for a shift', async () => {
    await shiftAssignmentsRepository.create({
      tenantId: TENANT_ID,
      shiftId: SHIFT_ID,
      employeeId: 'employee-1',
      startDate: new Date('2026-04-01'),
    });

    await shiftAssignmentsRepository.create({
      tenantId: TENANT_ID,
      shiftId: SHIFT_ID,
      employeeId: 'employee-2',
      startDate: new Date('2026-04-01'),
    });

    const { shiftAssignments } = await sut.execute({
      shiftId: SHIFT_ID,
      tenantId: TENANT_ID,
    });

    expect(shiftAssignments).toHaveLength(2);
  });

  it('should return empty array when no assignments exist', async () => {
    const { shiftAssignments } = await sut.execute({
      shiftId: SHIFT_ID,
      tenantId: TENANT_ID,
    });

    expect(shiftAssignments).toHaveLength(0);
  });

  it('should not return assignments from other shifts', async () => {
    await shiftAssignmentsRepository.create({
      tenantId: TENANT_ID,
      shiftId: SHIFT_ID,
      employeeId: 'employee-1',
      startDate: new Date('2026-04-01'),
    });

    await shiftAssignmentsRepository.create({
      tenantId: TENANT_ID,
      shiftId: 'other-shift',
      employeeId: 'employee-2',
      startDate: new Date('2026-04-01'),
    });

    const { shiftAssignments } = await sut.execute({
      shiftId: SHIFT_ID,
      tenantId: TENANT_ID,
    });

    expect(shiftAssignments).toHaveLength(1);
  });
});
