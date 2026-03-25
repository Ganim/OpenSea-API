import { InMemoryOverdueEscalationsRepository } from '@/repositories/finance/in-memory/in-memory-overdue-escalations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteOverdueEscalationUseCase } from './delete-overdue-escalation';

let escalationsRepository: InMemoryOverdueEscalationsRepository;
let sut: DeleteOverdueEscalationUseCase;

const tenantId = 'tenant-1';

describe('DeleteOverdueEscalationUseCase', () => {
  beforeEach(() => {
    escalationsRepository = new InMemoryOverdueEscalationsRepository();
    sut = new DeleteOverdueEscalationUseCase(escalationsRepository);
  });

  it('should soft-delete an escalation (set isActive to false)', async () => {
    const created = await escalationsRepository.create({
      tenantId,
      name: 'To Delete',
      steps: [
        {
          daysOverdue: 1,
          channel: 'EMAIL',
          templateType: 'FRIENDLY_REMINDER',
          message: 'Test',
          order: 1,
        },
      ],
    });

    await sut.execute({
      id: created.id.toString(),
      tenantId,
    });

    expect(escalationsRepository.items[0].isActive).toBe(false);
  });

  it('should throw when escalation not found', async () => {
    await expect(
      sut.execute({
        id: 'non-existent',
        tenantId,
      }),
    ).rejects.toThrow('Escalation template not found');
  });

  it('should throw when escalation belongs to different tenant', async () => {
    const created = await escalationsRepository.create({
      tenantId: 'other-tenant',
      name: 'Other',
      steps: [
        {
          daysOverdue: 1,
          channel: 'EMAIL',
          templateType: 'FRIENDLY_REMINDER',
          message: 'Test',
          order: 1,
        },
      ],
    });

    await expect(
      sut.execute({
        id: created.id.toString(),
        tenantId,
      }),
    ).rejects.toThrow('Escalation template not found');
  });
});
