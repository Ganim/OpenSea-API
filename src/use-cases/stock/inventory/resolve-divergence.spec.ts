import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InventorySession } from '@/entities/stock/inventory-session';
import { InventorySessionItem } from '@/entities/stock/inventory-session-item';
import { Item } from '@/entities/stock/item';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';
import { Slug } from '@/entities/stock/value-objects/slug';
import type { TransactionManager } from '@/lib/transaction-manager';
import { InMemoryInventorySessionItemsRepository } from '@/repositories/stock/in-memory/in-memory-inventory-session-items-repository';
import { InMemoryInventorySessionsRepository } from '@/repositories/stock/in-memory/in-memory-inventory-sessions-repository';
import { InMemoryItemMovementsRepository } from '@/repositories/stock/in-memory/in-memory-item-movements-repository';
import { InMemoryItemsRepository } from '@/repositories/stock/in-memory/in-memory-items-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ResolveDivergenceUseCase } from './resolve-divergence';

const fakeTransactionManager: TransactionManager = {
  run: (fn) => fn(null as never),
};

let sessionsRepository: InMemoryInventorySessionsRepository;
let sessionItemsRepository: InMemoryInventorySessionItemsRepository;
let itemsRepository: InMemoryItemsRepository;
let itemMovementsRepository: InMemoryItemMovementsRepository;
let sut: ResolveDivergenceUseCase;

const TENANT_ID = 'tenant-1';
const USER_ID = new UniqueEntityID().toString();

function createPhysicalItem(binId?: UniqueEntityID) {
  const item = Item.create({
    tenantId: new UniqueEntityID(TENANT_ID),
    slug: Slug.createUniqueFromText('test', new UniqueEntityID().toString()),
    fullCode: `001.001.0001.001-${String(Math.random()).slice(2, 7)}`,
    sequentialCode: 1,
    barcode: `BC-${new UniqueEntityID().toString().slice(0, 8)}`,
    eanCode: `EAN-${new UniqueEntityID().toString().slice(0, 8)}`,
    upcCode: `UPC-${new UniqueEntityID().toString().slice(0, 8)}`,
    variantId: new UniqueEntityID(),
    binId,
    initialQuantity: 10,
    currentQuantity: 10,
    status: ItemStatus.create('AVAILABLE'),
    entryDate: new Date(),
  });
  itemsRepository.items.push(item);
  return item;
}

function createSessionAndDivergentItem(
  divergenceType: 'MISSING' | 'WRONG_BIN' | 'EXTRA',
  physicalItem: Item,
) {
  const session = InventorySession.create({
    tenantId: new UniqueEntityID(TENANT_ID),
    userId: new UniqueEntityID(),
    mode: 'BIN',
    binId: new UniqueEntityID(),
    status: 'OPEN',
  });
  sessionsRepository.sessions.push(session);

  const sessionItem = InventorySessionItem.create({
    sessionId: session.id,
    itemId: physicalItem.id,
    expectedBinId: new UniqueEntityID(),
    status: divergenceType,
  });
  sessionItemsRepository.items.push(sessionItem);

  return { session, sessionItem };
}

