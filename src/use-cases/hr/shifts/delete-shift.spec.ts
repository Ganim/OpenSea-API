import { InMemoryShiftsRepository } from '@/repositories/hr/in-memory/in-memory-shifts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteShiftUseCase } from './delete-shift';
import { CreateShiftUseCase } from './create-shift';

const TENANT_ID = 'tenant-1';

let shiftsRepository: InMemoryShiftsRepository;
let createShiftUseCase: CreateShiftUseCase;
let sut: DeleteShiftUseCase;

describe('Delete Shift Use Case', () => {
  beforeEach(() => {
    shiftsRepository = new InMemoryShiftsRepository();
    createShiftUseCase = new CreateShiftUseCase(shiftsRepository);
    sut = new DeleteShiftUseCase(shiftsRepository);
  });

  it('should soft delete a shift', async () => {
    const { shift: createdShift } = await createShiftUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Morning Shift',
      type: 'FIXED',
      startTime: '06:00',
      endTime: '14:00',
      breakMinutes: 60,
    });

    await sut.execute({
      shiftId: createdShift.id.toString(),
      tenantId: TENANT_ID,
    });

    const shiftInRepo = shiftsRepository.shifts.find(
      (s) => s.id.equals(createdShift.id),
    );
    expect(shiftInRepo?.deletedAt).toBeDefined();
    expect(shiftInRepo?.isActive).toBe(false);
  });

  it('should throw when shift does not exist', async () => {
    await expect(
      sut.execute({
        shiftId: 'non-existent-id',
        tenantId: TENANT_ID,
      }),
    ).rejects.toThrow('Shift not found');
  });

  it('should not appear in listing after deletion', async () => {
    const { shift: createdShift } = await createShiftUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Morning Shift',
      type: 'FIXED',
      startTime: '06:00',
      endTime: '14:00',
      breakMinutes: 60,
    });

    await sut.execute({
      shiftId: createdShift.id.toString(),
      tenantId: TENANT_ID,
    });

    const activeShifts = await shiftsRepository.findMany(TENANT_ID);
    expect(activeShifts).toHaveLength(0);
  });
});
