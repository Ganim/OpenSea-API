import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryOverdueActionsRepository } from '@/repositories/finance/in-memory/in-memory-overdue-actions-repository';
import { InMemoryOverdueEscalationsRepository } from '@/repositories/finance/in-memory/in-memory-overdue-escalations-repository';
import { InMemoryNotificationsRepository } from '@/repositories/notifications/in-memory/in-memory-notifications-repository';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { ProcessOverdueEscalationsUseCase } from './process-overdue-escalations';

let entriesRepository: InMemoryFinanceEntriesRepository;
let escalationsRepository: InMemoryOverdueEscalationsRepository;
let actionsRepository: InMemoryOverdueActionsRepository;
let notificationsRepository: InMemoryNotificationsRepository;
let sut: ProcessOverdueEscalationsUseCase;

const tenantId = 'tenant-1';
const userId = 'user-1';
const categoryId = new UniqueEntityID().toString();
const costCenterId = new UniqueEntityID().toString();

function daysAgo(days: number): Date {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - days,
    ),
  );
}

describe('ProcessOverdueEscalationsUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    escalationsRepository = new InMemoryOverdueEscalationsRepository();
    actionsRepository = new InMemoryOverdueActionsRepository();
    notificationsRepository = new InMemoryNotificationsRepository();
    sut = new ProcessOverdueEscalationsUseCase(
      entriesRepository,
      escalationsRepository,
      actionsRepository,
      notificationsRepository,
    );
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 15, 12, 0, 0)); // Feb 15, 2026
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should return zero when no default escalation exists', async () => {
    const result = await sut.execute({ tenantId, createdBy: userId });

    expect(result.processed).toBe(0);
    expect(result.actionsCreated).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('should process overdue entries and create actions for matching steps', async () => {
    // Create default escalation with steps
    await escalationsRepository.create({
      tenantId,
      name: 'Padrão',
      isDefault: true,
      steps: [
        {
          daysOverdue: 1,
          channel: 'EMAIL',
          templateType: 'FRIENDLY_REMINDER',
          subject: 'Lembrete: {entryCode}',
          message:
            'Olá {customerName}, o título {entryCode} venceu em {dueDate}.',
          order: 1,
        },
        {
          daysOverdue: 7,
          channel: 'SYSTEM_ALERT',
          templateType: 'URGENT_NOTICE',
          message: 'ALERTA: {customerName} com {daysPastDue} dias de atraso',
          order: 2,
        },
      ],
    });

    // Create an overdue entry (10 days overdue)
    await entriesRepository.create({
      tenantId,
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Fatura Cliente A',
      categoryId,
      costCenterId,
      expectedAmount: 5000,
      customerName: 'João Silva',
      issueDate: daysAgo(40),
      dueDate: daysAgo(10),
      status: 'OVERDUE',
    });

    const result = await sut.execute({ tenantId, createdBy: userId });

    expect(result.processed).toBe(1);
    // Both steps match (1 day and 7 days, entry is 10 days overdue)
    expect(result.actionsCreated).toBe(2);
    expect(result.errors).toHaveLength(0);

    // Verify actions were created
    expect(actionsRepository.items).toHaveLength(2);
    expect(actionsRepository.items[0].channel).toBe('EMAIL');
    expect(actionsRepository.items[0].status).toBe('PENDING'); // EMAIL is queued
    expect(actionsRepository.items[1].channel).toBe('SYSTEM_ALERT');
    expect(actionsRepository.items[1].status).toBe('PENDING'); // SYSTEM_ALERT action stays PENDING; notification is created separately

    // Verify notification was created for SYSTEM_ALERT
    expect(notificationsRepository.items).toHaveLength(1);
    expect(notificationsRepository.items[0].message).toContain('João Silva');
    expect(notificationsRepository.items[0].message).toContain('10');
  });

  it('should skip already-executed steps', async () => {
    const escalation = await escalationsRepository.create({
      tenantId,
      name: 'Padrão',
      isDefault: true,
      steps: [
        {
          daysOverdue: 1,
          channel: 'EMAIL',
          templateType: 'FRIENDLY_REMINDER',
          message: 'Test {customerName}',
          order: 1,
        },
      ],
    });

    await entriesRepository.create({
      tenantId,
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Test',
      categoryId,
      costCenterId,
      expectedAmount: 1000,
      customerName: 'Maria',
      issueDate: daysAgo(10),
      dueDate: daysAgo(5),
      status: 'OVERDUE',
    });

    // Pre-create action for the step (simulating previous execution)
    const entryId = entriesRepository.items[0].id.toString();
    const stepId = escalation.steps[0].id.toString();

    await actionsRepository.create({
      tenantId,
      entryId,
      stepId,
      channel: 'EMAIL',
      status: 'SENT',
    });

    const result = await sut.execute({ tenantId, createdBy: userId });

    expect(result.processed).toBe(1);
    expect(result.actionsCreated).toBe(0); // Skipped because already executed
  });

  it('should not process entries that are not OVERDUE', async () => {
    await escalationsRepository.create({
      tenantId,
      name: 'Padrão',
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

    await entriesRepository.create({
      tenantId,
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Paid',
      categoryId,
      costCenterId,
      expectedAmount: 1000,
      issueDate: daysAgo(10),
      dueDate: daysAgo(5),
      status: 'RECEIVED',
    });

    const result = await sut.execute({ tenantId, createdBy: userId });

    expect(result.processed).toBe(0);
    expect(result.actionsCreated).toBe(0);
  });

  it('should only fire steps where daysOverdue <= actual days overdue', async () => {
    await escalationsRepository.create({
      tenantId,
      name: 'Padrão',
      isDefault: true,
      steps: [
        {
          daysOverdue: 1,
          channel: 'EMAIL',
          templateType: 'FRIENDLY_REMINDER',
          message: 'Day 1',
          order: 1,
        },
        {
          daysOverdue: 30,
          channel: 'EMAIL',
          templateType: 'FINAL_NOTICE',
          message: 'Day 30',
          order: 2,
        },
      ],
    });

    // Only 5 days overdue - should only match step 1
    await entriesRepository.create({
      tenantId,
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Recently overdue',
      categoryId,
      costCenterId,
      expectedAmount: 1000,
      issueDate: daysAgo(10),
      dueDate: daysAgo(5),
      status: 'OVERDUE',
    });

    const result = await sut.execute({ tenantId, createdBy: userId });

    expect(result.actionsCreated).toBe(1);
    expect(actionsRepository.items[0].channel).toBe('EMAIL');
  });

  // P3-28: when SendEscalationMessageUseCase is injected, the cron must
  // record gateway failures (Evolution down, missing customer phone) into
  // the response counters and not bubble them up as crashes.
  describe('integration with SendEscalationMessageUseCase (P3-28)', () => {
    it('should record messagesFailed when WhatsApp gateway fails (Evolution error)', async () => {
      const sendUseCase = {
        execute: vi.fn().mockResolvedValue({
          success: false,
          error: 'Evolution API error (500)',
        }),
      };

      const sutWithSend = new ProcessOverdueEscalationsUseCase(
        entriesRepository,
        escalationsRepository,
        actionsRepository,
        notificationsRepository,
        sendUseCase as never,
      );

      await escalationsRepository.create({
        tenantId,
        name: 'Padrão',
        isDefault: true,
        steps: [
          {
            daysOverdue: 1,
            channel: 'WHATSAPP',
            templateType: 'FRIENDLY_REMINDER',
            message: 'Olá {customerName}',
            order: 1,
          },
        ],
      });

      await entriesRepository.create({
        tenantId,
        type: 'RECEIVABLE',
        code: 'REC-EVO-1',
        description: 'Cliente com WhatsApp',
        categoryId,
        costCenterId,
        expectedAmount: 1000,
        customerName: 'Cliente Teste',
        issueDate: daysAgo(10),
        dueDate: daysAgo(5),
        status: 'OVERDUE',
      });

      const result = await sutWithSend.execute({
        tenantId,
        createdBy: userId,
      });

      expect(result.processed).toBe(1);
      expect(result.actionsCreated).toBe(1); // action was created
      expect(result.messagesFailed).toBe(1);
      expect(result.messagesSent).toBe(0);
      expect(result.errors[0]).toMatch(/Evolution API error/);
      expect(sendUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should record messagesFailed when customer has no phone for WhatsApp', async () => {
      const sendUseCase = {
        execute: vi.fn().mockResolvedValue({
          success: false,
          error:
            'Número de telefone não encontrado para o cliente da entrada REC-NOPHONE',
        }),
      };

      const sutWithSend = new ProcessOverdueEscalationsUseCase(
        entriesRepository,
        escalationsRepository,
        actionsRepository,
        notificationsRepository,
        sendUseCase as never,
      );

      await escalationsRepository.create({
        tenantId,
        name: 'Padrão',
        isDefault: true,
        steps: [
          {
            daysOverdue: 1,
            channel: 'WHATSAPP',
            templateType: 'FRIENDLY_REMINDER',
            message: 'Olá',
            order: 1,
          },
        ],
      });

      await entriesRepository.create({
        tenantId,
        type: 'RECEIVABLE',
        code: 'REC-NOPHONE',
        description: 'Cliente sem telefone',
        categoryId,
        costCenterId,
        expectedAmount: 500,
        customerName: 'Sem Telefone',
        issueDate: daysAgo(10),
        dueDate: daysAgo(3),
        status: 'OVERDUE',
      });

      const result = await sutWithSend.execute({
        tenantId,
        createdBy: userId,
      });

      expect(result.messagesFailed).toBe(1);
      expect(result.messagesSent).toBe(0);
      expect(result.errors[0]).toMatch(/telefone não encontrado/);
    });

    it('should fan out SYSTEM_ALERT to each notifyUserId and aggregate failures per recipient', async () => {
      // Two recipients, the gateway fails for one of them — process must
      // count one success + one failure rather than abort the whole step.
      let callCount = 0;
      const sendUseCase = {
        execute: vi.fn().mockImplementation(async () => {
          callCount++;
          if (callCount === 1) {
            return { success: true };
          }
          return { success: false, error: 'Notification store unavailable' };
        }),
      };

      const sutWithSend = new ProcessOverdueEscalationsUseCase(
        entriesRepository,
        escalationsRepository,
        actionsRepository,
        notificationsRepository,
        sendUseCase as never,
      );

      await escalationsRepository.create({
        tenantId,
        name: 'Padrão',
        isDefault: true,
        steps: [
          {
            daysOverdue: 1,
            channel: 'SYSTEM_ALERT',
            templateType: 'URGENT_NOTICE',
            message: 'Alerta de cobrança',
            order: 1,
          },
        ],
      });

      await entriesRepository.create({
        tenantId,
        type: 'RECEIVABLE',
        code: 'REC-FANOUT',
        description: 'Fan-out test',
        categoryId,
        costCenterId,
        expectedAmount: 200,
        issueDate: daysAgo(10),
        dueDate: daysAgo(2),
        status: 'OVERDUE',
      });

      const result = await sutWithSend.execute({
        tenantId,
        createdBy: userId,
        notifyUserIds: ['admin-1', 'admin-2'],
      });

      expect(sendUseCase.execute).toHaveBeenCalledTimes(2);
      expect(result.messagesSent).toBe(1);
      expect(result.messagesFailed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });
});
