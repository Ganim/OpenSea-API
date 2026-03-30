import { InMemoryFinanceCategoriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-categories-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateEntryFromSalesOrderUseCase } from './create-entry-from-sales-order';

vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

let entriesRepository: InMemoryFinanceEntriesRepository;
let categoriesRepository: InMemoryFinanceCategoriesRepository;
let sut: CreateEntryFromSalesOrderUseCase;

describe('CreateEntryFromSalesOrderUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    categoriesRepository = new InMemoryFinanceCategoriesRepository();
    sut = new CreateEntryFromSalesOrderUseCase(
      entriesRepository,
      categoriesRepository,
    );
  });

  it('should create a RECEIVABLE entry from a sales order', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      salesOrderId: 'order-123',
      customerName: 'Empresa ABC Ltda',
      totalAmount: 15000,
      dueDate: new Date('2026-04-01'),
      description: 'Pedido #ABC-123',
      userId: 'user-1',
    });

    expect(result.entry).toBeDefined();
    expect(result.entry.type).toBe('RECEIVABLE');
    expect(result.entry.expectedAmount).toBe(15000);
    expect(result.entry.customerName).toBe('Empresa ABC Ltda');
    expect(result.entry.salesOrderId).toBe('order-123');
    expect(result.entry.status).toBe('PENDING');
    expect(result.entry.description).toContain('Pedido de venda');
    expect(result.entry.tags).toContain('sales-order');
  });

  it('should create Vendas category if it does not exist', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      salesOrderId: 'order-456',
      totalAmount: 5000,
      dueDate: new Date('2026-05-01'),
      description: 'Test order',
    });

    // Category "Vendas" should have been auto-created
    const vendas = await categoriesRepository.findByName('Vendas', 'tenant-1');
    expect(vendas).toBeDefined();
    expect(vendas!.name).toBe('Vendas');
    expect(vendas!.type).toBe('RECEIVABLE');
  });

  it('should reuse existing Vendas category', async () => {
    // Pre-create the category
    await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Vendas',
      slug: 'vendas',
      type: 'RECEIVABLE',
      color: '#10B981',
    });

    await sut.execute({
      tenantId: 'tenant-1',
      salesOrderId: 'order-789',
      totalAmount: 8000,
      dueDate: new Date('2026-06-01'),
      description: 'Another order',
    });

    // Should still be only 1 category
    const allCategories = await categoriesRepository.findMany('tenant-1');
    const vendasCategories = allCategories.filter((c) => c.name === 'Vendas');
    expect(vendasCategories).toHaveLength(1);
  });

  it('should include customerId when provided', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      salesOrderId: 'order-cust',
      customerId: 'customer-abc',
      customerName: 'Cliente XYZ',
      totalAmount: 3000,
      dueDate: new Date('2026-04-15'),
      description: 'Pedido com cliente',
    });

    expect(result.entry.customerId).toBe('customer-abc');
    expect(result.entry.customerName).toBe('Cliente XYZ');
  });
});
