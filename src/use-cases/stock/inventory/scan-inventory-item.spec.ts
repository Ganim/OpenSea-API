import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InventorySession } from '@/entities/stock/inventory-session';
import { InventorySessionItem } from '@/entities/stock/inventory-session-item';
import { Item } from '@/entities/stock/item';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';
import { Slug } from '@/entities/stock/value-objects/slug';
import { InMemoryInventorySessionItemsRepository } from '@/repositories/stock/in-memory/in-memory-inventory-session-items-repository';
import { InMemoryInventorySessionsRepository } from '@/repositories/stock/in-memory/in-memory-inventory-sessions-repository';
import { InMemoryItemsRepository } from '@/repositories/stock/in-memory/in-memory-items-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ScanInventoryItemUseCase } from './scan-inventory-item';

let sessionsRepository: InMemoryInventorySessionsRepository;
let sessionItemsRepository: InMemoryInventorySessionItemsRepository;
let itemsRepository: InMemoryItemsRepository;
let sut: ScanInventoryItemUseCase;

const TENANT_ID = 'tenant-1';

function createItem(
  overrides: Partial<{ uniqueCode: string; binId: UniqueEntityID }> = {},
) {
  const item = Item.create({
    tenantId: new UniqueEntityID(TENANT_ID),
    uniqueCode:
      overrides.uniqueCode ??
      `CODE-${new UniqueEntityID().toString().slice(0, 6)}`,
    slug: Slug.createUniqueFromText('test', new UniqueEntityID().toString()),
    fullCode: `001.001.0001.001-${String(Math.random()).slice(2, 7)}`,
    sequentialCode: 1,
    barcode: `BC-${new UniqueEntityID().toString().slice(0, 8)}`,
    eanCode: `EAN-${new UniqueEntityID().toString().slice(0, 8)}`,
    upcCode: `UPC-${new UniqueEntityID().toString().slice(0, 8)}`,
    variantId: new UniqueEntityID(),
    binId: overrides.binId,
    initialQuantity: 10,
    currentQuantity: 10,
    status: ItemStatus.create('AVAILABLE'),
    entryDate: new Date(),
  });
  itemsRepository.items.push(item);
  return item;
}

function createSession() {
  const session = InventorySession.create({
    tenantId: new UniqueEntityID(TENANT_ID),
    userId: new UniqueEntityID(),
    mode: 'BIN',
    binId: new UniqueEntityID(),
    status: 'OPEN',
  });
  sessionsRepository.sessions.push(session);
  return session;
}

describe('ScanInventoryItemUseCase', () => {
  beforeEach(() => {
    sessionsRepository = new InMemoryInventorySessionsRepository();
    sessionItemsRepository = new InMemoryInventorySessionItemsRepository();
    itemsRepository = new InMemoryItemsRepository();

    sut = new ScanInventoryItemUseCase(
      sessionsRepository,
      sessionItemsRepository,
      itemsRepository,
    );
  });

  it('should confirm an expected item when scanned', async () => {
    const binId = new UniqueEntityID();
    const item = createItem({ uniqueCode: 'SCAN-001', binId });
    const session = createSession();

    // Add item as expected
    const sessionItem = InventorySessionItem.create({
      sessionId: session.id,
      itemId: item.id,
      expectedBinId: binId,
      status: 'PENDING',
    });
    sessionItemsRepository.items.push(sessionItem);
    session.totalItems = 1;

    const result = await sut.execute({
      tenantId: TENANT_ID,
      sessionId: session.id.toString(),
      scannedCode: 'SCAN-001',
    });

    expect(result.scanResult).toBe('CONFIRMED');
    expect(result.sessionItem.status).toBe('CONFIRMED');
    expect(result.session.confirmedItems).toBe(1);
    expect(result.session.scannedItems).toBe(1);
  });

  it('should mark WRONG_BIN when item is in wrong bin', async () => {
    const expectedBinId = new UniqueEntityID();
    const actualBinId = new UniqueEntityID();
    const item = createItem({ uniqueCode: 'SCAN-002', binId: actualBinId });
    const session = createSession();

    const sessionItem = InventorySessionItem.create({
      sessionId: session.id,
      itemId: item.id,
      expectedBinId: expectedBinId,
      status: 'PENDING',
    });
    sessionItemsRepository.items.push(sessionItem);
    session.totalItems = 1;

    const result = await sut.execute({
      tenantId: TENANT_ID,
      sessionId: session.id.toString(),
      scannedCode: 'SCAN-002',
    });

    expect(result.scanResult).toBe('WRONG_BIN');
    expect(result.sessionItem.status).toBe('WRONG_BIN');
    expect(result.session.divergentItems).toBe(1);
  });

  it('should create EXTRA item when scanned item is not in session', async () => {
    const item = createItem({ uniqueCode: 'SCAN-003' });
    const session = createSession();

    const result = await sut.execute({
      tenantId: TENANT_ID,
      sessionId: session.id.toString(),
      scannedCode: 'SCAN-003',
    });

    expect(result.scanResult).toBe('EXTRA');
    expect(result.sessionItem.status).toBe('EXTRA');
    expect(result.session.divergentItems).toBe(1);
  });

  it('should reject if session not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        sessionId: new UniqueEntityID().toString(),
        scannedCode: 'anything',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should reject if session is not open', async () => {
    const session = createSession();
    session.pause();

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        sessionId: session.id.toString(),
        scannedCode: 'anything',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject if item not found by code', async () => {
    const session = createSession();

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        sessionId: session.id.toString(),
        scannedCode: 'NONEXISTENT',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should reject if item already confirmed', async () => {
    const binId = new UniqueEntityID();
    const item = createItem({ uniqueCode: 'SCAN-DUP', binId });
    const session = createSession();

    const sessionItem = InventorySessionItem.create({
      sessionId: session.id,
      itemId: item.id,
      expectedBinId: binId,
      status: 'CONFIRMED',
    });
    sessionItemsRepository.items.push(sessionItem);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        sessionId: session.id.toString(),
        scannedCode: 'SCAN-DUP',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
