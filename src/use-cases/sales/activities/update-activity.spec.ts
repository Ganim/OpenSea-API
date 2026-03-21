import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryActivitiesRepository } from '@/repositories/sales/in-memory/in-memory-activities-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateActivityUseCase } from './update-activity';

let activitiesRepository: InMemoryActivitiesRepository;
let sut: UpdateActivityUseCase;

const TENANT_ID = 'tenant-1';

describe('UpdateActivityUseCase', () => {
  beforeEach(() => {
    activitiesRepository = new InMemoryActivitiesRepository();
    sut = new UpdateActivityUseCase(activitiesRepository);
  });

  it('should update activity description', async () => {
    const created = await activitiesRepository.create({
      tenantId: TENANT_ID,
      type: 'NOTE',
      title: 'My note',
      contactId: 'contact-1',
    });

    const result = await sut.execute({
      id: created.id.toString(),
      tenantId: TENANT_ID,
      description: 'Updated description',
    });

    expect(result.activity.description).toBe('Updated description');
    expect(result.activity.updatedAt).toBeDefined();
  });

  it('should complete a task by setting completedAt', async () => {
    const created = await activitiesRepository.create({
      tenantId: TENANT_ID,
      type: 'TASK',
      title: 'Send proposal',
      dealId: 'deal-1',
      dueAt: new Date('2026-04-01T10:00:00Z'),
    });

    const completedAt = new Date('2026-03-25T14:00:00Z');
    const result = await sut.execute({
      id: created.id.toString(),
      tenantId: TENANT_ID,
      completedAt,
    });

    expect(result.activity.completedAt).toEqual(completedAt);
  });

  it('should throw ResourceNotFoundError when activity does not exist', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
        tenantId: TENANT_ID,
        description: 'test',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