describe('ResolveDivergenceUseCase', () => {
  beforeEach(() => {
    sessionsRepository = new InMemoryInventorySessionsRepository();
    sessionItemsRepository = new InMemoryInventorySessionItemsRepository();
    itemsRepository = new InMemoryItemsRepository();
    itemMovementsRepository = new InMemoryItemMovementsRepository();

    sut = new ResolveDivergenceUseCase(
      sessionsRepository,
      sessionItemsRepository,
      itemsRepository,
      itemMovementsRepository,
      fakeTransactionManager,
    );
  });

  it('should resolve MISSING item with LOSS_REGISTERED', async () => {
    const physicalItem = createPhysicalItem();
    const { session, sessionItem } = createSessionAndDivergentItem(
      'MISSING',
      physicalItem,
    );

    const result = await sut.execute({
      tenantId: TENANT_ID,
      sessionId: session.id.toString(),
      sessionItemId: sessionItem.id.toString(),
      resolution: 'LOSS_REGISTERED',
      userId: USER_ID,
    });

    expect(result.sessionItem.resolution).toBe('LOSS_REGISTERED');
    expect(result.sessionItem.isResolved).toBe(true);

    // Check that physical item quantity was zeroed
    const updatedItem = itemsRepository.items.find((i) =>
      i.id.equals(physicalItem.id),
    );
    expect(updatedItem?.currentQuantity).toBe(0);

    // Check movement was created
    expect(itemMovementsRepository.items).toHaveLength(1);
    expect(itemMovementsRepository.items[0].movementType.value).toBe(
      'INVENTORY_ADJUSTMENT',
    );
  });

  it('should resolve WRONG_BIN item with TRANSFERRED', async () => {
    const actualBinId = new UniqueEntityID();
    const physicalItem = createPhysicalItem(actualBinId);
    const { session, sessionItem } = createSessionAndDivergentItem(
      'WRONG_BIN',
      physicalItem,
    );

    const result = await sut.execute({
      tenantId: TENANT_ID,
      sessionId: session.id.toString(),
      sessionItemId: sessionItem.id.toString(),
      resolution: 'TRANSFERRED',
      userId: USER_ID,
    });

    expect(result.sessionItem.resolution).toBe('TRANSFERRED');

    // Check item was transferred to expectedBinId
    const updatedItem = itemsRepository.items.find((i) =>
      i.id.equals(physicalItem.id),
    );
    expect(updatedItem?.binId?.equals(sessionItem.expectedBinId!)).toBe(true);

    // Check transfer movement was created
    expect(itemMovementsRepository.items).toHaveLength(1);
    expect(itemMovementsRepository.items[0].movementType.value).toBe(
      'TRANSFER',
    );
  });

  it('should resolve EXTRA item with ENTRY_CREATED', async () => {
    const physicalItem = createPhysicalItem();
    const { session, sessionItem } = createSessionAndDivergentItem(
      'EXTRA',
      physicalItem,
    );

    const result = await sut.execute({
      tenantId: TENANT_ID,
      sessionId: session.id.toString(),
      sessionItemId: sessionItem.id.toString(),
      resolution: 'ENTRY_CREATED',
      userId: USER_ID,
    });

    expect(result.sessionItem.resolution).toBe('ENTRY_CREATED');
    expect(itemMovementsRepository.items).toHaveLength(1);
    expect(itemMovementsRepository.items[0].movementType.value).toBe(
      'INVENTORY_ADJUSTMENT',
    );
  });

  it('should resolve with PENDING_REVIEW without creating movements', async () => {
    const physicalItem = createPhysicalItem();
    const { session, sessionItem } = createSessionAndDivergentItem(
      'MISSING',
      physicalItem,
    );

    const result = await sut.execute({
      tenantId: TENANT_ID,
      sessionId: session.id.toString(),
      sessionItemId: sessionItem.id.toString(),
      resolution: 'PENDING_REVIEW',
      userId: USER_ID,
    });

    expect(result.sessionItem.resolution).toBe('PENDING_REVIEW');
    expect(itemMovementsRepository.items).toHaveLength(0);
  });

  it('should reject if session not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        sessionId: new UniqueEntityID().toString(),
        sessionItemId: new UniqueEntityID().toString(),
        resolution: 'LOSS_REGISTERED',
        userId: USER_ID,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should reject if session item not found', async () => {
    const session = InventorySession.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      userId: new UniqueEntityID(),
      mode: 'BIN',
      status: 'OPEN',
    });
    sessionsRepository.sessions.push(session);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        sessionId: session.id.toString(),
        sessionItemId: new UniqueEntityID().toString(),
        resolution: 'LOSS_REGISTERED',
        userId: USER_ID,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should reject if item is not divergent', async () => {
    const physicalItem = createPhysicalItem();
    const session = InventorySession.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      userId: new UniqueEntityID(),
      mode: 'BIN',
      status: 'OPEN',
    });
    sessionsRepository.sessions.push(session);

    const sessionItem = InventorySessionItem.create({
      sessionId: session.id,
      itemId: physicalItem.id,
      status: 'CONFIRMED',
    });
    sessionItemsRepository.items.push(sessionItem);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        sessionId: session.id.toString(),
        sessionItemId: sessionItem.id.toString(),
        resolution: 'LOSS_REGISTERED',
        userId: USER_ID,
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
