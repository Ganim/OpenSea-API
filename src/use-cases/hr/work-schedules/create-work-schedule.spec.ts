import { InMemoryWorkSchedulesRepository } from '@/repositories/hr/in-memory/in-memory-work-schedules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateWorkScheduleUseCase } from './create-work-schedule';

const TENANT_ID = 'tenant-1';

let workSchedulesRepository: InMemoryWorkSchedulesRepository;
let sut: CreateWorkScheduleUseCase;

describe('Create Work Schedule Use Case', () => {
  beforeEach(() => {
    workSchedulesRepository = new InMemoryWorkSchedulesRepository();
    sut = new CreateWorkScheduleUseCase(workSchedulesRepository);
  });

  it('should create a standard work schedule', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Standard 44h',
      description: 'Standard 44 hours per week',
      mondayStart: '08:00',
      mondayEnd: '17:48',
      tuesdayStart: '08:00',
      tuesdayEnd: '17:48',
      wednesdayStart: '08:00',
      wednesdayEnd: '17:48',
      thursdayStart: '08:00',
      thursdayEnd: '17:48',
      fridayStart: '08:00',
      fridayEnd: '17:48',
      breakDuration: 60,
    });

    expect(result.workSchedule).toBeDefined();
    expect(result.workSchedule.name).toBe('Standard 44h');
    expect(result.workSchedule.isActive).toBe(true);
    expect(result.workSchedule.mondayStart).toBe('08:00');
    expect(result.workSchedule.breakDuration).toBe(60);
  });

  it('should create a weekend work schedule', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Weekend Shift',
      saturdayStart: '08:00',
      saturdayEnd: '14:00',
      sundayStart: '08:00',
      sundayEnd: '14:00',
      breakDuration: 30,
    });

    expect(result.workSchedule.name).toBe('Weekend Shift');
    expect(result.workSchedule.saturdayStart).toBe('08:00');
    expect(result.workSchedule.sundayStart).toBe('08:00');
    expect(result.workSchedule.mondayStart).toBeUndefined();
  });

  it('should not create schedule with duplicate name', async () => {
    await sut.execute({
      tenantId: TENANT_ID,
      name: 'Standard 44h',
      mondayStart: '08:00',
      mondayEnd: '17:00',
      breakDuration: 60,
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Standard 44h',
        mondayStart: '09:00',
        mondayEnd: '18:00',
        breakDuration: 60,
      }),
    ).rejects.toThrow('Work schedule with this name already exists');
  });

  it('should reject invalid time format', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Invalid Schedule',
        mondayStart: '25:00', // Invalid - hour out of range
        mondayEnd: '17:00',
        breakDuration: 60,
      }),
    ).rejects.toThrow('Invalid time format');
  });

  it('should reject invalid break duration', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Invalid Schedule',
        mondayStart: '08:00',
        mondayEnd: '17:00',
        breakDuration: -10,
      }),
    ).rejects.toThrow('Break duration must be between 0 and 480 minutes');
  });

  it('should reject break duration over 480 minutes', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Invalid Schedule',
        mondayStart: '08:00',
        mondayEnd: '17:00',
        breakDuration: 500,
      }),
    ).rejects.toThrow('Break duration must be between 0 and 480 minutes');
  });
});
