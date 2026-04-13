import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FocusNfeConfig } from '@/entities/sales/focus-nfe-config';
import { Invoice } from '@/entities/sales/invoice';
import type { IFocusNfeProvider } from '@/providers/nfe/focus-nfe.provider';
import { InMemoryFocusNfeConfigRepository } from '@/repositories/sales/in-memory/in-memory-focus-nfe-config-repository';
import { InMemoryInvoicesRepository } from '@/repositories/sales/in-memory/in-memory-invoices-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CheckInvoiceStatusUseCase } from './check-invoice-status.use-case';

describe('CheckInvoiceStatusUseCase', () => {
  let invoicesRepository: InMemoryInvoicesRepository;
  let focusNfeConfigRepository: InMemoryFocusNfeConfigRepository;
  let focusNfeProvider: IFocusNfeProvider;
  let sut: CheckInvoiceStatusUseCase;

  const tenantId = 'tenant-123';

  beforeEach(() => {
    invoicesRepository = new InMemoryInvoicesRepository();
    focusNfeConfigRepository = new InMemoryFocusNfeConfigRepository();

    focusNfeProvider = {
      createInvoice: vi.fn(),
      checkStatus: vi.fn().mockResolvedValue({
        ref: 'ref-1',
        status: 'autorizado',
        status_code: 100,
        chave_nfe: 'new-access-key',
        protocolo: 'proto-123',
        caminho_xml: 'https://xml.url',
        caminho_pdf: 'https://pdf.url',
        descricao_status: 'Autorizado',
      }),
      cancelInvoice: vi.fn(),
      testConnection: vi.fn(),
    };

    sut = new CheckInvoiceStatusUseCase(
      invoicesRepository,
      focusNfeProvider,
      focusNfeConfigRepository,
    );
  });

  it('should throw ResourceNotFoundError if invoice does not exist', async () => {
    await expect(
      sut.execute({
        invoiceId: 'non-existent',
        tenantId,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should return invoice status for ISSUED invoice without querying provider', async () => {
    const invoice = Invoice.create({
      tenantId: new UniqueEntityID(tenantId),
      orderId: new UniqueEntityID('order-123'),
      type: 'NFCE',
      number: '001',
      series: '1',
      accessKey: '35240512345678000190550010000000011234567890',
      status: 'ISSUED',
      issuedAt: new Date(),
    });

    invoicesRepository.items.push(invoice);

    const result = await sut.execute({
      invoiceId: invoice.id.toString(),
      tenantId,
    });

    expect(result.id).toBe(invoice.id.toString());
    expect(result.status).toBe('ISSUED');
    expect(result.accessKey).toBe(invoice.accessKey);
    expect(focusNfeProvider.checkStatus).not.toHaveBeenCalled();
  });

  it('should query provider and update status for PENDING invoice', async () => {
    const invoice = Invoice.create({
      tenantId: new UniqueEntityID(tenantId),
      orderId: new UniqueEntityID('order-123'),
      type: 'NFE',
      number: '001',
      series: '1',
      accessKey: 'pending-access-key',
      status: 'PENDING',
    });
    invoicesRepository.items.push(invoice);

    const config = FocusNfeConfig.create({
      tenantId: new UniqueEntityID(tenantId),
      apiKey: 'test-api-key',
      productionMode: false,
      isEnabled: true,
      autoIssueOnConfirm: true,
      defaultSeries: '1',
    });
    focusNfeConfigRepository.items.push(config);

    const result = await sut.execute({
      invoiceId: invoice.id.toString(),
      tenantId,
    });

    expect(result.status).toBe('ISSUED');
    expect(focusNfeProvider.checkStatus).toHaveBeenCalled();
  });

  it('should gracefully handle provider failure and return current status', async () => {
    const invoice = Invoice.create({
      tenantId: new UniqueEntityID(tenantId),
      orderId: new UniqueEntityID('order-123'),
      type: 'NFE',
      number: '001',
      series: '1',
      accessKey: 'pending-access-key',
      status: 'PENDING',
    });
    invoicesRepository.items.push(invoice);

    const config = FocusNfeConfig.create({
      tenantId: new UniqueEntityID(tenantId),
      apiKey: 'test-api-key',
      productionMode: false,
      isEnabled: true,
      autoIssueOnConfirm: true,
      defaultSeries: '1',
    });
    focusNfeConfigRepository.items.push(config);

    vi.mocked(focusNfeProvider.checkStatus).mockRejectedValueOnce(
      new Error('Provider unavailable'),
    );

    const result = await sut.execute({
      invoiceId: invoice.id.toString(),
      tenantId,
    });

    expect(result.status).toBe('PENDING');
  });
});
