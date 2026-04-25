import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Customer } from '@/entities/sales/customer';
import { Pipeline } from '@/entities/sales/pipeline';
import { PipelineStage } from '@/entities/sales/pipeline-stage';
import {
  PosOrderConflict,
  type ConflictDetail,
  type OriginalCartLine,
  type OriginalCustomerData,
  type OriginalPayment,
} from '@/entities/sales/pos-order-conflict';
import { PosOrderConflictStatus } from '@/entities/sales/value-objects/pos-order-conflict-status';
import { CustomerType } from '@/entities/sales/value-objects/customer-type';
import { Item } from '@/entities/stock/item';
import { Slug } from '@/entities/stock/value-objects/slug';
import { InMemoryCustomersRepository } from '@/repositories/sales/in-memory/in-memory-customers-repository';
import { InMemoryOrderItemsRepository } from '@/repositories/sales/in-memory/in-memory-order-items-repository';
import { InMemoryOrdersRepository } from '@/repositories/sales/in-memory/in-memory-orders-repository';
import { InMemoryPipelineStagesRepository } from '@/repositories/sales/in-memory/in-memory-pipeline-stages-repository';
import { InMemoryPipelinesRepository } from '@/repositories/sales/in-memory/in-memory-pipelines-repository';
import { InMemoryPosOrderConflictsRepository } from '@/repositories/sales/in-memory/in-memory-pos-order-conflicts-repository';
import { InMemoryItemMovementsRepository } from '@/repositories/stock/in-memory/in-memory-item-movements-repository';
import { InMemoryItemsRepository } from '@/repositories/stock/in-memory/in-memory-items-repository';
import { CreateOrderUseCase } from '../orders/create-order';
import { ResolveConflictManuallyUseCase } from './resolve-conflict-manually';

let posOrderConflictsRepository: InMemoryPosOrderConflictsRepository;
let ordersRepository: InMemoryOrdersRepository;
let orderItemsRepository: InMemoryOrderItemsRepository;
let itemsRepository: InMemoryItemsRepository;
let itemMovementsRepository: InMemoryItemMovementsRepository;
let customersRepository: InMemoryCustomersRepository;
let pipelinesRepository: InMemoryPipelinesRepository;
let pipelineStagesRepository: InMemoryPipelineStagesRepository;
let createOrderUseCase: CreateOrderUseCase;
let sut: ResolveConflictManuallyUseCase;

const tenantId = 'tenant-resolve-conflict';
const otherTenantId = 'tenant-other';
const resolverUserId = '99999999-9999-4999-8999-999999999999';
const posTerminalId = '11111111-1111-4111-8111-111111111111';
const posSessionId = '22222222-2222-4222-8222-222222222222';
const operatorEmployeeId = '33333333-3333-4333-8333-333333333333';

interface SeedConflictOptions {
  /** Whether the snapshot fields are persisted. Defaults to true. */
  withOriginalSnapshot?: boolean;
  /** Customer kind embedded in the snapshot. Defaults to ANONYMOUS. */
  customerKind?: 'EXISTING' | 'CPF_ONLY' | 'ANONYMOUS';
  /** Status to seed the conflict with. Defaults to PENDING_RESOLUTION. */
  status?: PosOrderConflictStatus;
  /** Override the conflict reasons. Defaults to a single INSUFFICIENT_STOCK shortage. */
  reasons?: ConflictDetail[];
}

interface SeededWorld {
  conflict: PosOrderConflict;
  conflictingItem: Item;
  pipelineId: string;
  stageId: string;
  systemDefaultCustomerId: string;
}

function seedPdvPipeline(): { pipelineId: string; stageId: string } {
  const tenantUniqueId = new UniqueEntityID(tenantId);

  const pipeline = Pipeline.create(
    {
      tenantId: tenantUniqueId,
      name: 'PDV',
      type: 'SALES',
    },
    new UniqueEntityID('44444444-4444-4444-8444-444444444444'),
  );
  pipelinesRepository.items.push(pipeline);

  const stage = PipelineStage.create({
    pipelineId: pipeline.id,
    name: 'Aberto',
    type: 'OPEN',
    position: 0,
  });
  pipelineStagesRepository.items.push(stage);

  return {
    pipelineId: pipeline.id.toString(),
    stageId: stage.id.toString(),
  };
}

