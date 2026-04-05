import { describe, it, expect, beforeEach } from 'vitest';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Invoice } from '@/entities/sales/invoice';
import { InMemoryInvoicesRepository } from '@/repositories/sales/in-memory/in-memory-invoices-repository';
import { FocusNfeProviderImpl } from '@/providers/nfe/implementations/focus-nfe.impl';
import { CheckInvoiceStatusUseCase } from './check-invoice-status.use-case';

describe('CheckInvoiceStatusUseCase', () => {
  let invoicesRepository: InMemoryInvoicesRepository;
  let focusNfeProvider: FocusNfeProviderImpl;
  let useCase: CheckInvoiceStatusUseCase;

  const tenantId = 'tenant-123';

  beforeEach(() => {
    invoicesRepository = new InMemoryInvoicesRepository();
    focusNfeProvider = new FocusNfeProviderImpl(false);
    useCase = new CheckInvoiceStatusUseCase(invoicesRepository, focusNfeProvider);
  });

  it('should throw ResourceNotFoundError if invoice does not exist', async () => {
    await expect(
      useCase.execute({
        invoiceId: 'non-existent',
        tenantId,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should return invoice status if exists', async () => {
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

    await invoicesRepository.create(invoice);

    const result = await useCase.execute({
      invoiceId: invoice.id.toString(),
      tenantId,
    });

    expect(result.invoiceId).toBe(invoice.id.toString());
    expect(result.status).toBe('ISSUED');
    expect(result.accessKey).toBe(invoice.accessKey);
  });
});
