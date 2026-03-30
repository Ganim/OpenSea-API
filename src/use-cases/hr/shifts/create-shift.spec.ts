import { InMemoryShiftsRepository } from '@/repositories/hr/in-memory/in-memory-shifts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateShiftUseCase } from './create-shift';

const TENANT_ID = 'tenant-1';

let shiftsRepository: InMemoryShiftsRepository;
let sut: CreateShiftUseCase;

describe('Create Shift Use Case', () => {
  beforeEach(() => {
    shiftsRepository = new InMemoryShiftsRepository();
    sut = new CreateShiftUseCase(shiftsRepository);
  });

  it('should create a fixed shift', async () => {
    const { shift } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Morning Shift',
      type: 'FIXED',
      startTime: '06:00',
      endTime: '14:00',
      breakMinutes: 60,
    });

    expect(shift).toBeDefined();
    expect(shift.name).toBe('Morning Shift');
    expect(shift.type).toBe('FIXED');
    expect(shift.startTime).toBe('06:00');
    expect(shift.endTime).toBe('14:00');
    expect(shift.breakMinutes).toBe(60);
    expect(shift.isActive).toBe(true);
    expect(shift.isNightShift).toBe(false);
  });

  it('should create a night shift', async () => {
    const { shift } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Night Shift',
      type: 'FIXED',
      startTime: '22:00',
      endTime: '06:00',
      breakMinutes: 60,
      isNightShift: true,
    });

    expect(shift.isNightShift).toBe(true);
    expect(shift.startTime).toBe('22:00');
    expect(shift.endTime).toBe('06:00');
  });

  it('should create a shift with optional code and color', async () => {
    const { shift } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Afternoon Shift',
      code: 'TARD',
      type: 'FIXED',
      startTime: '14:00',
      endTime: '22:00',
      breakMinutes: 60,
      color: '#FF5733',
    });

    expect(shift.code).toBe('TARD');
    expect(shift.color).toBe('#FF5733');
  });

  it('should not create shift with duplicate name', async () => {
    await sut.execute({
      tenantId: TENANT_ID,
      name: 'Morning Shift',
      type: 'FIXED',
      startTime: '06:00',
      endTime: '14:00',
      breakMinutes: 60,
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Morning Shift',
        type: 'ROTATING',
        startTime: '07:00',
        endTime: '15:00',
        breakMinutes: 60,
      }),
    ).rejects.toThrow('A shift with this name already exists');
  });

  it('should not create shift with duplicate code', async () => {
    await sut.execute({
      tenantId: TENANT_ID,
      name: 'Morning Shift',
      code: 'M1',
      type: 'FIXED',
      startTime: '06:00',
      endTime: '14:00',
      breakMinutes: 60,
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Another Shift',
        code: 'M1',
        type: 'FIXED',
        startTime: '07:00',
        endTime: '15:00',
        breakMinutes: 60,
      }),
    ).rejects.toThrow('A shift with this code already exists');
  });

  it('should reject invalid start time format', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Bad Shift',
        type: 'FIXED',
        startTime: '25:00',
        endTime: '14:00',
        breakMinutes: 60,
      }),
    ).rejects.toThrow('Invalid start time format');
  });

  it('should reject invalid end time format', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Bad Shift',
        type: 'FIXED',
        startTime: '06:00',
        endTime: '14:99',
        breakMinutes: 60,
      }),
    ).rejects.toThrow('Invalid end time format');
  });

  it('should reject negative break duration', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Bad Shift',
        type: 'FIXED',
        startTime: '06:00',
        endTime: '14:00',
        breakMinutes: -10,
      }),
    ).rejects.toThrow('Break duration must be between 0 and 480 minutes');
  });

  it('should reject break duration over 480 minutes', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Bad Shift',
        type: 'FIXED',
        startTime: '06:00',
        endTime: '14:00',
        breakMinutes: 500,
      }),
    ).rejects.toThrow('Break duration must be between 0 and 480 minutes');
  });

  it('should reject invalid shift type', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Bad Shift',
        type: 'INVALID' as 'FIXED',
        startTime: '06:00',
        endTime: '14:00',
        breakMinutes: 60,
      }),
    ).rejects.toThrow('Invalid shift type');
  });
});
