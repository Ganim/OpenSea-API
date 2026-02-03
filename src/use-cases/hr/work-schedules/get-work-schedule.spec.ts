import { InMemoryWorkSchedulesRepository } from '@/repositories/hr/in-memory/in-memory-work-schedules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetWorkScheduleUseCase } from './get-work-schedule';

const TENANT_ID = 'tenant-1';

let workSchedulesRepository: InMemoryWorkSchedulesRepository;
let sut: GetWorkScheduleUseCase;

describe('GetWorkScheduleUseCase', () => {
  beforeEach(() => {
    workSchedulesRepository = new InMemoryWorkSchedulesRepository();
    sut = new GetWorkScheduleUseCase(workSchedulesRepository);
  });

  it('should throw Error for non-existent work schedule', async () => {
    await expect(() =>
      sut.execute({ tenantId: TENANT_ID, id: 'non-existent' }),
    ).rejects.toThrow('Work schedule not found');
  });
});
