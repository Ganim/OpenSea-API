import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryDowntimeReasonsRepository } from '@/repositories/production/in-memory/in-memory-downtime-reasons-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDowntimeReasonUseCase } from './create-downtime-reason';
import { UpdateDowntimeReasonUseCase } from './update-downtime-reason';

let downtimeReasonsRepository: InMemoryDowntimeReasonsRepository;
let createDowntimeReason: CreateDowntimeReasonUseCase;
let sut: UpdateDowntimeReasonUseCase;

describe('UpdateDowntimeReasonUseCase', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    downtimeReasonsRepository = new InMemoryDowntimeReasonsRepository();
    createDowntimeReason = new CreateDowntimeReasonUseCase(
      downtimeReasonsRepository,
    );
    sut = new UpdateDowntimeReasonUseCase(downtimeReasonsRepository);
  });

  it('should update a downtime reason', async () => {
    const { downtimeReason: created } = await createDowntimeReason.execute({
      tenantId: TENANT_ID,
      code: 'MCH-001',
      name: 'Machine Breakdown',
      category: 'MACHINE',
    });

    const { downtimeReason } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      name: 'Critical Machine Breakdown',
      category: 'MAINTENANCE',
    });

    expect(downtimeReason.name).toBe('Critical Machine Breakdown');
    expect(downtimeReason.category).toBe('MAINTENANCE');
    expect(downtimeReason.code).toBe('MCH-001');
  });

  it('should update code when unique', async () => {
    const { downtimeReason: created } = await createDowntimeReason.execute({
      tenantId: TENANT_ID,
      code: 'MCH-001',
      name: 'Machine Breakdown',
      category: 'MACHINE',
    });

    const { downtimeReason } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      code: 'MCH-002',
    });

    expect(downtimeReason.code).toBe('MCH-002');
  });

  it('should not allow duplicate code on update', async () => {
    const { downtimeReason: first } = await createDowntimeReason.execute({
      tenantId: TENANT_ID,
      code: 'MCH-001',
      name: 'Machine Breakdown',
      category: 'MACHINE',
    });

    await createDowntimeReason.execute({
      tenantId: TENANT_ID,
      code: 'MCH-002',
      name: 'Machine Overheating',
      category: 'MACHINE',
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: first.id.toString(),
        code: 'MCH-002',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should deactivate a downtime reason', async () => {
    const { downtimeReason: created } = await createDowntimeReason.execute({
      tenantId: TENANT_ID,
      code: 'MCH-001',
      name: 'Machine Breakdown',
      category: 'MACHINE',
    });

    const { downtimeReason } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      isActive: false,
    });

    expect(downtimeReason.isActive).toBe(false);
  });

  it('should throw if downtime reason not found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: 'non-existent-id',
        name: 'New Name',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
