import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryOverdueActionsRepository } from '@/repositories/finance/in-memory/in-memory-overdue-actions-repository';
import { InMemoryOverdueEscalationsRepository } from '@/repositories/finance/in-memory/in-memory-overdue-escalations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetEscalationTimelineUseCase } from './get-escalation-timeline';

let entriesRepository: InMemoryFinanceEntriesRepository;
let actionsRepository: InMemoryOverdueActionsRepository;
let escalationsRepository: InMemoryOverdueEscalationsRepository;
let sut: GetEscalationTimelineUseCase;

const tenantId = 'tenant-1';
const categoryId = new UniqueEntityID().toString();
const costCenterId = new UniqueEntityID().toString();

describe('GetEscalationTimelineUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    actionsRepository = new InMemoryOverdueActionsRepository();
    escalationsRepository = new InMemoryOverdueEscalationsRepository();
    sut = new GetEscalationTimelineUseCase(
      entriesRepository,
      actionsRepository,
      escalationsRepository,
    );
  });

  it('should return empty timeline when no default escalation exists', async () => {
    const entry = await entriesRepository.create({
      tenantId,
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Test entry',
      categoryId,
      costCenterId,
      expectedAmount: 1000,
      issueDate: new Date(),
      dueDate: new Date('2025-01-01'),
      status: 'OVERDUE',
    });

    const result = await sut.execute({
      entryId: entry.id.toString(),
      tenantId,
    });

    expect(result.steps).toHaveLength(0);
    expect(result.currentStep).toBe(0);
    expect(result.totalSteps).toBe(0);
  });

  it('should throw if entry does not exist', async () => {
    await expect(
      sut.execute({
        entryId: 'non-existent',
        tenantId,
      }),
    ).rejects.toThrow('Finance entry not found');
  });

  it('should build timeline with executed and scheduled steps', async () => {
    const pastDueDate = new Date();
    pastDueDate.setDate(pastDueDate.getDate() - 10);

    const entry = await entriesRepository.create({
      tenantId,
      type: 'RECEIVABLE',
      code: 'REC-002',
      description: 'Overdue entry',
      categoryId,
      costCenterId,
      expectedAmount: 500,
      issueDate: new Date(),
      dueDate: pastDueDate,
      status: 'OVERDUE',
    });

    const escalation = await escalationsRepository.create({
      tenantId,
      name: 'Default Escalation',
      isDefault: true,
      isActive: true,
      steps: [
        {
          daysOverdue: 3,
          channel: 'EMAIL',
          templateType: 'FRIENDLY_REMINDER',
          message: 'Olá, lembramos que o pagamento está pendente.',
          order: 1,
        },
        {
          daysOverdue: 7,
          channel: 'WHATSAPP',
          templateType: 'FORMAL_NOTICE',
          message: 'Notificação formal de cobrança.',
          order: 2,
        },
        {
          daysOverdue: 15,
          channel: 'EMAIL',
          templateType: 'URGENT_NOTICE',
          message: 'Aviso urgente: regularize sua situação.',
          order: 3,
        },
      ],
    });

    const firstStep = escalation.steps.find((s) => s.order === 1)!;
    await actionsRepository.create({
      tenantId,
      entryId: entry.id.toString(),
      stepId: firstStep.id.toString(),
      channel: 'EMAIL',
      status: 'SENT',
    });

    const result = await sut.execute({
      entryId: entry.id.toString(),
      tenantId,
    });

    expect(result.totalSteps).toBe(3);
    expect(result.currentStep).toBe(1);
    expect(result.steps).toHaveLength(3);

    // First step: completed
    expect(result.steps[0].status).toBe('COMPLETED');
    expect(result.steps[0].stepNumber).toBe(1);
    expect(result.steps[0].channel).toBe('E-mail');

    // Second step: 10 days overdue >= 7 days, so PENDING (not yet executed)
    expect(result.steps[1].status).toBe('PENDING');
    expect(result.steps[1].stepNumber).toBe(2);
    expect(result.steps[1].channel).toBe('WhatsApp');

    // Third step: 10 days overdue < 15 days, so SCHEDULED
    expect(result.steps[2].status).toBe('SCHEDULED');
    expect(result.steps[2].stepNumber).toBe(3);
  });

  it('should handle failed actions in timeline', async () => {
    const pastDueDate = new Date();
    pastDueDate.setDate(pastDueDate.getDate() - 5);

    const entry = await entriesRepository.create({
      tenantId,
      type: 'RECEIVABLE',
      code: 'REC-003',
      description: 'Failed entry',
      categoryId,
      costCenterId,
      expectedAmount: 200,
      issueDate: new Date(),
      dueDate: pastDueDate,
      status: 'OVERDUE',
    });

    const escalation = await escalationsRepository.create({
      tenantId,
      name: 'Default Escalation',
      isDefault: true,
      isActive: true,
      steps: [
        {
          daysOverdue: 1,
          channel: 'EMAIL',
          templateType: 'FRIENDLY_REMINDER',
          message: 'Reminder message',
          order: 1,
        },
      ],
    });

    const firstStep = escalation.steps[0];
    await actionsRepository.create({
      tenantId,
      entryId: entry.id.toString(),
      stepId: firstStep.id.toString(),
      channel: 'EMAIL',
      status: 'FAILED',
    });

    const result = await sut.execute({
      entryId: entry.id.toString(),
      tenantId,
    });

    expect(result.steps[0].status).toBe('FAILED');
    expect(result.currentStep).toBe(1);
  });

  it('should truncate long message previews', async () => {
    const pastDueDate = new Date();
    pastDueDate.setDate(pastDueDate.getDate() - 5);

    const entry = await entriesRepository.create({
      tenantId,
      type: 'RECEIVABLE',
      code: 'REC-004',
      description: 'Long message entry',
      categoryId,
      costCenterId,
      expectedAmount: 300,
      issueDate: new Date(),
      dueDate: pastDueDate,
      status: 'OVERDUE',
    });

    const longMessage = 'A'.repeat(200);
    await escalationsRepository.create({
      tenantId,
      name: 'Default Escalation',
      isDefault: true,
      isActive: true,
      steps: [
        {
          daysOverdue: 1,
          channel: 'EMAIL',
          templateType: 'FRIENDLY_REMINDER',
          message: longMessage,
          order: 1,
        },
      ],
    });

    const result = await sut.execute({
      entryId: entry.id.toString(),
      tenantId,
    });

    expect(result.steps[0].messagePreview).toHaveLength(123); // 120 + '...'
    expect(result.steps[0].messagePreview!.endsWith('...')).toBe(true);
  });
});
