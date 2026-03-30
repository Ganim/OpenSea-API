import { InMemoryShiftsRepository } from '@/repositories/hr/in-memory/in-memory-shifts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateShiftUseCase } from './update-shift';
import { CreateShiftUseCase } from './create-shift';

const TENANT_ID = 'tenant-1';

let shiftsRepository: InMemoryShiftsRepository;
let createShiftUseCase: CreateShiftUseCase;
let sut: UpdateShiftUseCase;

describe('Update Shift Use Case', () => {
  beforeEach(() => {
    shiftsRepository = new InMemoryShiftsRepository();
    createShiftUseCase = new CreateShiftUseCase(shiftsRepository);
    sut = new UpdateShiftUseCase(shiftsRepository);
  });

  it('should update a shift name', async () => {
    const { shift: createdShift } = await createShiftUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Morning Shift',
      type: 'FIXED',
      startTime: '06:00',
      endTime: '14:00',
      breakMinutes: 60,
    });

    const { shift } = await sut.execute({
      shiftId: createdShift.id.toString(),
      tenantId: TENANT_ID,
      name: 'Early Morning Shift',
    });

    expect(shift.name).toBe('Early Morning Shift');
  });

  it('should update shift times', async () => {
    const { shift: createdShift } = await createShiftUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Morning Shift',
      type: 'FIXED',
      startTime: '06:00',
      endTime: '14:00',
      breakMinutes: 60,
    });

    const { shift } = await sut.execute({
      shiftId: createdShift.id.toString(),
      tenantId: TENANT_ID,
      startTime: '07:00',
      endTime: '15:00',
    });

    expect(shift.startTime).toBe('07:00');
    expect(shift.endTime).toBe('15:00');
  });

  it('should deactivate a shift', async () => {
    const { shift: createdShift } = await createShiftUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Morning Shift',
      type: 'FIXED',
      startTime: '06:00',
      endTime: '14:00',
      breakMinutes: 60,
    });

    const { shift } = await sut.execute({
      shiftId: createdShift.id.toString(),
      tenantId: TENANT_ID,
      isActive: false,
    });

    expect(shift.isActive).toBe(false);
  });

  it('should throw when shift does not exist', async () => {
    await expect(
      sut.execute({
        shiftId: 'non-existent-id',
        tenantId: TENANT_ID,
        name: 'Updated',
      }),
    ).rejects.toThrow('Shift not found');
  });

  it('should throw when changing to duplicate name', async () => {
    await createShiftUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Existing Shift',
      type: 'FIXED',
      startTime: '06:00',
      endTime: '14:00',
      breakMinutes: 60,
    });

    const { shift: secondShift } = await createShiftUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Another Shift',
      type: 'FIXED',
      startTime: '14:00',
      endTime: '22:00',
      breakMinutes: 60,
    });

    await expect(
      sut.execute({
        shiftId: secondShift.id.toString(),
        tenantId: TENANT_ID,
        name: 'Existing Shift',
      }),
    ).rejects.toThrow('A shift with this name already exists');
  });

  it('should reject invalid time format', async () => {
    const { shift: createdShift } = await createShiftUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Morning Shift',
      type: 'FIXED',
      startTime: '06:00',
      endTime: '14:00',
      breakMinutes: 60,
    });

    await expect(
      sut.execute({
        shiftId: createdShift.id.toString(),
        tenantId: TENANT_ID,
        startTime: '99:00',
      }),
    ).rejects.toThrow('Invalid start time format');
  });
});
