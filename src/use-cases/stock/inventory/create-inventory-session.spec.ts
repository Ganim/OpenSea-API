import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Item } from '@/entities/stock/item';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';
import { Slug } from '@/entities/stock/value-objects/slug';
import { InMemoryBinsRepository } from '@/repositories/stock/in-memory/in-memory-bins-repository';
import { InMemoryInventorySessionItemsRepository } from '@/repositories/stock/in-memory/in-memory-inventory-session-items-repository';
import { InMemoryInventorySessionsRepository } from '@/repositories/stock/in-memory/in-memory-inventory-sessions-repository';
import { InMemoryItemsRepository } from '@/repositories/stock/in-memory/in-memory-items-repository';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateInventorySessionUseCase } from './create-inventory-session';

let sessionsRepository: InMemoryInventorySessionsRepository;
let sessionItemsRepository: InMemoryInventorySessionItemsRepository;
let itemsRepository: InMemoryItemsRepository;
let binsRepository: InMemoryBinsRepository;
let zonesRepository: InMemoryZonesRepository;
let warehousesRepository: InMemoryWarehousesRepository;
let sut: CreateInventorySessionUseCase;

const TENANT_ID = 'tenant-1';
const USER_ID = new UniqueEntityID().toString();

async function createTestBin(code: string) {
  let warehouse = await warehousesRepository.findByCode('FAB', TENANT_ID);
  if (!warehouse) {
    warehouse = await warehousesRepository.create({
      tenantId: TENANT_ID,
      code: 'FAB',
      name: 'Fábrica',
    });
  }

  let zone = await zonesRepository.findByCode(
    warehouse.warehouseId,
    'EST',
    TENANT_ID,
  );
  if (!zone) {
    zone = await zonesRepository.create({
      tenantId: TENANT_ID,
      warehouseId: warehouse.warehouseId,
      code: 'EST',
      name: 'Estoque',
    });
  }

  const bin = await binsRepository.create({
    tenantId: TENANT_ID,
    zoneId: zone.zoneId,
    address: `FAB-EST-${code}`,
    aisle: 1,
    shelf: 1,
    position: code,
  });

  return { warehouse, zone, bin };
}

function createTestItem(variantId: UniqueEntityID, binId?: UniqueEntityID) {
  const item = Item.create({
    tenantId: new UniqueEntityID(TENANT_ID),
    slug: Slug.createUniqueFromText('test', new UniqueEntityID().toString()),
    fullCode: `001.001.0001.001-${String(Math.random()).slice(2, 7)}`,
    sequentialCode: 1,
    barcode: `BC-${new UniqueEntityID().toString().slice(0, 8)}`,
    eanCode: `EAN-${new UniqueEntityID().toString().slice(0, 8)}`,
    upcCode: `UPC-${new UniqueEntityID().toString().slice(0, 8)}`,
    variantId,
    binId,
    initialQuantity: 10,
    currentQuantity: 10,
    status: ItemStatus.create('AVAILABLE'),
    entryDate: new Date(),
  });
  itemsRepository.items.push(item);
  return item;
}

describe('CreateInventorySessionUseCase', () => {
  beforeEach(() => {
    sessionsRepository = new InMemoryInventorySessionsRepository();
    sessionItemsRepository = new InMemoryInventorySessionItemsRepository();
    itemsRepository = new InMemoryItemsRepository();
    binsRepository = new InMemoryBinsRepository();
    zonesRepository = new InMemoryZonesRepository();
    warehousesRepository = new InMemoryWarehousesRepository();

    sut = new CreateInventorySessionUseCase(
      sessionsRepository,
      sessionItemsRepository,
      itemsRepository,
      binsRepository,
      zonesRepository,
    );
  });

  it('should create a BIN mode session with items', async () => {
    const variantId = new UniqueEntityID();
    const { bin } = await createTestBin('A1');
    const _item1 = createTestItem(variantId, bin.binId);
    const _item2 = createTestItem(variantId, bin.binId);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      userId: USER_ID,
      mode: 'BIN',
      binId: bin.binId.toString(),
    });

    expect(result.session.mode).toBe('BIN');
    expect(result.session.status).toBe('OPEN');
    expect(result.session.totalItems).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].status).toBe('PENDING');
    expect(result.items[0].expectedBinId?.equals(bin.binId)).toBe(true);
  });

  it('should create a ZONE mode session loading items from all bins', async () => {
    const variantId = new UniqueEntityID();
    const { zone, bin: binA } = await createTestBin('A1');
    const { bin: binB } = await createTestBin('B1');
    createTestItem(variantId, binA.binId);
    createTestItem(variantId, binB.binId);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      userId: USER_ID,
      mode: 'ZONE',
      zoneId: zone.zoneId.toString(),
    });

    expect(result.session.mode).toBe('ZONE');
    expect(result.session.totalItems).toBe(2);
    expect(result.items).toHaveLength(2);
  });

  it('should create a PRODUCT mode session with variant items', async () => {
    const variantId = new UniqueEntityID();
    const { bin } = await createTestBin('A1');
    createTestItem(variantId, bin.binId);
    createTestItem(variantId, bin.binId);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      userId: USER_ID,
      mode: 'PRODUCT',
      variantId: variantId.toString(),
    });

    expect(result.session.mode).toBe('PRODUCT');
    expect(result.session.totalItems).toBe(2);
  });

  it('should reject if active session exists for same scope', async () => {
    const { bin } = await createTestBin('A1');

    await sut.execute({
      tenantId: TENANT_ID,
      userId: USER_ID,
      mode: 'BIN',
      binId: bin.binId.toString(),
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        userId: USER_ID,
        mode: 'BIN',
        binId: bin.binId.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject if bin not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        userId: USER_ID,
        mode: 'BIN',
        binId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should reject if zone not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        userId: USER_ID,
        mode: 'ZONE',
        zoneId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should reject if scope ID is missing', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        userId: USER_ID,
        mode: 'BIN',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should create session with 0 items if bin is empty', async () => {
    const { bin } = await createTestBin('EMPTY');

    const result = await sut.execute({
      tenantId: TENANT_ID,
      userId: USER_ID,
      mode: 'BIN',
      binId: bin.binId.toString(),
    });

    expect(result.session.totalItems).toBe(0);
    expect(result.items).toHaveLength(0);
  });
});
