import { InMemoryShiftsRepository } from '@/repositories/hr/in-memory/in-memory-shifts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListShiftsUseCase } from './list-shifts';
import { CreateShiftUseCase } from './create-shift';

const TENANT_ID = 'tenant-1';

let shiftsRepository: InMemoryShiftsRepository;
let createShiftUseCase: CreateShiftUseCase;
let sut: ListShiftsUseCase;

describe('List Shifts Use Case', () => {
  beforeEach(() => {
    shiftsRepository = new InMemoryShiftsRepository();
    createShiftUseCase = new CreateShiftUseCase(shiftsRepository);
    sut = new ListShiftsUseCase(shiftsRepository);
  });

  it('should list all shifts for a tenant', async () => {
    await createShiftUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Morning Shift',
      type: 'FIXED',
      startTime: '06:00',
      endTime: '14:00',
      breakMinutes: 60,
    });

    await createShiftUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Night Shift',
      type: 'FIXED',
      startTime: '22:00',
      endTime: '06:00',
      breakMinutes: 60,
      isNightShift: true,
    });

    const { shifts } = await sut.execute({ tenantId: TENANT_ID });

    expect(shifts).toHaveLength(2);
  });

  it('should list only active shifts when activeOnly is true', async () => {
    await createShiftUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Active Shift',
      type: 'FIXED',
      startTime: '06:00',
      endTime: '14:00',
      breakMinutes: 60,
    });

    const { shift: inactiveShift } = await createShiftUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Inactive Shift',
      type: 'FIXED',
      startTime: '14:00',
      endTime: '22:00',
      breakMinutes: 60,
    });

    inactiveShift.deactivate();

    const { shifts } = await sut.execute({
      tenantId: TENANT_ID,
      activeOnly: true,
    });

    expect(shifts).toHaveLength(1);
    expect(shifts[0].name).toBe('Active Shift');
  });

  it('should return empty array when no shifts exist', async () => {
    const { shifts } = await sut.execute({ tenantId: TENANT_ID });

    expect(shifts).toHaveLength(0);
  });

  it('should not return shifts from other tenants', async () => {
    await createShiftUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Tenant 1 Shift',
      type: 'FIXED',
      startTime: '06:00',
      endTime: '14:00',
      breakMinutes: 60,
    });

    await createShiftUseCase.execute({
      tenantId: 'other-tenant',
      name: 'Other Tenant Shift',
      type: 'FIXED',
      startTime: '06:00',
      endTime: '14:00',
      breakMinutes: 60,
    });

    const { shifts } = await sut.execute({ tenantId: TENANT_ID });

    expect(shifts).toHaveLength(1);
    expect(shifts[0].name).toBe('Tenant 1 Shift');
  });
});
