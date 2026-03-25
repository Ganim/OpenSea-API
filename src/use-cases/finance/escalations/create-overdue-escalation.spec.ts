import { InMemoryOverdueEscalationsRepository } from '@/repositories/finance/in-memory/in-memory-overdue-escalations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateOverdueEscalationUseCase } from './create-overdue-escalation';

let escalationsRepository: InMemoryOverdueEscalationsRepository;
let sut: CreateOverdueEscalationUseCase;

const tenantId = 'tenant-1';

describe('CreateOverdueEscalationUseCase', () => {
  beforeEach(() => {
    escalationsRepository = new InMemoryOverdueEscalationsRepository();
    sut = new CreateOverdueEscalationUseCase(escalationsRepository);
  });

  it('should create an escalation template with steps', async () => {
    const { escalation } = await sut.execute({
      tenantId,
      name: 'Padrão',
      isDefault: true,
      steps: [
        {
          daysOverdue: 1,
          channel: 'EMAIL',
          templateType: 'FRIENDLY_REMINDER',
          subject: 'Lembrete de pagamento',
          message: 'Olá {customerName}, seu título {entryCode} venceu.',
          order: 1,
        },
        {
          daysOverdue: 7,
          channel: 'EMAIL',
          templateType: 'FORMAL_NOTICE',
          subject: 'Aviso de atraso',
          message: 'Prezado(a) {customerName}, atraso de {daysPastDue} dias.',
          order: 2,
        },
      ],
    });

    expect(escalation.name).toBe('Padrão');
    expect(escalation.isDefault).toBe(true);
    expect(escalation.isActive).toBe(true);
    expect(escalation.steps).toHaveLength(2);
    expect(escalation.steps[0].daysOverdue).toBe(1);
    expect(escalation.steps[1].daysOverdue).toBe(7);
  });

  it('should throw if name is empty', async () => {
    await expect(
      sut.execute({
        tenantId,
        name: '',
        steps: [
          {
            daysOverdue: 1,
            channel: 'EMAIL',
            templateType: 'FRIENDLY_REMINDER',
            message: 'Test',
            order: 1,
          },
        ],
      }),
    ).rejects.toThrow('Escalation name is required');
  });

  it('should throw if steps are empty', async () => {
    await expect(
      sut.execute({
        tenantId,
        name: 'Empty',
        steps: [],
      }),
    ).rejects.toThrow('At least one escalation step is required');
  });

  it('should throw if daysOverdue is less than 1', async () => {
    await expect(
      sut.execute({
        tenantId,
        name: 'Bad Step',
        steps: [
          {
            daysOverdue: 0,
            channel: 'EMAIL',
            templateType: 'FRIENDLY_REMINDER',
            message: 'Test',
            order: 1,
          },
        ],
      }),
    ).rejects.toThrow('Days overdue must be at least 1');
  });

  it('should throw on duplicate name within same tenant', async () => {
    await sut.execute({
      tenantId,
      name: 'Duplicate',
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
        tenantId,
        name: 'Duplicate',
        steps: [
          {
            daysOverdue: 1,
            channel: 'EMAIL',
            templateType: 'FRIENDLY_REMINDER',
            message: 'Test',
            order: 1,
          },
        ],
      }),
    ).rejects.toThrow('already exists');
  });

  it('should clear existing defaults when setting isDefault', async () => {
    await sut.execute({
      tenantId,
      name: 'First Default',
      isDefault: true,
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
      tenantId,
      name: 'Second Default',
      isDefault: true,
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

    const firstEscalation = escalationsRepository.items[0];
    const secondEscalation = escalationsRepository.items[1];

    expect(firstEscalation.isDefault).toBe(false);
    expect(secondEscalation.isDefault).toBe(true);
  });
});
