import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Bin } from '@/entities/stock/bin';
import { Item } from '@/entities/stock/item';
import { Slug } from '@/entities/stock/value-objects/slug';
import { ZoneStructure } from '@/entities/stock/value-objects/zone-structure';
import { Variant } from '@/entities/stock/variant';
import { Zone } from '@/entities/stock/zone';
import { Customer } from '@/entities/sales/customer';
import { CustomerType } from '@/entities/sales/value-objects/customer-type';
import { PosTerminalOperator } from '@/entities/sales/pos-terminal-operator';
import { Pipeline } from '@/entities/sales/pipeline';
import { PipelineStage } from '@/entities/sales/pipeline-stage';
import { InMemoryTransactionManager } from '@/lib/in-memory-transaction-manager';
import { InMemoryCustomersRepository } from '@/repositories/sales/in-memory/in-memory-customers-repository';
import { InMemoryOrderItemsRepository } from '@/repositories/sales/in-memory/in-memory-order-items-repository';
import { InMemoryOrdersRepository } from '@/repositories/sales/in-memory/in-memory-orders-repository';
import { InMemoryPipelineStagesRepository } from '@/repositories/sales/in-memory/in-memory-pipeline-stages-repository';
import { InMemoryPipelinesRepository } from '@/repositories/sales/in-memory/in-memory-pipelines-repository';
import { InMemoryPosOrderConflictsRepository } from '@/repositories/sales/in-memory/in-memory-pos-order-conflicts-repository';
import { InMemoryPosTerminalOperatorsRepository } from '@/repositories/sales/in-memory/in-memory-pos-terminal-operators-repository';
import { InMemoryBinsRepository } from '@/repositories/stock/in-memory/in-memory-bins-repository';
import { InMemoryItemsRepository } from '@/repositories/stock/in-memory/in-memory-items-repository';
import { InMemoryVariantsRepository } from '@/repositories/stock/in-memory/in-memory-variants-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { CreateOrderUseCase } from '../orders/create-order';
import {
  type CreateSaleFromTerminalCartLine,
  type CreateSaleFromTerminalRequest,
  CreateSaleFromTerminalUseCase,
} from './create-sale-from-terminal';

let ordersRepository: InMemoryOrdersRepository;
let orderItemsRepository: InMemoryOrderItemsRepository;
let posTerminalOperatorsRepository: InMemoryPosTerminalOperatorsRepository;
let posOrderConflictsRepository: InMemoryPosOrderConflictsRepository;
let itemsRepository: InMemoryItemsRepository;
let variantsRepository: InMemoryVariantsRepository;
let binsRepository: InMemoryBinsRepository;
let zonesRepository: InMemoryZonesRepository;
let customersRepository: InMemoryCustomersRepository;
let pipelinesRepository: InMemoryPipelinesRepository;
let pipelineStagesRepository: InMemoryPipelineStagesRepository;
let transactionManager: InMemoryTransactionManager;
let createOrderUseCase: CreateOrderUseCase;
let sut: CreateSaleFromTerminalUseCase;

const tenantId = 'tenant-create-sale';
const posTerminalId = '11111111-1111-4111-8111-111111111111';
const posSessionId = '22222222-2222-4222-8222-222222222222';
const operatorEmployeeId = '33333333-3333-4333-8333-333333333333';

interface SeedScenarioOptions {
  itemQuantity?: number;
  itemFractionalSaleEnabled?: boolean;
  variantFractionalAllowed?: boolean;
  zoneAllowsFractionalSale?: boolean;
  zoneMinFractionalSale?: number | null;
  withActiveOperator?: boolean;
}

interface SeededWorld {
  itemId: string;
  variantId: string;
  binId: string;
  zoneId: string;
  customerId: string;
}

function buildBaseRequest(
  cart: CreateSaleFromTerminalCartLine[],
  saleLocalUuid = 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001',
): CreateSaleFromTerminalRequest {
  return {
    tenantId,
    posTerminalId,
    saleLocalUuid,
    posSessionId,
    posOperatorEmployeeId: operatorEmployeeId,
    cart,
    payments: [{ method: 'CASH', amount: 100 }],
    customerData: { kind: 'ANONYMOUS' },
    createdAt: new Date('2026-04-25T10:00:00Z'),
  };
}

