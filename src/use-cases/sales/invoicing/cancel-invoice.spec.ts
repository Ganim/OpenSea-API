import { describe, it, expect, beforeEach } from 'vitest';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Invoice } from '@/entities/sales/invoice';
import { InMemoryInvoicesRepository } from '@/repositories/sales/in-memory/in-memory-invoices-repository';
import { FocusNfeProviderImpl } from '@/providers/nfe/implementations/focus-nfe.impl';
import { CancelInvoiceUseCase } from './cancel-invoice.use-case';

describe('CancelInvoiceUseCase', () => {
  let invoicesRepository: InMemoryInvoicesRepository;
  let focusNfeProvider: FocusNfeProviderImpl;
  let useCase: CancelInvoiceUseCase;

  const tenantId = 'tenant-123';
  const userId = 'user-123';

  beforeEach(() => {
    invoicesRepository = new InMemoryInvoicesRepository();
    focusNfeProvider = new FocusNfeProviderImpl(false);
    useCase = new CancelInvoiceUseCase(invoicesRepository, focusNfeProvider);
  });

  it('should throw ResourceNotFoundError if invoice does not exist', async () => {
    await expect(
      useCase.execute({
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

    await invoicesRepository.create(invoice);

    await expect(
      useCase.execute({
        invoiceId: invoice.id.toString(),
        tenantId,
        reason: 'Test cancel',
        userId,
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
