import { InMemoryShiftAssignmentsRepository } from '@/repositories/hr/in-memory/in-memory-shift-assignments-repository';
import { InMemoryShiftsRepository } from '@/repositories/hr/in-memory/in-memory-shifts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { AssignEmployeeToShiftUseCase } from './assign-employee-to-shift';

const TENANT_ID = 'tenant-1';
const EMPLOYEE_ID = 'employee-1';

let shiftsRepository: InMemoryShiftsRepository;
let shiftAssignmentsRepository: InMemoryShiftAssignmentsRepository;
let sut: AssignEmployeeToShiftUseCase;

describe('Assign Employee to Shift Use Case', () => {
  beforeEach(async () => {
    shiftsRepository = new InMemoryShiftsRepository();
    shiftAssignmentsRepository = new InMemoryShiftAssignmentsRepository();
    sut = new AssignEmployeeToShiftUseCase(
      shiftsRepository,
      shiftAssignmentsRepository,
    );
  });

  it('should assign an employee to a shift', async () => {
    const shift = await shiftsRepository.create({
      tenantId: TENANT_ID,
      name: 'Morning Shift',
      type: 'FIXED',
      startTime: '06:00',
      endTime: '14:00',
      breakMinutes: 60,
    });

    const { shiftAssignment } = await sut.execute({
      tenantId: TENANT_ID,
      shiftId: shift.id.toString(),
      employeeId: EMPLOYEE_ID,
      startDate: new Date('2026-04-01'),
    });

    expect(shiftAssignment).toBeDefined();
    expect(shiftAssignment.shiftId.toString()).toBe(shift.id.toString());
    expect(shiftAssignment.employeeId.toString()).toBe(EMPLOYEE_ID);
    expect(shiftAssignment.isActive).toBe(true);
  });

  it('should throw when shift does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        shiftId: 'non-existent-shift',
        employeeId: EMPLOYEE_ID,
        startDate: new Date('2026-04-01'),
      }),
    ).rejects.toThrow('Shift not found');
  });

  it('should throw when shift is inactive', async () => {
    const shift = await shiftsRepository.create({
      tenantId: TENANT_ID,
      name: 'Inactive Shift',
      type: 'FIXED',
      startTime: '06:00',
      endTime: '14:00',
      breakMinutes: 60,
      isActive: false,
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        shiftId: shift.id.toString(),
        employeeId: EMPLOYEE_ID,
        startDate: new Date('2026-04-01'),
      }),
    ).rejects.toThrow('Cannot assign employee to an inactive shift');
  });

  it('should throw when employee already has an active assignment', async () => {
    const shift = await shiftsRepository.create({
      tenantId: TENANT_ID,
      name: 'Morning Shift',
      type: 'FIXED',
      startTime: '06:00',
      endTime: '14:00',
      breakMinutes: 60,
    });

    await sut.execute({
      tenantId: TENANT_ID,
      shiftId: shift.id.toString(),
      employeeId: EMPLOYEE_ID,
      startDate: new Date('2026-04-01'),
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        shiftId: shift.id.toString(),
        employeeId: EMPLOYEE_ID,
        startDate: new Date('2026-04-02'),
      }),
    ).rejects.toThrow('Employee already has an active shift assignment');
  });

  it('should allow assignment with notes', async () => {
    const shift = await shiftsRepository.create({
      tenantId: TENANT_ID,
      name: 'Morning Shift',
      type: 'FIXED',
      startTime: '06:00',
      endTime: '14:00',
      breakMinutes: 60,
    });

    const { shiftAssignment } = await sut.execute({
      tenantId: TENANT_ID,
      shiftId: shift.id.toString(),
      employeeId: EMPLOYEE_ID,
      startDate: new Date('2026-04-01'),
      notes: 'Temporary assignment during training period',
    });

    expect(shiftAssignment.notes).toBe(
      'Temporary assignment during training period',
    );
  });
});
