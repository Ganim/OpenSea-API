import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryBankAccountsRepository } from '@/repositories/finance/in-memory/in-memory-bank-accounts-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import type { BankingProvider } from '@/services/banking/banking-provider.interface';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreatePixChargeUseCase } from './create-pix-charge';

vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

const mockProvider: BankingProvider = {
  providerName: 'MOCK',
  capabilities: ['READ', 'BOLETO', 'PIX', 'PAYMENT', 'TED'],
  authenticate: vi.fn().mockResolvedValue(undefined),
  healthCheck: vi.fn(),
  getAccounts: vi.fn(),
  getBalance: vi.fn(),
  getTransactions: vi.fn(),
  createBoleto: vi.fn().mockResolvedValue({
    nossoNumero: '123',
    barcode: 'abc',
    digitableLine: 'def',
    status: 'REGISTERED',
    dueDate: '2026-04-15',
    amount: 100,
  }),
  cancelBoleto: vi.fn(),
  getBoleto: vi.fn(),
  createPixCharge: vi.fn().mockResolvedValue({
    txId: 'tx123',
    status: 'ATIVA',
    pixCopyPaste: 'pix...',
    amount: 100,
    createdAt: '2026-03-31',
  }),
  executePixPayment: vi.fn(),
  getPixCharge: vi.fn(),
  executePayment: vi.fn(),
  getPaymentStatus: vi.fn(),
  registerWebhook: vi.fn(),
  handleWebhookPayload: vi.fn(),
};

let entriesRepository: InMemoryFinanceEntriesRepository;
let bankAccountsRepository: InMemoryBankAccountsRepository;
let getProvider: ReturnType<typeof vi.fn>;
let sut: CreatePixChargeUseCase;

describe('CreatePixChargeUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    bankAccountsRepository = new InMemoryBankAccountsRepository();
    getProvider = vi.fn().mockResolvedValue(mockProvider);
    sut = new CreatePixChargeUseCase(
      entriesRepository,
      bankAccountsRepository,
      getProvider,
    );
    vi.clearAllMocks();
    (mockProvider.authenticate as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (
      mockProvider.createPixCharge as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      txId: 'tx123',
      status: 'ATIVA',
      pixCopyPaste: 'pix...',
      amount: 100,
      createdAt: '2026-03-31',
    });
    getProvider.mockResolvedValue(mockProvider);
  });

  async function createBankAccountWithPix() {
    return bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Conta PIX',
      bankCode: '756',
      agency: '0001',
      accountNumber: '123456',
      accountType: 'CHECKING',
      pixKey: 'empresa@example.com',
      pixKeyType: 'EMAIL',
    });
  }

  async function createBankAccountWithoutPix() {
    return bankAccountsRepository.create({
      tenantId: 'tenant-1',
      name: 'Conta Sem PIX',
      bankCode: '756',
      agency: '0001',
      accountNumber: '654321',
      accountType: 'CHECKING',
    });
  }

  it('should create PIX charge for a PENDING RECEIVABLE entry', async () => {
    const bankAccount = await createBankAccountWithPix();
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Cobrança PIX',
      categoryId: 'cat-1',
      expectedAmount: 100,
      customerName: 'João Silva',
      issueDate: new Date('2026-03-01'),
      dueDate: new Date('2026-04-15'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      bankAccountId: bankAccount.id.toString(),
    });

    expect(result.pixCharge.txId).toBe('tx123');
    expect(result.pixCharge.status).toBe('ATIVA');
    expect(result.pixCharge.pixCopyPaste).toBe('pix...');
    expect(mockProvider.authenticate).toHaveBeenCalledOnce();
    expect(mockProvider.createPixCharge).toHaveBeenCalledOnce();
  });

  it('should persist txId as pixChargeId on the entry', async () => {
    const bankAccount = await createBankAccountWithPix();
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-002',
      description: 'Cobrança PIX persistência',
      categoryId: 'cat-1',
      expectedAmount: 200,
      customerName: 'Maria Souza',
      issueDate: new Date('2026-03-01'),
      dueDate: new Date('2026-04-15'),
    });

    await sut.execute({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      bankAccountId: bankAccount.id.toString(),
    });

    const updated = entriesRepository.items.find((e) => e.id.equals(entry.id));
    expect(updated?.pixChargeId).toBe('tx123');
  });

  it('should reject if bank account has no pixKey', async () => {
    const bankAccount = await createBankAccountWithoutPix();
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-003',
      description: 'Cobrança sem PIX configurado',
      categoryId: 'cat-1',
      expectedAmount: 100,
      customerName: 'Carlos Lima',
      issueDate: new Date('2026-03-01'),
      dueDate: new Date('2026-04-15'),
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        entryId: entry.id.toString(),
        bankAccountId: bankAccount.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should reject if entry is PAYABLE', async () => {
    const bankAccount = await createBankAccountWithPix();
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Pagamento fornecedor',
      categoryId: 'cat-1',
      expectedAmount: 100,
      supplierName: 'Fornecedor ABC',
      issueDate: new Date('2026-03-01'),
      dueDate: new Date('2026-04-15'),
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        entryId: entry.id.toString(),
        bankAccountId: bankAccount.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should reject if entry not found', async () => {
    const bankAccount = await createBankAccountWithPix();

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        entryId: 'non-existent-id',
        bankAccountId: bankAccount.id.toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should reject if entry status is PAID', async () => {
    const bankAccount = await createBankAccountWithPix();
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-004',
      description: 'Venda já paga',
      categoryId: 'cat-1',
      expectedAmount: 100,
      customerName: 'Ana Costa',
      status: 'RECEIVED',
      issueDate: new Date('2026-03-01'),
      dueDate: new Date('2026-04-15'),
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        entryId: entry.id.toString(),
        bankAccountId: bankAccount.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
