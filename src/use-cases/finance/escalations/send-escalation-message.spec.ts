import { InMemoryOverdueActionsRepository } from '@/repositories/finance/in-memory/in-memory-overdue-actions-repository';
import { InMemoryMessagingAccountsRepository } from '@/repositories/messaging/in-memory/in-memory-messaging-accounts-repository';
import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { InMemoryCustomersRepository } from '@/repositories/sales/in-memory/in-memory-customers-repository';
import { InMemoryNotificationsRepository } from '@/repositories/notifications/in-memory/in-memory-notifications-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FinanceEntry } from '@/entities/finance/finance-entry';
import { OverdueAction } from '@/entities/finance/overdue-action';
import { OverdueEscalationStep } from '@/entities/finance/overdue-escalation-step';
import { Customer } from '@/entities/sales/customer';
import { CustomerType } from '@/entities/sales/value-objects/customer-type';
import { EmailAccount } from '@/entities/email/email-account';
import { MessagingAccount } from '@/entities/messaging/messaging-account';
import type { MessagingGateway } from '@/services/messaging/messaging-gateway.interface';
import type { SmtpClientService } from '@/services/email/smtp-client.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SendEscalationMessageUseCase } from './send-escalation-message';

// ────────────────────────────────────────────────────────────────────────────
// MOCKS
// ────────────────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-1';
const CUSTOMER_ID = new UniqueEntityID('customer-1');
const ENTRY_ID = new UniqueEntityID('entry-1');
const STEP_ID = new UniqueEntityID('step-1');
const ESCALATION_ID = new UniqueEntityID('escalation-1');

function makeEntry(overrides?: Partial<Record<string, unknown>>): FinanceEntry {
  const dueDate = new Date(2026, 2, 10); // March 10, 2026 (local time)
  return FinanceEntry.create(
    {
      tenantId: new UniqueEntityID(TENANT_ID),
      type: 'RECEIVABLE',
      code: 'REC-0042',
      description: 'Mensalidade Março',
      categoryId: new UniqueEntityID('cat-1'),
      customerName: 'João Silva',
      customerId: CUSTOMER_ID.toString(),
      expectedAmount: 1500,
      issueDate: new Date('2026-03-01'),
      dueDate,
      ...overrides,
    },
    ENTRY_ID,
  );
}

function makeStep(
  channel: 'EMAIL' | 'WHATSAPP' | 'INTERNAL_NOTE' | 'SYSTEM_ALERT',
): OverdueEscalationStep {
  return OverdueEscalationStep.create(
    {
      escalationId: ESCALATION_ID,
      daysOverdue: 5,
      channel,
      templateType: 'FRIENDLY_REMINDER',
      subject: 'Cobrança: {entryCode}',
      message:
        'Olá {customerName}, o valor de {amount} venceu em {dueDate} ({daysPastDue} dias). Código: {entryCode}.',
      order: 1,
    },
    STEP_ID,
  );
}

