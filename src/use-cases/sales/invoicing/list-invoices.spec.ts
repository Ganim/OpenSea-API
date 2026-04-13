import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Invoice } from '@/entities/sales/invoice';
import { InMemoryInvoicesRepository } from '@/repositories/sales/in-memory/in-memory-invoices-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListInvoicesUseCase } from './list-invoices.use-case';

describe('ListInvoicesUseCase', () => {
  let invoicesRepository: InMemoryInvoicesRepository;
  let sut: ListInvoicesUseCase;

  const tenantId = 'tenant-123';

  beforeEach(() => {
    invoicesRepository = new InMemoryInvoicesRepository();
    sut = new ListInvoicesUseCase(invoicesRepository);
  });

  it('should return empty list if no invoices exist', async () => {
    const result = await sut.execute({
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
        accessKey: `key-${i}`,
        status: i % 2 === 0 ? 'ISSUED' : 'PENDING',
      });
      invoicesRepository.items.push(invoice);
    }

    const page1 = await sut.execute({ tenantId, page: 1, limit: 10 });

    expect(page1.data).toHaveLength(10);
    expect(page1.total).toBe(25);
    expect(page1.pages).toBe(3);

    const page2 = await sut.execute({ tenantId, page: 2, limit: 10 });

    expect(page2.data).toHaveLength(10);
  });

  it('should filter invoices by status', async () => {
    for (let i = 0; i < 5; i++) {
      invoicesRepository.items.push(
        Invoice.create({
          tenantId: new UniqueEntityID(tenantId),
          orderId: new UniqueEntityID(`order-${i}`),
          type: 'NFCE',
          number: String(i + 1).padStart(3, '0'),
          series: '1',
          accessKey: `key-${i}`,
          status: 'ISSUED',
        }),
      );
    }
    invoicesRepository.items.push(
      Invoice.create({
        tenantId: new UniqueEntityID(tenantId),
        orderId: new UniqueEntityID('order-pending'),
        type: 'NFCE',
        number: '006',
        series: '1',
        accessKey: 'key-pending',
        status: 'PENDING',
      }),
    );

    const result = await sut.execute({
      tenantId,
      status: 'ISSUED',
      page: 1,
      limit: 10,
    });

    expect(result.data).toHaveLength(5);
    expect(result.data.every((inv) => inv.status === 'ISSUED')).toBe(true);
  });

  it('should throw if page is less than 1', async () => {
    await expect(sut.execute({ tenantId, page: 0, limit: 10 })).rejects.toThrow(
      'Page must be >= 1',
    );
  });

  it('should throw if limit is out of range', async () => {
    await expect(sut.execute({ tenantId, page: 1, limit: 0 })).rejects.toThrow(
      'Limit must be between 1 and 100',
    );

    await expect(
      sut.execute({ tenantId, page: 1, limit: 101 }),
    ).rejects.toThrow('Limit must be between 1 and 100');
  });
});