async function seedScenario(
  options: SeedScenarioOptions = {},
): Promise<SeededWorld> {
  const itemQuantity = options.itemQuantity ?? 10;
  const itemFractionalSaleEnabled = options.itemFractionalSaleEnabled ?? true;
  const variantFractionalAllowed = options.variantFractionalAllowed ?? true;
  const zoneAllowsFractionalSale = options.zoneAllowsFractionalSale ?? true;
  const zoneMinFractionalSale = options.zoneMinFractionalSale ?? null;
  const withActiveOperator = options.withActiveOperator ?? true;

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

  const systemCustomer = Customer.create({
    tenantId: tenantUniqueId,
    name: 'Consumidor Final',
    type: CustomerType.create('INDIVIDUAL'),
    isSystem: true,
  });
  customersRepository.items.push(systemCustomer);

  const zone = Zone.create({
    tenantId: tenantUniqueId,
    warehouseId: new UniqueEntityID('55555555-5555-4555-8555-555555555555'),
    code: 'PDV',
    name: 'PDV Floor',
    description: null,
    structure: ZoneStructure.create({}),
    allowsFractionalSale: zoneAllowsFractionalSale,
    minFractionalSale: zoneMinFractionalSale,
  });
  zonesRepository.zones.push(zone);

  const bin = Bin.create({
    tenantId: tenantUniqueId,
    zoneId: zone.zoneId,
    address: 'A.1.1',
    aisle: 1,
    shelf: 1,
    position: '1',
    capacity: 100,
  });
  binsRepository.bins.push(bin);

  const variant = Variant.create({
    tenantId: tenantUniqueId,
    productId: new UniqueEntityID(),
    slug: Slug.createFromText('test-variant'),
    fullCode: '001.000.0001.001',
    sequentialCode: 1,
    sku: 'SKU-TEST-001',
    name: 'Test Variant',
    price: 50,
    attributes: {},
    barcode: 'BC0000000001',
    eanCode: '7891000000017',
    upcCode: '012345678905',
    fractionalAllowed: variantFractionalAllowed,
  });
  variantsRepository.items.push(variant);

  const item = Item.create({
    tenantId: tenantUniqueId,
    variantId: variant.id,
    binId: bin.binId,
    slug: Slug.createFromText('test-item'),
    fullCode: '001.000.0001.001-00001',
    sequentialCode: 1,
    barcode: 'BC0000000002',
    eanCode: '7891000000024',
    upcCode: '012345678906',
    initialQuantity: itemQuantity,
    currentQuantity: itemQuantity,
    fractionalSaleEnabled: itemFractionalSaleEnabled,
  });
  itemsRepository.items.push(item);

  if (withActiveOperator) {
    const operatorLink = PosTerminalOperator.create({
      terminalId: new UniqueEntityID(posTerminalId),
      employeeId: new UniqueEntityID(operatorEmployeeId),
      tenantId,
      assignedByUserId: new UniqueEntityID(),
    });
    posTerminalOperatorsRepository.items.push(operatorLink);
  }

  return {
    itemId: item.id.toString(),
    variantId: variant.id.toString(),
    binId: bin.binId.toString(),
    zoneId: zone.zoneId.toString(),
    customerId: systemCustomer.id.toString(),
  };
}

