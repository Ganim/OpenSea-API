import { InMemoryOverdueEscalationsRepository } from '@/repositories/finance/in-memory/in-memory-overdue-escalations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetOverdueEscalationByIdUseCase } from './get-overdue-escalation-by-id';

let escalationsRepository: InMemoryOverdueEscalationsRepository;
let sut: GetOverdueEscalationByIdUseCase;

const tenantId = 'tenant-1';

describe('GetOverdueEscalationByIdUseCase', () => {
  beforeEach(() => {
    escalationsRepository = new InMemoryOverdueEscalationsRepository();
    sut = new GetOverdueEscalationByIdUseCase(escalationsRepository);
  });

  it('should return an escalation by id with steps', async () => {
    const created = await escalationsRepository.create({
      tenantId,
      name: 'Padrão',
      steps: [
        {
          daysOverdue: 1,
          channel: 'EMAIL',
          templateType: 'FRIENDLY_REMINDER',
          subject: 'Lembrete',
          message: 'Olá {customerName}',
          order: 1,
        },
        {
          daysOverdue: 7,
          channel: 'SYSTEM_ALERT',
          templateType: 'URGENT_NOTICE',
          message: 'ALERTA: {entryCode}',
          order: 2,
        },
      ],
    });

    const { escalation } = await sut.execute({
      id: created.id.toString(),
      tenantId,
    });

    expect(escalation.name).toBe('Padrão');
    expect(escalation.steps).toHaveLength(2);
    expect(escalation.steps[0].channel).toBe('EMAIL');
    expect(escalation.steps[1].channel).toBe('SYSTEM_ALERT');
  });

  it('should throw ResourceNotFoundError when escalation does not exist', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
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
