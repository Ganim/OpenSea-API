import { InMemoryOvertimeRepository } from '@/repositories/hr/in-memory/in-memory-overtime-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetOvertimeUseCase } from './get-overtime';

let overtimeRepository: InMemoryOvertimeRepository;
let sut: GetOvertimeUseCase;

describe('GetOvertimeUseCase', () => {
  beforeEach(() => {
    overtimeRepository = new InMemoryOvertimeRepository();
    sut = new GetOvertimeUseCase(overtimeRepository);
  });

  it('should throw Error for non-existent overtime', async () => {
    await expect(() =>
      sut.execute({ tenantId: 'tenant-1', id: 'non-existent' }),
    ).rejects.toThrow('Overtime request not found');
  });
});
