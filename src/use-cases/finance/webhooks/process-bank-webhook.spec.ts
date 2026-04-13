import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryBankAccountsRepository } from '@/repositories/finance/in-memory/in-memory-bank-accounts-repository';
import { InMemoryBankWebhookEventsRepository } from '@/repositories/finance/in-memory/in-memory-bank-webhook-events-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import type {
  BankingProvider,
  WebhookResult,
} from '@/services/banking/banking-provider.interface';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProcessBankWebhookUseCase } from './process-bank-webhook';

vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

// Subclass exposing the threshold for tests
class TestProcessBankWebhookUseCase extends ProcessBankWebhookUseCase {
  public mockThreshold: number | null = null;

  protected override async resolveAutoLowThreshold(
    _bankAccountId: string,
  ): Promise<number | null> {
    return this.mockThreshold;
  }
}

function makeProviderWithResult(result: WebhookResult): BankingProvider {
  return {
    providerName: 'MOCK',
    capabilities: ['READ', 'BOLETO', 'PIX', 'PAYMENT', 'TED'],
    authenticate: vi.fn().mockResolvedValue(undefined),
    healthCheck: vi.fn(),
    getAccounts: vi.fn(),
    getBalance: vi.fn(),
    getTransactions: vi.fn(),
    createBoleto: vi.fn(),
    cancelBoleto: vi.fn(),
    getBoleto: vi.fn(),
    createPixCharge: vi.fn(),
    executePixPayment: vi.fn(),
    getPixCharge: vi.fn(),
    executePayment: vi.fn(),
    getPaymentStatus: vi.fn(),
    registerWebhook: vi.fn(),
    handleWebhookPayload: vi.fn().mockResolvedValue(result),
  };
}

let webhookEventsRepository: InMemoryBankWebhookEventsRepository;
let financeEntriesRepository: InMemoryFinanceEntriesRepository;
let bankAccountsRepository: InMemoryBankAccountsRepository;
let sut: TestProcessBankWebhookUseCase;

const TENANT_ID = 'tenant-1';

async function setupBankAccount() {
  return bankAccountsRepository.create({
    tenantId: TENANT_ID,
    name: 'Conta Sicoob',
    bankCode: '756',
    agency: '0001',
    accountNumber: '12345',
    accountType: 'CHECKING',
  });
}

async function setupReceivableEntry(overrides?: {
  pixChargeId?: string;
  boletoBarcodeNumber?: string;
  expectedAmount?: number;
  dueDate?: Date;
}) {
  return financeEntriesRepository.create({
    tenantId: TENANT_ID,
    type: 'RECEIVABLE',
    code: `REC-${Date.now()}`,
    description: 'Venda',
    categoryId: 'cat-1',
    expectedAmount: overrides?.expectedAmount ?? 100,
    customerName: 'Cliente',
    issueDate: new Date('2026-03-01'),
    dueDate: overrides?.dueDate ?? new Date('2026-04-01'),
    pixChargeId: overrides?.pixChargeId,
    boletoBarcodeNumber: overrides?.boletoBarcodeNumber,
  });
}

