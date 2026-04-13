import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryDowntimeReasonsRepository } from '@/repositories/production/in-memory/in-memory-downtime-reasons-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDowntimeReasonUseCase } from './create-downtime-reason';
import { DeleteDowntimeReasonUseCase } from './delete-downtime-reason';

let downtimeReasonsRepository: InMemoryDowntimeReasonsRepository;
let createDowntimeReason: CreateDowntimeReasonUseCase;
let sut: DeleteDowntimeReasonUseCase;

describe('DeleteDowntimeReasonUseCase', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    downtimeReasonsRepository = new InMemoryDowntimeReasonsRepository();
    createDowntimeReason = new CreateDowntimeReasonUseCase(
      downtimeReasonsRepository,
    );
    sut = new DeleteDowntimeReasonUseCase(downtimeReasonsRepository);
  });

  it('should delete a downtime reason', async () => {
    const { downtimeReason } = await createDowntimeReason.execute({
      tenantId: TENANT_ID,
      code: 'MCH-001',
      name: 'Machine Breakdown',
      category: 'MACHINE',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      id: downtimeReason.id.toString(),
    });

    expect(result.message).toBe('Downtime reason deleted successfully.');
    expect(downtimeReasonsRepository.items).toHaveLength(0);
  });

  it('should throw if downtime reason not found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: 'non-existent-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
