import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FocusNfeConfig } from '@/entities/sales/focus-nfe-config';
import { Order } from '@/entities/sales/order';
import { OrderItem } from '@/entities/sales/order-item';
import type { IFocusNfeProvider } from '@/providers/nfe/focus-nfe.provider';
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
  let focusNfeProvider: IFocusNfeProvider;
  let useCase: IssueInvoiceUseCase;

  const tenantId = 'tenant-123';
  const userId = 'user-123';

  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    orderItemsRepository = new InMemoryOrderItemsRepository();
    customersRepository = new InMemoryCustomersRepository();
    invoicesRepository = new InMemoryInvoicesRepository();
    focusNfeConfigRepository = new InMemoryFocusNfeConfigRepository();
    focusNfeProvider = {
      createInvoice: vi.fn(async () => ({
        id: 'focus-ref-1',
        ref: 'focus-ref-1',
        status: 'autorizado',
        status_code: 200,
        chave_nfe: '35240512345678000190550010000000011234567890',
        numero_nf: 1,
        serie_nf: 1,
        caminho_xml: 'https://example.com/nfce.xml',
        caminho_pdf: 'https://example.com/nfce.pdf',
      })),
      checkStatus: vi.fn(),
      cancelInvoice: vi.fn(),
      testConnection: vi.fn(async () => ({ ok: true, message: 'ok' })),
    };

    useCase = new IssueInvoiceUseCase(
      ordersRepository,
      orderItemsRepository,
      customersRepository,
      invoicesRepository,
      focusNfeConfigRepository,
      focusNfeProvider,
    );
  });

  it('should not issue invoice if order does not exist', async () => {
    await expect(
      useCase.execute({
        orderId: 'non-existent',
        tenantId,
        userId,
      }),
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

    await ordersRepository.create(order);

    await expect(
      useCase.execute({
        orderId: order.id.toString(),
        tenantId,
        userId,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not issue invoice if Focus NFe is not configured', async () => {
    const order = Order.create({
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

    await ordersRepository.create(order);

    await expect(
      useCase.execute({
        orderId: order.id.toString(),
        tenantId,
        userId,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not issue invoice if order has no items', async () => {
    const order = Order.create({
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

    const config = FocusNfeConfig.create({
      tenantId: new UniqueEntityID(tenantId),
      apiKey: 'test-api-key',
      productionMode: false,
      isEnabled: true,
      defaultSeries: '1',
      autoIssueOnConfirm: false,
    });

    await ordersRepository.create(order);
    await focusNfeConfigRepository.create(config);

    await expect(
      useCase.execute({
        orderId: order.id.toString(),
        tenantId,
        userId,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should create invoice with PENDING status on success', async () => {
    const order = Order.create({
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

    const orderItem = OrderItem.create({
      tenantId: new UniqueEntityID(tenantId),
      orderId: order.id,
      name: 'Test Product',
      quantity: 1,
      unitPrice: 100,
      taxIcms: 18,
    });

    const config = FocusNfeConfig.create({
      tenantId: new UniqueEntityID(tenantId),
      apiKey: 'test-api-key',
      productionMode: false,
      isEnabled: true,
      defaultSeries: '1',
      autoIssueOnConfirm: false,
    });

    await ordersRepository.create(order);
    await orderItemsRepository.create(orderItem);
    await focusNfeConfigRepository.create(config);

    await useCase.execute({
      orderId: order.id.toString(),
      tenantId,
      userId,
    });

    const invoices = invoicesRepository.items;
    expect(invoices.length).toBe(1);
    expect(invoices[0].orderId.toString()).toBe(order.id.toString());
    expect(invoices[0].status).toBe('ISSUED');
  });
});
