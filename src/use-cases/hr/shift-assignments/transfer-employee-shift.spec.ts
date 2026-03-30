import { InMemoryShiftAssignmentsRepository } from '@/repositories/hr/in-memory/in-memory-shift-assignments-repository';
import { InMemoryShiftsRepository } from '@/repositories/hr/in-memory/in-memory-shifts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { TransferEmployeeShiftUseCase } from './transfer-employee-shift';

const TENANT_ID = 'tenant-1';
const EMPLOYEE_ID = 'employee-1';

let shiftsRepository: InMemoryShiftsRepository;
let shiftAssignmentsRepository: InMemoryShiftAssignmentsRepository;
let sut: TransferEmployeeShiftUseCase;

describe('Transfer Employee Shift Use Case', () => {
  beforeEach(() => {
    shiftsRepository = new InMemoryShiftsRepository();
    shiftAssignmentsRepository = new InMemoryShiftAssignmentsRepository();
    sut = new TransferEmployeeShiftUseCase(
      shiftsRepository,
      shiftAssignmentsRepository,
    );
  });

  it('should transfer employee to a new shift', async () => {
    const morningShift = await shiftsRepository.create({
      tenantId: TENANT_ID,
      name: 'Morning',
      type: 'FIXED',
      startTime: '06:00',
      endTime: '14:00',
      breakMinutes: 60,
    });

    const nightShift = await shiftsRepository.create({
      tenantId: TENANT_ID,
      name: 'Night',
      type: 'FIXED',
      startTime: '22:00',
      endTime: '06:00',
      breakMinutes: 60,
    });

    // Create initial assignment
    await shiftAssignmentsRepository.create({
      tenantId: TENANT_ID,
      shiftId: morningShift.id.toString(),
      employeeId: EMPLOYEE_ID,
      startDate: new Date('2026-01-01'),
      isActive: true,
    });

    const { newAssignment } = await sut.execute({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
      newShiftId: nightShift.id.toString(),
      startDate: new Date('2026-04-01'),
      notes: 'Transferring to night shift',
    });

    expect(newAssignment.shiftId.toString()).toBe(nightShift.id.toString());
    expect(newAssignment.isActive).toBe(true);
    expect(newAssignment.notes).toBe('Transferring to night shift');

    // Old assignment should be deactivated
    const oldAssignment =
      await shiftAssignmentsRepository.findActiveByEmployee(
        EMPLOYEE_ID,
        TENANT_ID,
      );
    expect(oldAssignment?.shiftId.toString()).toBe(nightShift.id.toString());
  });

  it('should throw when target shift does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        employeeId: EMPLOYEE_ID,
        newShiftId: 'non-existent',
        startDate: new Date('2026-04-01'),
      }),
    ).rejects.toThrow('Target shift not found');
  });

  it('should throw when target shift is inactive', async () => {
    const inactiveShift = await shiftsRepository.create({
      tenantId: TENANT_ID,
      name: 'Inactive',
      type: 'FIXED',
      startTime: '06:00',
      endTime: '14:00',
      breakMinutes: 60,
      isActive: false,
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        employeeId: EMPLOYEE_ID,
        newShiftId: inactiveShift.id.toString(),
        startDate: new Date('2026-04-01'),
      }),
    ).rejects.toThrow('Cannot transfer to an inactive shift');
  });

  it('should throw when transferring to the same shift', async () => {
    const shift = await shiftsRepository.create({
      tenantId: TENANT_ID,
      name: 'Morning',
      type: 'FIXED',
      startTime: '06:00',
      endTime: '14:00',
      breakMinutes: 60,
    });

    await shiftAssignmentsRepository.create({
      tenantId: TENANT_ID,
      shiftId: shift.id.toString(),
      employeeId: EMPLOYEE_ID,
      startDate: new Date('2026-01-01'),
      isActive: true,
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        employeeId: EMPLOYEE_ID,
        newShiftId: shift.id.toString(),
        startDate: new Date('2026-04-01'),
      }),
    ).rejects.toThrow('Employee is already assigned to this shift');
  });

  it('should allow transfer when employee has no current assignment', async () => {
    const shift = await shiftsRepository.create({
      tenantId: TENANT_ID,
      name: 'Morning',
      type: 'FIXED',
      startTime: '06:00',
      endTime: '14:00',
      breakMinutes: 60,
    });

    const { newAssignment } = await sut.execute({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
      newShiftId: shift.id.toString(),
      startDate: new Date('2026-04-01'),
    });

    expect(newAssignment).toBeDefined();
    expect(newAssignment.isActive).toBe(true);
  });
});