describe('ProcessBankWebhookUseCase', () => {
  beforeEach(() => {
    webhookEventsRepository = new InMemoryBankWebhookEventsRepository();
    financeEntriesRepository = new InMemoryFinanceEntriesRepository();
    bankAccountsRepository = new InMemoryBankAccountsRepository();
    sut = new TestProcessBankWebhookUseCase(
      webhookEventsRepository,
      financeEntriesRepository,
      bankAccountsRepository,
      async (_bankAccountId, _providerName) =>
        makeProviderWithResult({
          eventType: 'PIX_RECEIVED',
          externalId: 'pix-tx-001',
          amount: 100,
          paidAt: '2026-04-01T10:00:00Z',
          rawPayload: { foo: 'bar' },
        }),
    );
    sut.mockThreshold = null; // auto-settle everything by default
  });

  it('should auto-settle when amount <= threshold', async () => {
    const bankAccount = await setupBankAccount();
    const entry = await setupReceivableEntry({ pixChargeId: 'pix-tx-001' });

    sut.mockThreshold = 500; // threshold 500, amount is 100 → auto-settle
    const provider = makeProviderWithResult({
      eventType: 'PIX_RECEIVED',
      externalId: 'pix-tx-001',
      amount: 100,
      paidAt: '2026-04-01T10:00:00Z',
      rawPayload: {},
    });
    sut = new TestProcessBankWebhookUseCase(
      webhookEventsRepository,
      financeEntriesRepository,
      bankAccountsRepository,
      async () => provider,
    );
    sut.mockThreshold = 500;

    const result = await sut.execute({
      tenantId: TENANT_ID,
      bankAccountId: bankAccount.id.toString(),
      provider: 'SICOOB',
      payload: {},
    });

    expect(result.matched).toBe(true);
    expect(result.autoSettled).toBe(true);
    expect(result.event.autoSettled).toBe(true);
    expect(result.event.matchedEntryId).toBe(entry.id.toString());

    const updatedEntry = financeEntriesRepository.items.find((e) =>
      e.id.equals(entry.id),
    );
    expect(updatedEntry?.status).toBe('RECEIVED');
    expect(updatedEntry?.paymentDate).toBeDefined();
    expect(updatedEntry?.actualAmount).toBe(100);
  });

  it('should queue for review when amount > threshold', async () => {
    const bankAccount = await setupBankAccount();
    const entry = await setupReceivableEntry({ pixChargeId: 'pix-tx-002' });

    const provider = makeProviderWithResult({
      eventType: 'PIX_RECEIVED',
      externalId: 'pix-tx-002',
      amount: 1500,
      paidAt: '2026-04-01T10:00:00Z',
      rawPayload: {},
    });
    sut = new TestProcessBankWebhookUseCase(
      webhookEventsRepository,
      financeEntriesRepository,
      bankAccountsRepository,
      async () => provider,
    );
    sut.mockThreshold = 500; // threshold 500, amount 1500 → manual review

    // Update the entry amount to match the webhook
    await financeEntriesRepository.update({
      id: entry.id,
      expectedAmount: 1500,
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      bankAccountId: bankAccount.id.toString(),
      provider: 'SICOOB',
      payload: {},
    });

    expect(result.matched).toBe(true);
    expect(result.autoSettled).toBe(false);
    expect(result.event.autoSettled).toBe(false);

    const updatedEntry = financeEntriesRepository.items.find((e) =>
      e.id.equals(entry.id),
    );
    // Status should NOT have been changed
    expect(updatedEntry?.status).toBe('PENDING');
  });

  it('should handle unmatched webhooks', async () => {
    const bankAccount = await setupBankAccount();
    // No entries created — webhook has no match

    const provider = makeProviderWithResult({
      eventType: 'PIX_RECEIVED',
      externalId: 'pix-tx-unknown',
      amount: 250,
      paidAt: '2026-04-01T10:00:00Z',
      rawPayload: {},
    });
    sut = new TestProcessBankWebhookUseCase(
      webhookEventsRepository,
      financeEntriesRepository,
      bankAccountsRepository,
      async () => provider,
    );

    const result = await sut.execute({
      tenantId: TENANT_ID,
      bankAccountId: bankAccount.id.toString(),
      provider: 'SICOOB',
      payload: {},
    });

    expect(result.matched).toBe(false);
    expect(result.autoSettled).toBe(false);
    expect(result.event.matchedEntryId).toBeNull();
  });

  it('should be idempotent — duplicate webhook returns existing event', async () => {
    const bankAccount = await setupBankAccount();
    const entry = await setupReceivableEntry({ pixChargeId: 'pix-tx-dupe' });

    const provider = makeProviderWithResult({
      eventType: 'PIX_RECEIVED',
      externalId: 'pix-tx-dupe',
      amount: 100,
      paidAt: '2026-04-01T10:00:00Z',
      rawPayload: {},
    });
    sut = new TestProcessBankWebhookUseCase(
      webhookEventsRepository,
      financeEntriesRepository,
      bankAccountsRepository,
      async () => provider,
    );

    const first = await sut.execute({
      tenantId: TENANT_ID,
      bankAccountId: bankAccount.id.toString(),
      provider: 'SICOOB',
      payload: {},
    });

    const second = await sut.execute({
      tenantId: TENANT_ID,
      bankAccountId: bankAccount.id.toString(),
      provider: 'SICOOB',
      payload: {},
    });

    expect(second.event.id).toBe(first.event.id);
    expect(webhookEventsRepository.items).toHaveLength(1);

    // Entries repository — update should not have been called twice
    const updatedEntry = financeEntriesRepository.items.find((e) =>
      e.id.equals(entry.id),
    );
    expect(updatedEntry?.status).toBe('RECEIVED'); // settled on first call only
  });

  it('should set entry status to RECEIVED for RECEIVABLE entries', async () => {
    const bankAccount = await setupBankAccount();
    const entry = await setupReceivableEntry({ pixChargeId: 'pix-tx-003' });

    const provider = makeProviderWithResult({
      eventType: 'PIX_RECEIVED',
      externalId: 'pix-tx-003',
      amount: 100,
      paidAt: '2026-04-02T08:00:00Z',
      rawPayload: {},
    });
    sut = new TestProcessBankWebhookUseCase(
      webhookEventsRepository,
      financeEntriesRepository,
      bankAccountsRepository,
      async () => provider,
    );
    sut.mockThreshold = null; // auto-settle all

    const result = await sut.execute({
      tenantId: TENANT_ID,
      bankAccountId: bankAccount.id.toString(),
      provider: 'SICOOB',
      payload: {},
    });

    expect(result.autoSettled).toBe(true);

    const updatedEntry = financeEntriesRepository.items.find((e) =>
      e.id.equals(entry.id),
    );
    expect(updatedEntry?.status).toBe('RECEIVED');
    expect(updatedEntry?.actualAmount).toBe(100);
    expect(updatedEntry?.paymentDate?.toISOString()).toBe(
      '2026-04-02T08:00:00.000Z',
    );
  });

  it('should throw ResourceNotFoundError for unknown bank account', async () => {
    const provider = makeProviderWithResult({
      eventType: 'PIX_RECEIVED',
      externalId: 'pix-tx-x',
      amount: 50,
      paidAt: '2026-04-01T10:00:00Z',
      rawPayload: {},
    });
    sut = new TestProcessBankWebhookUseCase(
      webhookEventsRepository,
      financeEntriesRepository,
      bankAccountsRepository,
      async () => provider,
    );

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        bankAccountId: 'non-existent',
        provider: 'SICOOB',
        payload: {},
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should match BOLETO_PAID by boletoBarcodeNumber', async () => {
    const bankAccount = await setupBankAccount();
    const entry = await setupReceivableEntry({
      boletoBarcodeNumber: 'NOSSO-NUM-001',
    });

    const provider = makeProviderWithResult({
      eventType: 'BOLETO_PAID',
      externalId: 'NOSSO-NUM-001',
      amount: 100,
      paidAt: '2026-04-05T12:00:00Z',
      rawPayload: {},
    });
    sut = new TestProcessBankWebhookUseCase(
      webhookEventsRepository,
      financeEntriesRepository,
      bankAccountsRepository,
      async () => provider,
    );
    sut.mockThreshold = null;

    const result = await sut.execute({
      tenantId: TENANT_ID,
      bankAccountId: bankAccount.id.toString(),
      provider: 'SICOOB',
      payload: {},
    });

    expect(result.matched).toBe(true);
    expect(result.autoSettled).toBe(true);
    expect(result.event.matchedEntryId).toBe(entry.id.toString());

    const updatedEntry = financeEntriesRepository.items.find((e) =>
      e.id.equals(entry.id),
    );
    expect(updatedEntry?.status).toBe('RECEIVED');
  });
});
