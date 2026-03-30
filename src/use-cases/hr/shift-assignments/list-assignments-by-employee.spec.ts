import { InMemoryShiftAssignmentsRepository } from '@/repositories/hr/in-memory/in-memory-shift-assignments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListAssignmentsByEmployeeUseCase } from './list-assignments-by-employee';

const TENANT_ID = 'tenant-1';
const EMPLOYEE_ID = 'employee-1';

let shiftAssignmentsRepository: InMemoryShiftAssignmentsRepository;
let sut: ListAssignmentsByEmployeeUseCase;

describe('List Assignments by Employee Use Case', () => {
  beforeEach(() => {
    shiftAssignmentsRepository = new InMemoryShiftAssignmentsRepository();
    sut = new ListAssignmentsByEmployeeUseCase(shiftAssignmentsRepository);
  });

  it('should list all assignments for an employee', async () => {
    await shiftAssignmentsRepository.create({
      tenantId: TENANT_ID,
      shiftId: 'shift-1',
      employeeId: EMPLOYEE_ID,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
      isActive: false,
    });

    await shiftAssignmentsRepository.create({
      tenantId: TENANT_ID,
      shiftId: 'shift-2',
      employeeId: EMPLOYEE_ID,
      startDate: new Date('2026-04-01'),
    });

    const { shiftAssignments } = await sut.execute({
      employeeId: EMPLOYEE_ID,
      tenantId: TENANT_ID,
    });

    expect(shiftAssignments).toHaveLength(2);
  });

  it('should return empty array when no assignments exist', async () => {
    const { shiftAssignments } = await sut.execute({
      employeeId: EMPLOYEE_ID,
      tenantId: TENANT_ID,
    });

    expect(shiftAssignments).toHaveLength(0);
  });
});
