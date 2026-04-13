import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FocusNfeConfig } from '@/entities/sales/focus-nfe-config';
import { Order } from '@/entities/sales/order';
import { OrderItem } from '@/entities/sales/order-item';
import type { IFocusNfeProvider } from '@/providers/nfe/focus-nfe.provider';
import { InMemoryCompaniesRepository } from '@/repositories/core/in-memory/in-memory-companies-repository';
import { InMemoryCustomersRepository } from '@/repositories/sales/in-memory/in-memory-customers-repository';
import { InMemoryFocusNfeConfigRepository } from '@/repositories/sales/in-memory/in-memory-focus-nfe-config-repository';
import { InMemoryInvoicesRepository } from '@/repositories/sales/in-memory/in-memory-invoices-repository';
import { InMemoryOrderItemsRepository } from '@/repositories/sales/in-memory/in-memory-order-items-repository';
import { InMemoryOrdersRepository } from '@/repositories/sales/in-memory/in-memory-orders-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IssueInvoiceUseCase } from './issue-invoice.use-case';

describe('IssueInvoiceUseCase', () => {
  let ordersRepository: InMemoryOrdersRepository;
  let orderItemsRepository: InMemoryOrderItemsRepository;
  let customersRepository: InMemoryCustomersRepository;
  let invoicesRepository: InMemoryInvoicesRepository;
  let focusNfeConfigRepository: InMemoryFocusNfeConfigRepository;
  let companiesRepository: InMemoryCompaniesRepository;
  let focusNfeProvider: IFocusNfeProvider;
  let companyAddressesRepository: {
    findMany: ReturnType<typeof vi.fn>;
  };
  let sut: IssueInvoiceUseCase;

  const tenantId = 'tenant-123';
  const userId = 'user-123';

  function makeConfirmedOrder() {
    return Order.create({
      tenantId: new UniqueEntityID(tenantId),
      orderNumber: 'ORD-001',
      type: 'ORDER',
      status: 'CONFIRMED',
      customerId: new UniqueEntityID('customer-123'),
      pipelineId: new UniqueEntityID('pipeline-123'),
      stageId: new UniqueEntityID('stage-123'),
      channel: 'WEB',
      subtotal: 100,
      discountTotal: 0,
      taxTotal: 18,
      shippingTotal: 10,
      grandTotal: 128,
      currency: 'BRL',
      creditUsed: 0,
      paidAmount: 0,
      remainingAmount: 128,
      needsApproval: false,
      tags: [],
      stageEnteredAt: new Date(),
      confirmedAt: new Date(),
    });
  }

  function makeFocusConfig() {
    return FocusNfeConfig.create({
      tenantId: new UniqueEntityID(tenantId),
      apiKey: 'test-api-key',
      productionMode: false,
      isEnabled: true,
      defaultSeries: '1',
      autoIssueOnConfirm: false,
    });
  }

  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    orderItemsRepository = new InMemoryOrderItemsRepository();
    customersRepository = new InMemoryCustomersRepository();
    invoicesRepository = new InMemoryInvoicesRepository();
    focusNfeConfigRepository = new InMemoryFocusNfeConfigRepository();
    companiesRepository = new InMemoryCompaniesRepository();

    companyAddressesRepository = {
      findMany: vi.fn().mockResolvedValue({
        addresses: [
          {
            street: 'Rua Teste',
            number: '123',
            district: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            zip: '01234567',
          },
        ],
      }),
    };

    focusNfeProvider = {
      createInvoice: vi.fn().mockResolvedValue({
        id: 'focus-ref-1',
        ref: 'focus-ref-1',
        status: 'autorizado',
        status_code: 200,
        chave_nfe: '35240512345678000190550010000000011234567890',
        numero_nf: 1,
        serie_nf: 1,
        caminho_xml: 'https://example.com/nfce.xml',
        caminho_pdf: 'https://example.com/nfce.pdf',
      }),
      checkStatus: vi.fn(),
      cancelInvoice: vi.fn(),
      testConnection: vi.fn().mockResolvedValue({ ok: true, message: 'ok' }),
    };

    sut = new IssueInvoiceUseCase(
      ordersRepository,
      orderItemsRepository,
      customersRepository,
      invoicesRepository,
      focusNfeConfigRepository,
      focusNfeProvider,
      companiesRepository,
      companyAddressesRepository as any,
    );
  });

  it('should not issue invoice if order does not exist', async () => {
    await expect(
      sut.execute({ orderId: 'non-existent', tenantId, userId }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not issue invoice if order status is not CONFIRMED', async () => {
    const order = Order.create({
      tenantId: new UniqueEntityID(tenantId),
      orderNumber: 'ORD-001',
      type: 'ORDER',
      status: 'DRAFT',
      customerId: new UniqueEntityID('customer-123'),
      pipelineId: new UniqueEntityID('pipeline-123'),
      stageId: new UniqueEntityID('stage-123'),
      channel: 'WEB',
      subtotal: 100,
      discountTotal: 0,
      taxTotal: 18,
      shippingTotal: 10,
      grandTotal: 128,
      currency: 'BRL',
      creditUsed: 0,
      paidAmount: 0,
      remainingAmount: 128,
      needsApproval: false,
      tags: [],
      stageEnteredAt: new Date(),
    });
    ordersRepository.items.push(order);

    await expect(
      sut.execute({ orderId: order.id.toString(), tenantId, userId }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not issue invoice if Focus NFe is not configured', async () => {
    const order = makeConfirmedOrder();
    ordersRepository.items.push(order);

    await expect(
      sut.execute({ orderId: order.id.toString(), tenantId, userId }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not issue invoice if order has no items', async () => {
    const order = makeConfirmedOrder();
    ordersRepository.items.push(order);

    const config = makeFocusConfig();
    focusNfeConfigRepository.items.push(config);

    await expect(
      sut.execute({ orderId: order.id.toString(), tenantId, userId }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should create invoice with ISSUED status on success', async () => {
    const order = makeConfirmedOrder();
    ordersRepository.items.push(order);

    const orderItem = OrderItem.create({
      tenantId: new UniqueEntityID(tenantId),
      orderId: order.id,
      name: 'Test Product',
      quantity: 1,
      unitPrice: 100,
      taxIcms: 18,
    });
    orderItemsRepository.items.push(orderItem);

    const config = makeFocusConfig();
    focusNfeConfigRepository.items.push(config);

    const { Company } = await import('@/entities/core/company');
    const company = Company.create({
      tenantId: new UniqueEntityID(tenantId),
      legalName: 'Empresa Teste LTDA',
      cnpj: '11222333000181',
    });
    companiesRepository.items.push(company);

    const result = await sut.execute({
      orderId: order.id.toString(),
      tenantId,
      userId,
    });

    expect(invoicesRepository.items).toHaveLength(1);
    expect(invoicesRepository.items[0].orderId.toString()).toBe(
      order.id.toString(),
    );
    expect(invoicesRepository.items[0].status).toBe('ISSUED');
    expect(result.accessKey).toBe(
      '35240512345678000190550010000000011234567890',
    );
  });
});
