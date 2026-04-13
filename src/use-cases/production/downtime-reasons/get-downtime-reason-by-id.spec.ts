import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryDowntimeReasonsRepository } from '@/repositories/production/in-memory/in-memory-downtime-reasons-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDowntimeReasonUseCase } from './create-downtime-reason';
import { GetDowntimeReasonByIdUseCase } from './get-downtime-reason-by-id';

let downtimeReasonsRepository: InMemoryDowntimeReasonsRepository;
let createDowntimeReason: CreateDowntimeReasonUseCase;
let sut: GetDowntimeReasonByIdUseCase;

describe('GetDowntimeReasonByIdUseCase', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    downtimeReasonsRepository = new InMemoryDowntimeReasonsRepository();
    createDowntimeReason = new CreateDowntimeReasonUseCase(
      downtimeReasonsRepository,
    );
    sut = new GetDowntimeReasonByIdUseCase(downtimeReasonsRepository);
  });

  it('should get a downtime reason by id', async () => {
    const { downtimeReason: created } = await createDowntimeReason.execute({
      tenantId: TENANT_ID,
      code: 'MCH-001',
      name: 'Machine Breakdown',
      category: 'MACHINE',
    });

    const { downtimeReason } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
    });

    expect(downtimeReason).toEqual(created);
  });

  it('should throw error if downtime reason does not exist', async () => {
    await expect(() =>
      sut.execute({ tenantId: TENANT_ID, id: 'non-existent-id' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw error if downtime reason belongs to different tenant', async () => {
    const { downtimeReason: created } = await createDowntimeReason.execute({
      tenantId: 'tenant-2',
      code: 'MCH-001',
      name: 'Machine Breakdown',
      category: 'MACHINE',
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: created.id.toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
