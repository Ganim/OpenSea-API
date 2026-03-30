import { InMemoryShiftsRepository } from '@/repositories/hr/in-memory/in-memory-shifts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetShiftUseCase } from './get-shift';
import { CreateShiftUseCase } from './create-shift';

const TENANT_ID = 'tenant-1';

let shiftsRepository: InMemoryShiftsRepository;
let createShiftUseCase: CreateShiftUseCase;
let sut: GetShiftUseCase;

describe('Get Shift Use Case', () => {
  beforeEach(() => {
    shiftsRepository = new InMemoryShiftsRepository();
    createShiftUseCase = new CreateShiftUseCase(shiftsRepository);
    sut = new GetShiftUseCase(shiftsRepository);
  });

  it('should get a shift by id', async () => {
    const { shift: createdShift } = await createShiftUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Morning Shift',
      type: 'FIXED',
      startTime: '06:00',
      endTime: '14:00',
      breakMinutes: 60,
    });

    const { shift, assignmentCount } = await sut.execute({
      shiftId: createdShift.id.toString(),
      tenantId: TENANT_ID,
    });

    expect(shift.name).toBe('Morning Shift');
    expect(shift.type).toBe('FIXED');
    expect(assignmentCount).toBe(0);
  });

  it('should throw when shift does not exist', async () => {
    await expect(
      sut.execute({
        shiftId: 'non-existent-id',
        tenantId: TENANT_ID,
      }),
    ).rejects.toThrow('Shift not found');
  });

  it('should throw when shift belongs to another tenant', async () => {
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
        tenantId: 'other-tenant',
      }),
    ).rejects.toThrow('Shift not found');
  });
});
