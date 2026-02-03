import { InMemoryWorkSchedulesRepository } from '@/repositories/hr/in-memory/in-memory-work-schedules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteWorkScheduleUseCase } from './delete-work-schedule';

const TENANT_ID = 'tenant-1';

let workSchedulesRepository: InMemoryWorkSchedulesRepository;
let sut: DeleteWorkScheduleUseCase;

describe('DeleteWorkScheduleUseCase', () => {
  beforeEach(() => {
    workSchedulesRepository = new InMemoryWorkSchedulesRepository();
    sut = new DeleteWorkScheduleUseCase(workSchedulesRepository);
  });

  it('should throw Error for non-existent work schedule', async () => {
    await expect(() =>
      sut.execute({ tenantId: TENANT_ID, id: 'non-existent' }),
    ).rejects.toThrow('Work schedule not found');
  });
});