function seedSystemCustomer(): string {
  const tenantUniqueId = new UniqueEntityID(tenantId);
  const systemCustomer = Customer.create({
    tenantId: tenantUniqueId,
    name: 'Consumidor Final',
    type: CustomerType.create('INDIVIDUAL'),
    isSystem: true,
  });
  customersRepository.items.push(systemCustomer);
  return systemCustomer.id.toString();
}

function seedItem(options: {
  initialQuantity: number;
  variantId?: string;
}): Item {
  const tenantUniqueId = new UniqueEntityID(tenantId);
  const variantId = options.variantId
    ? new UniqueEntityID(options.variantId)
    : new UniqueEntityID();

  const item = Item.create({
    tenantId: tenantUniqueId,
    variantId,
    slug: Slug.createFromText(`item-${itemsRepository.items.length}`),
    fullCode: `001.000.0001.${(itemsRepository.items.length + 1)
      .toString()
      .padStart(3, '0')}-00001`,
    sequentialCode: 1,
    barcode: `BC${(itemsRepository.items.length + 1)
      .toString()
      .padStart(10, '0')}`,
    eanCode: `7891000${(itemsRepository.items.length + 100)
      .toString()
      .padStart(6, '0')}`,
    upcCode: `01234567${(itemsRepository.items.length + 1000).toString().padStart(4, '0')}`,
    initialQuantity: options.initialQuantity,
    currentQuantity: options.initialQuantity,
    fractionalSaleEnabled: true,
  });
  itemsRepository.items.push(item);
  return item;
}

async function seedConflictWorld(
  options: SeedConflictOptions = {},
): Promise<SeededWorld> {
  const withOriginalSnapshot = options.withOriginalSnapshot ?? true;
  const customerKind = options.customerKind ?? 'ANONYMOUS';

  const { pipelineId, stageId } = seedPdvPipeline();
  const systemDefaultCustomerId = seedSystemCustomer();

  // The item the terminal targeted (currently empty stock — the conflict
  // happened because the terminal asked for 5 but only 0 were on hand).
  const conflictingItem = seedItem({ initialQuantity: 0 });

  const reasons: ConflictDetail[] = options.reasons ?? [
    {
      itemId: conflictingItem.id.toString(),
      variantId: conflictingItem.variantId.toString(),
      requestedQuantity: 5,
      availableQuantity: 0,
      shortage: 5,
      reason: 'INSUFFICIENT_STOCK',
    },
  ];

  const cart: OriginalCartLine[] = reasons.map((detail) => ({
    itemId: detail.itemId,
    variantId: detail.variantId,
    name: 'Produto Conflitante',
    quantity: detail.requestedQuantity,
    unitPrice: 50,
  }));

  const payments: OriginalPayment[] = [{ method: 'CASH', amount: 250 }];

  let customerData: OriginalCustomerData;
  switch (customerKind) {
    case 'ANONYMOUS':
      customerData = { kind: 'ANONYMOUS' };
      break;
    case 'CPF_ONLY':
      customerData = { kind: 'CPF_ONLY', cpf: '00000000000' };
      break;
    case 'EXISTING':
      customerData = { kind: 'EXISTING', customerId: systemDefaultCustomerId };
      break;
  }

  const conflict = PosOrderConflict.create({
    tenantId,
    saleLocalUuid: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001',
    posTerminalId,
    posSessionId,
    posOperatorEmployeeId: operatorEmployeeId,
    status: options.status ?? PosOrderConflictStatus.PENDING_RESOLUTION(),
    conflictDetails: reasons,
    originalCart: withOriginalSnapshot ? cart : null,
    originalPayments: withOriginalSnapshot ? payments : null,
    originalCustomerData: withOriginalSnapshot ? customerData : null,
  });
  posOrderConflictsRepository.items.push(conflict);

  return {
    conflict,
    conflictingItem,
    pipelineId,
    stageId,
    systemDefaultCustomerId,
  };
}