function makeAction(
  channel: 'EMAIL' | 'WHATSAPP' | 'INTERNAL_NOTE' | 'SYSTEM_ALERT',
): OverdueAction {
  return OverdueAction.create(
    {
      tenantId: new UniqueEntityID(TENANT_ID),
      entryId: ENTRY_ID,
      stepId: STEP_ID,
      channel,
    },
    new UniqueEntityID('action-1'),
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SUITE
// ────────────────────────────────────────────────────────────────────────────

let actionsRepository: InMemoryOverdueActionsRepository;
let messagingAccountsRepository: InMemoryMessagingAccountsRepository;
let emailAccountsRepository: InMemoryEmailAccountsRepository;
let customersRepository: InMemoryCustomersRepository;
let notificationsRepository: InMemoryNotificationsRepository;
let mockWhatsAppGateway: MessagingGateway;
let mockSmtpClient: SmtpClientService;
let sut: SendEscalationMessageUseCase;

describe('SendEscalationMessageUseCase', () => {
  beforeEach(() => {
    actionsRepository = new InMemoryOverdueActionsRepository();
    messagingAccountsRepository = new InMemoryMessagingAccountsRepository();
    emailAccountsRepository = new InMemoryEmailAccountsRepository();
    customersRepository = new InMemoryCustomersRepository();
    notificationsRepository = new InMemoryNotificationsRepository();

    mockWhatsAppGateway = {
      channel: 'WHATSAPP',
      sendMessage: vi.fn().mockResolvedValue({ externalId: 'ext-1', status: 'sent' }),
      parseWebhook: vi.fn().mockResolvedValue([]),
      verifyWebhook: vi.fn().mockReturnValue(true),
    };

    mockSmtpClient = {
      testConnection: vi.fn().mockResolvedValue(undefined),
      send: vi.fn().mockResolvedValue('message-id-123'),
    } as unknown as SmtpClientService;

    sut = new SendEscalationMessageUseCase(
      actionsRepository,
      messagingAccountsRepository,
      emailAccountsRepository,
      customersRepository,
      notificationsRepository,
      mockWhatsAppGateway,
      mockSmtpClient,
    );

    // Seed customer with phone and email
    const customer = Customer.create(
      {
        tenantId: new UniqueEntityID(TENANT_ID),
        name: 'João Silva',
        type: CustomerType.create('INDIVIDUAL'),
        email: 'joao@example.com',
        phone: '5511999990000',
      },
      CUSTOMER_ID,
    );
    customersRepository.items.push(customer);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // WHATSAPP
  // ──────────────────────────────────────────────────────────────────────────

  it('should send a WhatsApp message and mark action as SENT', async () => {
    // Seed WhatsApp account
    const waAccount = MessagingAccount.create(
      {
        tenantId: new UniqueEntityID(TENANT_ID),
        channel: 'WHATSAPP',
        name: 'WhatsApp Principal',
        settings: { instanceName: 'my-instance' },
      },
      new UniqueEntityID('wa-account-1'),
    );
    messagingAccountsRepository.items.push(waAccount);

    const action = makeAction('WHATSAPP');
    actionsRepository.items.push(action);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      action,
      step: makeStep('WHATSAPP'),
      entry: makeEntry(),
    });

    expect(result.success).toBe(true);
    expect(mockWhatsAppGateway.sendMessage).toHaveBeenCalledWith(
      'my-instance',
      expect.objectContaining({
        to: '5511999990000',
        text: expect.stringContaining('João Silva'),
      }),
    );

    // Verify action marked as SENT
    const updatedAction = actionsRepository.items.find(
      (a) => a.id.toString() === 'action-1',
    );
    expect(updatedAction?.status).toBe('SENT');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // EMAIL
  // ──────────────────────────────────────────────────────────────────────────

  it('should send an email and mark action as SENT', async () => {
    // Seed email account
    const emailAcc = EmailAccount.create(
      {
        tenantId: new UniqueEntityID(TENANT_ID),
        ownerUserId: new UniqueEntityID('user-1'),
        address: 'noreply@empresa.com',
        displayName: 'Empresa Demo',
        imapHost: 'imap.empresa.com',
        imapPort: 993,
        smtpHost: 'smtp.empresa.com',
        smtpPort: 465,
        smtpSecure: true,
        username: 'noreply@empresa.com',
        encryptedSecret: 'encrypted-pass',
        isDefault: true,
        isActive: true,
      },
      new UniqueEntityID('email-acc-1'),
    );
    emailAccountsRepository.items.push(emailAcc);

    const action = makeAction('EMAIL');
    actionsRepository.items.push(action);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      action,
      step: makeStep('EMAIL'),
      entry: makeEntry(),
    });

    expect(result.success).toBe(true);
    expect(mockSmtpClient.send).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.empresa.com',
        port: 465,
        secure: true,
      }),
      expect.objectContaining({
        to: ['joao@example.com'],
        subject: expect.stringContaining('REC-0042'),
        html: expect.stringContaining('João Silva'),
      }),
    );

    const updatedAction = actionsRepository.items.find(
      (a) => a.id.toString() === 'action-1',
    );
    expect(updatedAction?.status).toBe('SENT');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // INTERNAL_NOTE
  // ──────────────────────────────────────────────────────────────────────────

  it('should append an internal note to the entry', async () => {
    const action = makeAction('INTERNAL_NOTE');
    actionsRepository.items.push(action);

    const entry = makeEntry();

    const result = await sut.execute({
      tenantId: TENANT_ID,
      action,
      step: makeStep('INTERNAL_NOTE'),
      entry,
    });

    expect(result.success).toBe(true);
    expect(entry.notes).toContain('Cobrança automática');
    expect(entry.notes).toContain('João Silva');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SYSTEM_ALERT
  // ──────────────────────────────────────────────────────────────────────────

  it('should create a notification for SYSTEM_ALERT', async () => {
    const action = makeAction('SYSTEM_ALERT');
    actionsRepository.items.push(action);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      action,
      step: makeStep('SYSTEM_ALERT'),
      entry: makeEntry(),
      createdBy: 'user-admin-1',
    });

    expect(result.success).toBe(true);
    expect(notificationsRepository.items).toHaveLength(1);
    expect(notificationsRepository.items[0].title).toContain('REC-0042');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // FAILURE HANDLING
  // ──────────────────────────────────────────────────────────────────────────

  it('should mark action as FAILED when send fails', async () => {
    // No WhatsApp account = will fail
    const action = makeAction('WHATSAPP');
    actionsRepository.items.push(action);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      action,
      step: makeStep('WHATSAPP'),
      entry: makeEntry(),
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Nenhuma conta WhatsApp ativa');

    const updatedAction = actionsRepository.items.find(
      (a) => a.id.toString() === 'action-1',
    );
    expect(updatedAction?.status).toBe('FAILED');
    expect(updatedAction?.error).toBeTruthy();
  });

  it('should mark action as FAILED when WhatsApp gateway throws', async () => {
    const waAccount = MessagingAccount.create(
      {
        tenantId: new UniqueEntityID(TENANT_ID),
        channel: 'WHATSAPP',
        name: 'WA',
      },
      new UniqueEntityID('wa-acc-2'),
    );
    messagingAccountsRepository.items.push(waAccount);

    (mockWhatsAppGateway.sendMessage as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Evolution API error (500)'),
    );

    const action = makeAction('WHATSAPP');
    actionsRepository.items.push(action);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      action,
      step: makeStep('WHATSAPP'),
      entry: makeEntry(),
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Evolution API error');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PLACEHOLDER REPLACEMENT
  // ──────────────────────────────────────────────────────────────────────────

  it('should replace all 6 placeholders correctly', async () => {
    const waAccount = MessagingAccount.create(
      {
        tenantId: new UniqueEntityID(TENANT_ID),
        channel: 'WHATSAPP',
        name: 'WA',
        settings: { instanceName: 'inst' },
      },
      new UniqueEntityID('wa-acc-3'),
    );
    messagingAccountsRepository.items.push(waAccount);

    const action = makeAction('WHATSAPP');
    actionsRepository.items.push(action);

    await sut.execute({
      tenantId: TENANT_ID,
      action,
      step: makeStep('WHATSAPP'),
      entry: makeEntry(),
    });

    const sentText = (
      mockWhatsAppGateway.sendMessage as ReturnType<typeof vi.fn>
    ).mock.calls[0][1].text as string;

    // {customerName}
    expect(sentText).toContain('João Silva');
    // {amount} — BRL formatted
    expect(sentText).toMatch(/R\$\s*1[.,]500[.,]00/);
    // {dueDate}
    expect(sentText).toContain('10/03/2026');
    // {daysPastDue} — calculated from today
    expect(sentText).toMatch(/\d+ dias/);
    // {entryCode}
    expect(sentText).toContain('REC-0042');
  });
});
