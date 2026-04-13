import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FocusNfeConfig } from '@/entities/sales/focus-nfe-config';
import { Invoice } from '@/entities/sales/invoice';
import type { IFocusNfeProvider } from '@/providers/nfe/focus-nfe.provider';
import { InMemoryCompaniesRepository } from '@/repositories/core/in-memory/in-memory-companies-repository';
import { InMemoryFocusNfeConfigRepository } from '@/repositories/sales/in-memory/in-memory-focus-nfe-config-repository';
import { InMemoryInvoicesRepository } from '@/repositories/sales/in-memory/in-memory-invoices-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CancelInvoiceUseCase } from './cancel-invoice.use-case';

describe('CancelInvoiceUseCase', () => {
  let invoicesRepository: InMemoryInvoicesRepository;
  let focusNfeConfigRepository: InMemoryFocusNfeConfigRepository;
  let companiesRepository: InMemoryCompaniesRepository;
  let focusNfeProvider: IFocusNfeProvider;
  let sut: CancelInvoiceUseCase;

  const tenantId = 'tenant-123';
  const userId = 'user-123';

  beforeEach(() => {
    invoicesRepository = new InMemoryInvoicesRepository();
    focusNfeConfigRepository = new InMemoryFocusNfeConfigRepository();
    companiesRepository = new InMemoryCompaniesRepository();

    focusNfeProvider = {
      createInvoice: vi.fn(),
      checkStatus: vi.fn(),
      cancelInvoice: vi.fn().mockResolvedValue({
        ref: 'ref-1',
        status: 'cancelado',
        status_code: 135,
      }),
      testConnection: vi.fn(),
    };

    sut = new CancelInvoiceUseCase(
      invoicesRepository,
      focusNfeProvider,
      focusNfeConfigRepository,
      companiesRepository,
    );
  });

  it('should throw ResourceNotFoundError if invoice does not exist', async () => {
    await expect(
      sut.execute({
        invoiceId: 'non-existent',
        tenantId,
        reason: 'Test cancel',
        userId,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not cancel invoice if status is not ISSUED', async () => {
    const invoice = Invoice.create({
      tenantId: new UniqueEntityID(tenantId),
      orderId: new UniqueEntityID('order-123'),
      type: 'NFCE',
      number: '001',
      series: '1',
      accessKey: '35240512345678000190550010000000011234567890',
      status: 'PENDING',
    });

    invoicesRepository.items.push(invoice);

    await expect(
      sut.execute({
        invoiceId: invoice.id.toString(),
        tenantId,
        reason: 'Test cancel',
        userId,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should cancel an ISSUED invoice successfully', async () => {
    const invoice = Invoice.create({
      tenantId: new UniqueEntityID(tenantId),
      orderId: new UniqueEntityID('order-123'),
      type: 'NFE',
      number: '001',
      series: '1',
      accessKey: '35240512345678000190550010000000011234567890',
      status: 'ISSUED',
      issuedAt: new Date(),
    });
    invoicesRepository.items.push(invoice);

    const config = FocusNfeConfig.create({
      tenantId: new UniqueEntityID(tenantId),
      apiKey: 'test-api-key',
      productionMode: false,
      isEnabled: true,
      autoIssueOnConfirm: true,
      defaultSeries: '1',
      createdBy: userId,
    });
    focusNfeConfigRepository.items.push(config);

    const { Company } = await import('@/entities/core/company');
    const company = Company.create({
      tenantId: new UniqueEntityID(tenantId),
      legalName: 'Empresa Teste LTDA',
      cnpj: '11222333000181',
    });
    companiesRepository.items.push(company);

    const result = await sut.execute({
      invoiceId: invoice.id.toString(),
      tenantId,
      reason: 'Cliente desistiu da compra',
      userId,
    });

    expect(result.status).toBe('CANCELLED');
    expect(result.cancelReason).toBe('Cliente desistiu da compra');
    expect(result.cancelledAt).toBeInstanceOf(Date);
    expect(focusNfeProvider.cancelInvoice).toHaveBeenCalled();
  });

  it('should throw BadRequestError if Focus NFe is not configured', async () => {
    const invoice = Invoice.create({
      tenantId: new UniqueEntityID(tenantId),
      orderId: new UniqueEntityID('order-123'),
      type: 'NFE',
      number: '001',
      series: '1',
      accessKey: '35240512345678000190550010000000011234567890',
      status: 'ISSUED',
      issuedAt: new Date(),
    });
    invoicesRepository.items.push(invoice);

    await expect(
      sut.execute({
        invoiceId: invoice.id.toString(),
        tenantId,
        reason: 'Test cancel',
        userId,
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