describe('Resolve Conflict Manually Use Case', () => {
  beforeEach(() => {
    posOrderConflictsRepository = new InMemoryPosOrderConflictsRepository();
    ordersRepository = new InMemoryOrdersRepository();
    orderItemsRepository = new InMemoryOrderItemsRepository();
    itemsRepository = new InMemoryItemsRepository();
    itemMovementsRepository = new InMemoryItemMovementsRepository();
    customersRepository = new InMemoryCustomersRepository();
    pipelinesRepository = new InMemoryPipelinesRepository();
    pipelineStagesRepository = new InMemoryPipelineStagesRepository();

    createOrderUseCase = new CreateOrderUseCase(
      ordersRepository,
      orderItemsRepository,
      customersRepository,
      pipelinesRepository,
      pipelineStagesRepository,
    );

    sut = new ResolveConflictManuallyUseCase(
      posOrderConflictsRepository,
      ordersRepository,
      itemsRepository,
      itemMovementsRepository,
      customersRepository,
      pipelinesRepository,
      pipelineStagesRepository,
      createOrderUseCase,
    );
  });

  it('rejeita resolução de conflito de outro tenant com ResourceNotFoundError', async () => {
    const { conflict } = await seedConflictWorld();

    await expect(
      sut.execute({
        tenantId: otherTenantId,
        conflictId: conflict.id.toString(),
        resolvedByUserId: resolverUserId,
        action: 'CANCEL_AND_REFUND',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('rejeita resolução de conflito já resolvido (status diferente de PENDING_RESOLUTION) com BadRequestError', async () => {
    const { conflict } = await seedConflictWorld({
      status: PosOrderConflictStatus.CANCELED_REFUNDED(),
    });

    await expect(
      sut.execute({
        tenantId,
        conflictId: conflict.id.toString(),
        resolvedByUserId: resolverUserId,
        action: 'CANCEL_AND_REFUND',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('CANCEL_AND_REFUND: cria Order CANCELLED, marca conflito CANCELED_REFUNDED, NÃO mexe em estoque', async () => {
    const { conflict, conflictingItem } = await seedConflictWorld();

    const beforeQuantity = conflictingItem.currentQuantity;
    const result = await sut.execute({
      tenantId,
      conflictId: conflict.id.toString(),
      resolvedByUserId: resolverUserId,
      action: 'CANCEL_AND_REFUND',
      notes: 'Cliente desistiu',
    });

    expect(result.conflict.status).toBe('CANCELED_REFUNDED');
    expect(result.conflict.resolvedByUserId).toBe(resolverUserId);
    expect(result.conflict.resolvedAt).not.toBeNull();
    expect(result.conflict.orderId).toBe(result.order.id);

    expect(result.order.status).toBe('CANCELLED');
    expect(result.order.cancelledAt).not.toBeNull();
    expect(result.order.cancelReason).toContain('Cliente desistiu');
    expect(result.order.originSource).toBe('POS_DESKTOP');
    expect(result.order.posTerminalId).toBe(posTerminalId);

    expect(ordersRepository.items).toHaveLength(1);
    expect(itemsRepository.items[0].currentQuantity).toBe(beforeQuantity);
    expect(itemMovementsRepository.items).toHaveLength(0);
  });

  it('CANCEL_AND_REFUND: rejeita quando o conflito legado não tem o snapshot da venda persistido', async () => {
    const { conflict } = await seedConflictWorld({
      withOriginalSnapshot: false,
    });

    await expect(
      sut.execute({
        tenantId,
        conflictId: conflict.id.toString(),
        resolvedByUserId: resolverUserId,
        action: 'CANCEL_AND_REFUND',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('FORCE_ADJUSTMENT: ajusta estoque, cria ItemMovement INVENTORY_ADJUSTMENT e Order CONFIRMED', async () => {
    const { conflict, conflictingItem } = await seedConflictWorld();

    const result = await sut.execute({
      tenantId,
      conflictId: conflict.id.toString(),
      resolvedByUserId: resolverUserId,
      action: 'FORCE_ADJUSTMENT',
      notes: 'Estoque físico confere',
    });

    expect(result.conflict.status).toBe('FORCED_ADJUSTMENT');
    expect(result.order.status).toBe('CONFIRMED');
    expect(result.order.confirmedAt).not.toBeNull();
    expect(result.order.paidAmount).toBe(250);
    expect(result.order.originSource).toBe('POS_DESKTOP');

    // The item received a +5 adjustment then a -5 decrement → ends at 0.
    const finalItem = itemsRepository.items.find(
      (item) => item.id.toString() === conflictingItem.id.toString(),
    );
    expect(finalItem?.currentQuantity).toBe(0);

    expect(itemMovementsRepository.items).toHaveLength(1);
    const movement = itemMovementsRepository.items[0];
    expect(movement.movementType.value).toBe('INVENTORY_ADJUSTMENT');
    expect(movement.quantity).toBe(5);
    expect(movement.quantityBefore).toBe(0);
    expect(movement.quantityAfter).toBe(5);
    expect(movement.reasonCode).toBe('POS_CONFLICT_FORCE_ADJUSTMENT');
  });

  it('FORCE_ADJUSTMENT: NÃO cria ItemMovement quando a razão do conflito é regra de fracionamento', async () => {
    const fractionalRuleItem = seedItem({ initialQuantity: 10 });

    const { conflict } = await seedConflictWorld({
      reasons: [
        {
          itemId: fractionalRuleItem.id.toString(),
          variantId: fractionalRuleItem.variantId.toString(),
          requestedQuantity: 0.5,
          availableQuantity: 10,
          shortage: 0,
          reason: 'FRACTIONAL_NOT_ALLOWED',
        },
      ],
    });

    const result = await sut.execute({
      tenantId,
      conflictId: conflict.id.toString(),
      resolvedByUserId: resolverUserId,
      action: 'FORCE_ADJUSTMENT',
    });

    expect(result.conflict.status).toBe('FORCED_ADJUSTMENT');
    expect(itemMovementsRepository.items).toHaveLength(0);
    // Stock is decremented by the requested quantity even without an
    // adjustment movement (because there was enough on hand to begin with).
    const item = itemsRepository.items.find(
      (i) => i.id.toString() === fractionalRuleItem.id.toString(),
    );
    expect(item?.currentQuantity).toBe(9.5);
  });

  it('SUBSTITUTE_ITEM: cria Order CONFIRMED com itens substituídos e decrementa o estoque do substituto', async () => {
    const { conflict, conflictingItem } = await seedConflictWorld();
    const substituteItem = seedItem({ initialQuantity: 10 });

    const result = await sut.execute({
      tenantId,
      conflictId: conflict.id.toString(),
      resolvedByUserId: resolverUserId,
      action: 'SUBSTITUTE_ITEM',
      substituteItemIds: [substituteItem.id.toString()],
    });

    expect(result.conflict.status).toBe('ITEM_SUBSTITUTED_MANUAL');
    expect(result.order.status).toBe('CONFIRMED');

    // Conflicting item is untouched (substitute took its place).
    const conflictingItemAfter = itemsRepository.items.find(
      (item) => item.id.toString() === conflictingItem.id.toString(),
    );
    expect(conflictingItemAfter?.currentQuantity).toBe(0);

    const substituteItemAfter = itemsRepository.items.find(
      (item) => item.id.toString() === substituteItem.id.toString(),
    );
    expect(substituteItemAfter?.currentQuantity).toBe(5);
  });

  it('SUBSTITUTE_ITEM: rejeita quando o número de substituteItemIds não bate com o número de conflitos', async () => {
    const { conflict } = await seedConflictWorld();

    await expect(
      sut.execute({
        tenantId,
        conflictId: conflict.id.toString(),
        resolvedByUserId: resolverUserId,
        action: 'SUBSTITUTE_ITEM',
        substituteItemIds: [], // 1 conflict in seed but 0 substitutes
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('SUBSTITUTE_ITEM: rejeita quando o item substituto não tem estoque suficiente', async () => {
    const { conflict } = await seedConflictWorld();
    const lowStockSubstitute = seedItem({ initialQuantity: 1 });

    await expect(
      sut.execute({
        tenantId,
        conflictId: conflict.id.toString(),
        resolvedByUserId: resolverUserId,
        action: 'SUBSTITUTE_ITEM',
        substituteItemIds: [lowStockSubstitute.id.toString()],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
