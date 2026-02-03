import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Item } from '@/entities/stock/item';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';
import { Slug } from '@/entities/stock/value-objects/slug';
import { InMemoryItemReservationsRepository } from '@/repositories/sales/in-memory/in-memory-item-reservations-repository';
import { InMemoryItemsRepository } from '@/repositories/stock/in-memory/in-memory-items-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateItemReservationUseCase } from './create-item-reservation';

let reservationsRepository: InMemoryItemReservationsRepository;
let itemsRepository: InMemoryItemsRepository;
let sut: CreateItemReservationUseCase;
let item: Item;
let userId: UniqueEntityID;

describe('CreateItemReservationUseCase', () => {
  beforeEach(async () => {
    reservationsRepository = new InMemoryItemReservationsRepository();
    itemsRepository = new InMemoryItemsRepository();
    sut = new CreateItemReservationUseCase(
      reservationsRepository,
      itemsRepository,
    );

    userId = new UniqueEntityID();

    // Create test item with 100 units
    item = await itemsRepository.create({
      tenantId: 'tenant-1',
      uniqueCode: 'ITEM-001',
      slug: Slug.createFromText('item-001'),
      fullCode: '001.001.0001.001-00001',
      sequentialCode: 1,
      barcode: 'BC000001',
      eanCode: 'EAN0000000001',
      upcCode: 'UPC000000001',
      variantId: new UniqueEntityID(),
      binId: new UniqueEntityID(),
      initialQuantity: 100,
      currentQuantity: 100,
      status: ItemStatus.create('AVAILABLE'),
      entryDate: new Date(),
      attributes: {},
    });
  });

  it('should be able to create item reservation', async () => {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    const result = await sut.execute({
      tenantId: 'tenant-1',
      itemId: item.id.toString(),
      userId: userId.toString(),
      quantity: 10,
      reason: 'Customer order',
      reference: 'ORD-123',
      expiresAt,
    });

    expect(result.reservation).toBeDefined();
    expect(result.reservation.quantity).toBe(10);
    expect(result.reservation.reason).toBe('Customer order');
    expect(result.reservation.reference).toBe('ORD-123');
    expect(result.reservation.isActive).toBe(true);
  });

  it('should not create reservation with zero quantity', async () => {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        itemId: item.id.toString(),
        userId: userId.toString(),
        quantity: 0,
        expiresAt,
      }),
    ).rejects.toThrow('Quantity must be greater than zero');
  });

  it('should not create reservation with negative quantity', async () => {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        itemId: item.id.toString(),
        userId: userId.toString(),
        quantity: -5,
        expiresAt,
      }),
    ).rejects.toThrow('Quantity must be greater than zero');
  });

  it('should not create reservation with past expiration date', async () => {
    const expiresAt = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        itemId: item.id.toString(),
        userId: userId.toString(),
        quantity: 10,
        expiresAt,
      }),
    ).rejects.toThrow('Expiration date must be in the future');
  });

  it('should not create reservation for nonexistent item', async () => {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        itemId: 'nonexistent-id',
        userId: userId.toString(),
        quantity: 10,
        expiresAt,
      }),
    ).rejects.toThrow('Item not found');
  });

  it('should not create reservation exceeding available quantity', async () => {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        itemId: item.id.toString(),
        userId: userId.toString(),
        quantity: 150, // More than available (100)
        expiresAt,
      }),
    ).rejects.toThrow('Insufficient available quantity');
  });

  it('should account for existing reservations when checking availability', async () => {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create first reservation for 80 units
    await sut.execute({
      tenantId: 'tenant-1',
      itemId: item.id.toString(),
      userId: userId.toString(),
      quantity: 80,
      expiresAt,
    });

    // Try to reserve 30 more (should fail, only 20 available)
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        itemId: item.id.toString(),
        userId: new UniqueEntityID().toString(),
        quantity: 30,
        expiresAt,
      }),
    ).rejects.toThrow('Insufficient available quantity');
  });

  it('should allow reservations up to available quantity', async () => {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Reserve 80 units
    await sut.execute({
      tenantId: 'tenant-1',
      itemId: item.id.toString(),
      userId: userId.toString(),
      quantity: 80,
      expiresAt,
    });

    // Reserve remaining 20 units (should succeed)
    const result = await sut.execute({
      tenantId: 'tenant-1',
      itemId: item.id.toString(),
      userId: new UniqueEntityID().toString(),
      quantity: 20,
      expiresAt,
    });

    expect(result.reservation).toBeDefined();
    expect(result.reservation.quantity).toBe(20);
  });
});
