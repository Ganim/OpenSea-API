import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryPaymentOrdersRepository } from '@/repositories/finance/in-memory/in-memory-payment-orders-repository';
import type { BankAccountsRepository } from '@/repositories/finance/bank-accounts-repository';
import type { FileUploadService, UploadResult } from '@/services/storage/file-upload-service';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GeneratePaymentReceiptUseCase } from './generate-payment-receipt';

// Mock PDF library to avoid needing PDFKit in unit tests
vi.mock('@/lib/pdf', () => {
  const mockDoc = {
    page: {
      margins: { left: 50, right: 50, top: 40, bottom: 40 },
      width: 595,
      height: 842,
    },
    font: vi.fn().mockReturnThis(),
    fontSize: vi.fn().mockReturnThis(),
    fillColor: vi.fn().mockReturnThis(),
    text: vi.fn().mockReturnThis(),
    addPage: vi.fn().mockReturnThis(),
  };

  return {
    createPDFDocument: vi.fn().mockReturnValue(mockDoc),
    collectPDFBuffer: vi
      .fn()
      .mockResolvedValue(Buffer.from('mock-pdf-content')),
    drawHorizontalLine: vi.fn(),
    formatBRL: vi.fn((value: number) => `R$ ${value.toFixed(2)}`),
    formatDateBR: vi.fn(() => '01/04/2026'),
    maskCPF: vi.fn((cpf: string) => cpf),
    formatCNPJ: vi.fn((cnpj: string) => cnpj),
  };
});

// Mock audit queue
vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

function createMockBankAccountsRepository(): BankAccountsRepository {
  return {
    create: vi.fn(),
    findById: vi.fn().mockResolvedValue({
      id: new UniqueEntityID('bank-1'),
      name: 'Conta Sicoob',
      bankCode: '756',
      bankName: 'Sicoob',
      agency: '0001',
      agencyDigit: undefined,
      accountNumber: '123456789',
      accountDigit: '0',
      accountType: 'CHECKING',
      displayAgency: '0001',
      displayAccount: '123456789-0',
      status: 'ACTIVE',
      pixKeyType: undefined,
      pixKey: undefined,
      currentBalance: 10000,
      isDefault: true,
      apiEnabled: true,
      createdAt: new Date(),
    }),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as BankAccountsRepository;
}

function createMockFileUploadService(): FileUploadService {
  const mockUploadResult: UploadResult = {
    key: 'tenants/tenant-1/payment-receipts/abc123-comprovante.pdf',
    url: 'https://s3.example.com/bucket/tenants/tenant-1/payment-receipts/abc123-comprovante.pdf',
    size: 1024,
    mimeType: 'application/pdf',
  };

  return {
    upload: vi.fn().mockResolvedValue(mockUploadResult),
    getPresignedUrl: vi
      .fn()
      .mockResolvedValue('https://s3.example.com/presigned-url?token=abc'),
    getObject: vi.fn(),
    delete: vi.fn(),
    initiateMultipartUpload: vi.fn(),
    getPresignedPartUrls: vi.fn(),
    completeMultipartUpload: vi.fn(),
    abortMultipartUpload: vi.fn(),
  } as unknown as FileUploadService;
}

let paymentOrdersRepository: InMemoryPaymentOrdersRepository;
let financeEntriesRepository: InMemoryFinanceEntriesRepository;
let bankAccountsRepository: BankAccountsRepository;
let fileUploadService: FileUploadService;
let sut: GeneratePaymentReceiptUseCase;

describe('GeneratePaymentReceiptUseCase', () => {
  beforeEach(() => {
    paymentOrdersRepository = new InMemoryPaymentOrdersRepository();
    financeEntriesRepository = new InMemoryFinanceEntriesRepository();
    bankAccountsRepository = createMockBankAccountsRepository();
    fileUploadService = createMockFileUploadService();

    sut = new GeneratePaymentReceiptUseCase(
      paymentOrdersRepository,
      financeEntriesRepository,
      bankAccountsRepository,
      fileUploadService,
    );
  });

  async function createCompletedOrder() {
    const entry = await financeEntriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-001',
      description: 'Pagamento a Fornecedor XYZ',
      categoryId: 'category-1',
      expectedAmount: 1500,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      status: 'PENDING',
    });

    const order = await paymentOrdersRepository.create({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      bankAccountId: 'bank-1',
      method: 'PIX',
      amount: 1500,
      recipientData: {
        pixKey: 'fornecedor@email.com',
        recipientName: 'Fornecedor XYZ LTDA',
        recipientCpfCnpj: '12.345.678/0001-00',
      },
      requestedById: 'user-requester',
    });

    // Manually set to COMPLETED with approval info
    const idx = paymentOrdersRepository.items.findIndex(
      (i) => i.id === order.id,
    );
    paymentOrdersRepository.items[idx].status = 'COMPLETED';
    paymentOrdersRepository.items[idx].externalId = 'ext-pix-123456';
    paymentOrdersRepository.items[idx].approvedById = 'user-approver';
    paymentOrdersRepository.items[idx].approvedAt = new Date('2026-04-01T10:30:00');

    return { order: paymentOrdersRepository.items[idx], entry };
  }

  it('should generate PDF buffer and return a non-empty buffer', async () => {
    const { order } = await createCompletedOrder();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      orderId: order.id,
    });

    expect(result.receiptFileId).toBeDefined();
    expect(result.receiptUrl).toBeDefined();
    expect(result.receiptUrl).toContain('presigned-url');
  });

  it('should call S3 upload with correct arguments', async () => {
    const { order } = await createCompletedOrder();

    await sut.execute({
      tenantId: 'tenant-1',
      orderId: order.id,
    });

    expect(fileUploadService.upload).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.stringContaining('.pdf'),
      'application/pdf',
      expect.objectContaining({
        prefix: expect.stringContaining('payment-receipts'),
      }),
    );
  });

  it('should call getPresignedUrl with the uploaded key', async () => {
    const { order } = await createCompletedOrder();

    await sut.execute({
      tenantId: 'tenant-1',
      orderId: order.id,
    });

    expect(fileUploadService.getPresignedUrl).toHaveBeenCalledWith(
      'tenants/tenant-1/payment-receipts/abc123-comprovante.pdf',
    );
  });

  it('should throw ResourceNotFoundError if order not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        orderId: 'non-existent-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw BadRequestError if order is not COMPLETED', async () => {
    const entry = await financeEntriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-002',
      description: 'Pending order',
      categoryId: 'category-1',
      expectedAmount: 500,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      status: 'PENDING',
    });

    const order = await paymentOrdersRepository.create({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      bankAccountId: 'bank-1',
      method: 'PIX',
      amount: 500,
      recipientData: { pixKey: 'test@test.com' },
      requestedById: 'user-1',
    });

    // Order is still PENDING_APPROVAL
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        orderId: order.id,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should work even when bank account is not found', async () => {
    (
      bankAccountsRepository.findById as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce(null);

    const { order } = await createCompletedOrder();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      orderId: order.id,
    });

    expect(result.receiptFileId).toBeDefined();
    expect(result.receiptUrl).toBeDefined();
  });

  it('should include correct tenant prefix in upload path', async () => {
    const { order } = await createCompletedOrder();

    await sut.execute({
      tenantId: 'tenant-1',
      orderId: order.id,
    });

    expect(fileUploadService.upload).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.any(String),
      'application/pdf',
      expect.objectContaining({
        prefix: 'tenants/tenant-1/payment-receipts',
      }),
    );
  });
});