describe('Create Sale From Terminal Use Case', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    orderItemsRepository = new InMemoryOrderItemsRepository();
    posTerminalOperatorsRepository =
      new InMemoryPosTerminalOperatorsRepository();
    posOrderConflictsRepository = new InMemoryPosOrderConflictsRepository();
    itemsRepository = new InMemoryItemsRepository();
    variantsRepository = new InMemoryVariantsRepository();
    binsRepository = new InMemoryBinsRepository();
    zonesRepository = new InMemoryZonesRepository();
    customersRepository = new InMemoryCustomersRepository();
    pipelinesRepository = new InMemoryPipelinesRepository();
    pipelineStagesRepository = new InMemoryPipelineStagesRepository();
    transactionManager = new InMemoryTransactionManager();

    createOrderUseCase = new CreateOrderUseCase(
      ordersRepository,
      orderItemsRepository,
      customersRepository,
      pipelinesRepository,
      pipelineStagesRepository,
    );

    sut = new CreateSaleFromTerminalUseCase(
      ordersRepository,
      posTerminalOperatorsRepository,
      posOrderConflictsRepository,
      itemsRepository,
      variantsRepository,
      binsRepository,
      zonesRepository,
      customersRepository,
      pipelinesRepository,
      pipelineStagesRepository,
      createOrderUseCase,
      transactionManager,
    );
  });

  it('confirma a venda quando carrinho e estoque estão consistentes', async () => {
    const world = await seedScenario({ itemQuantity: 10 });

    const result = await sut.execute(
      buildBaseRequest([
        {
          itemId: world.itemId,
          variantId: world.variantId,
          name: 'Test Variant',
          quantity: 2,
          unitPrice: 50,
        },
      ]),
    );

    expect(result.status).toBe('confirmed');
    if (result.status !== 'confirmed') return;
    expect(result.order.originSource).toBe('POS_DESKTOP');
    expect(result.order.posTerminalId).toBe(posTerminalId);
    expect(result.order.posSessionId).toBe(posSessionId);
    expect(result.order.posOperatorEmployeeId).toBe(operatorEmployeeId);
    expect(result.order.saleLocalUuid).toBe(
      'aaaaaaaa-aaaa-4aaa-8aaa-000000000001',
    );
    expect(result.order.subtotal).toBe(100);
    expect(result.order.paidAmount).toBe(100);
    expect(ordersRepository.items).toHaveLength(1);
    expect(itemsRepository.items[0].currentQuantity).toBe(8);
    expect(posOrderConflictsRepository.items).toHaveLength(0);
  });

  it('é idempotente — uma 2ª chamada com o mesmo saleLocalUuid retorna already_synced sem duplicar a Order', async () => {
    const world = await seedScenario({ itemQuantity: 10 });
    const cart: CreateSaleFromTerminalCartLine[] = [
      {
        itemId: world.itemId,
        variantId: world.variantId,
        name: 'Test Variant',
        quantity: 1,
        unitPrice: 50,
      },
    ];

    const firstResult = await sut.execute(buildBaseRequest(cart));
    expect(firstResult.status).toBe('confirmed');
    if (firstResult.status !== 'confirmed') return;
    const firstOrderId = firstResult.order.id;

    const secondResult = await sut.execute(buildBaseRequest(cart));
    expect(secondResult.status).toBe('already_synced');
    if (secondResult.status !== 'already_synced') return;
    expect(secondResult.order.id).toBe(firstOrderId);
    expect(ordersRepository.items).toHaveLength(1);
    // Stock decremented exactly once.
    expect(itemsRepository.items[0].currentQuantity).toBe(9);
  });

  it('detecta conflito de estoque, registra PosOrderConflict e não decrementa', async () => {
    const world = await seedScenario({ itemQuantity: 1 });

    const result = await sut.execute(
      buildBaseRequest([
        {
          itemId: world.itemId,
          variantId: world.variantId,
          name: 'Test Variant',
          quantity: 5,
          unitPrice: 50,
        },
      ]),
    );

    expect(result.status).toBe('conflict');
    if (result.status !== 'conflict') return;
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].reason).toBe('INSUFFICIENT_STOCK');
    expect(result.conflicts[0].requestedQuantity).toBe(5);
    expect(result.conflicts[0].availableQuantity).toBe(1);
    expect(result.conflicts[0].shortage).toBe(4);
    expect(posOrderConflictsRepository.items).toHaveLength(1);
    expect(posOrderConflictsRepository.items[0].saleLocalUuid).toBe(
      'aaaaaaaa-aaaa-4aaa-8aaa-000000000001',
    );
    // Stock untouched, no Order created.
    expect(itemsRepository.items[0].currentQuantity).toBe(1);
    expect(ordersRepository.items).toHaveLength(0);
  });

  it('detecta FRACTIONAL_NOT_ALLOWED quando a zona não permite venda fracionada', async () => {
    const world = await seedScenario({
      itemQuantity: 10,
      zoneAllowsFractionalSale: false,
    });

    const result = await sut.execute(
      buildBaseRequest([
        {
          itemId: world.itemId,
          variantId: world.variantId,
          name: 'Test Variant',
          quantity: 0.5,
          unitPrice: 50,
        },
      ]),
    );

    expect(result.status).toBe('conflict');
    if (result.status !== 'conflict') return;
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].reason).toBe('FRACTIONAL_NOT_ALLOWED');
    expect(itemsRepository.items[0].currentQuantity).toBe(10);
  });

  it('detecta BELOW_MIN_FRACTIONAL_SALE quando a quantidade está abaixo do mínimo da zona', async () => {
    const world = await seedScenario({
      itemQuantity: 10,
      zoneAllowsFractionalSale: true,
      zoneMinFractionalSale: 1.0,
    });

    const result = await sut.execute(
      buildBaseRequest([
        {
          itemId: world.itemId,
          variantId: world.variantId,
          name: 'Test Variant',
          quantity: 0.5,
          unitPrice: 50,
        },
      ]),
    );

    expect(result.status).toBe('conflict');
    if (result.status !== 'conflict') return;
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].reason).toBe('BELOW_MIN_FRACTIONAL_SALE');
  });

  it('lança UnauthorizedError quando o operador não está vinculado ao terminal', async () => {
    const world = await seedScenario({
      itemQuantity: 10,
      withActiveOperator: false,
    });

    await expect(() =>
      sut.execute(
        buildBaseRequest([
          {
            itemId: world.itemId,
            variantId: world.variantId,
            name: 'Test Variant',
            quantity: 1,
            unitPrice: 50,
          },
        ]),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedError);

    expect(ordersRepository.items).toHaveLength(0);
    expect(itemsRepository.items[0].currentQuantity).toBe(10);
  });

  it('lança UnauthorizedError quando o vínculo do operador foi revogado', async () => {
    const world = await seedScenario({ itemQuantity: 10 });
    posTerminalOperatorsRepository.items[0].revoke(new UniqueEntityID());

    await expect(() =>
      sut.execute(
        buildBaseRequest([
          {
            itemId: world.itemId,
            variantId: world.variantId,
            name: 'Test Variant',
            quantity: 1,
            unitPrice: 50,
          },
        ]),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('reporta ITEM_NOT_FOUND quando a linha referencia um item inexistente', async () => {
    await seedScenario({ itemQuantity: 10 });

    const result = await sut.execute(
      buildBaseRequest([
        {
          itemId: '00000000-0000-4000-8000-000000000099',
          variantId: '00000000-0000-4000-8000-000000000098',
          name: 'Phantom Item',
          quantity: 1,
          unitPrice: 50,
        },
      ]),
    );

    expect(result.status).toBe('conflict');
    if (result.status !== 'conflict') return;
    expect(result.conflicts[0].reason).toBe('ITEM_NOT_FOUND');
  });
});
