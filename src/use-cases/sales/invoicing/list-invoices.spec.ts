import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Invoice } from '@/entities/sales/invoice';
import { InMemoryInvoicesRepository } from '@/repositories/sales/in-memory/in-memory-invoices-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListInvoicesUseCase } from './list-invoices.use-case';

describe('ListInvoicesUseCase', () => {
  let invoicesRepository: InMemoryInvoicesRepository;
  let useCase: ListInvoicesUseCase;

  const tenantId = 'tenant-123';

  beforeEach(() => {
    invoicesRepository = new InMemoryInvoicesRepository();
    useCase = new ListInvoicesUseCase(invoicesRepository);
  });

  it('should return empty list if no invoices exist', async () => {
    const result = await useCase.execute({
      tenantId,
      page: 1,
      limit: 10,
    });

    expect(result.data).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.pages).toBe(0);
  });

  it('should list invoices paginated', async () => {
    for (let i = 0; i < 25; i++) {
      const invoice = Invoice.create({
        tenantId: new UniqueEntityID(tenantId),
        orderId: new UniqueEntityID(`order-${i}`),
        type: 'NFCE',
        number: String(i + 1).padStart(3, '0'),
        series: '1',
        accessKey: `35240512345678000190550010000000${String(i + 1).padStart(8, '0')}`,
        status: i % 2 === 0 ? 'ISSUED' : 'PENDING',
      });
      await invoicesRepository.create(invoice);
    }

    const page1 = await useCase.execute({
      tenantId,
      page: 1,
      limit: 10,
    });

    expect(page1.data).toHaveLength(10);
    expect(page1.total).toBe(25);
    expect(page1.pages).toBe(3);

    const page2 = await useCase.execute({
      tenantId,
      page: 2,
      limit: 10,
    });

    expect(page2.data).toHaveLength(10);
  });

  it('should filter invoices by status', async () => {
    for (let i = 0; i < 5; i++) {
      const invoice = Invoice.create({
        tenantId: new UniqueEntityID(tenantId),
        orderId: new UniqueEntityID(`order-${i}`),
        type: 'NFCE',
        number: String(i + 1).padStart(3, '0'),
        series: '1',
        accessKey: `35240512345678000190550010000000${String(i + 1).padStart(8, '0')}`,
        status: 'ISSUED',
      });
      await invoicesRepository.create(invoice);
    }

    const result = await useCase.execute({
      tenantId,
      status: 'ISSUED',
      page: 1,
      limit: 10,
    });

    expect(result.data).toHaveLength(5);
    expect(result.data.every((inv) => inv.status === 'ISSUED')).toBe(true);
  });
});
