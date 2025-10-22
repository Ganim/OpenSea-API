import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { MovementType } from '@/entities/stock/value-objects/movement-type';
import { InMemoryItemMovementsRepository } from '@/repositories/stock/in-memory/in-memory-item-movements-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListItemMovementsUseCase } from './list-item-movements';

let itemMovementsRepository: InMemoryItemMovementsRepository;
let listItemMovements: ListItemMovementsUseCase;

describe('ListItemMovementsUseCase', () => {
  beforeEach(() => {
    itemMovementsRepository = new InMemoryItemMovementsRepository();
    listItemMovements = new ListItemMovementsUseCase(itemMovementsRepository);
  });

  it('should list movements by item', async () => {
    const itemId = new UniqueEntityID();
    const userId = new UniqueEntityID();

    await itemMovementsRepository.create({
      itemId,
      userId,
      quantity: 10,
      quantityBefore: 0,
      quantityAfter: 10,
      movementType: MovementType.create('PRODUCTION'),
    });

    await itemMovementsRepository.create({
      itemId,
      userId,
      quantity: 5,
      quantityBefore: 10,
      quantityAfter: 5,
      movementType: MovementType.create('SALE'),
    });

    // Create movement for different item
    await itemMovementsRepository.create({
      itemId: new UniqueEntityID(),
      userId,
      quantity: 3,
      quantityBefore: 0,
      quantityAfter: 3,
      movementType: MovementType.create('PRODUCTION'),
    });

    const result = await listItemMovements.execute({
      itemId: itemId.toString(),
    });

    expect(result.movements).toHaveLength(2);
    expect(result.movements[0].itemId).toBe(itemId.toString());
    expect(result.movements[1].itemId).toBe(itemId.toString());
  });

  it('should list movements by user', async () => {
    const userId = new UniqueEntityID();
    const itemId1 = new UniqueEntityID();
    const itemId2 = new UniqueEntityID();

    await itemMovementsRepository.create({
      itemId: itemId1,
      userId,
      quantity: 10,
      movementType: MovementType.create('PRODUCTION'),
    });

    await itemMovementsRepository.create({
      itemId: itemId2,
      userId,
      quantity: 5,
      movementType: MovementType.create('SALE'),
    });

    // Create movement by different user
    await itemMovementsRepository.create({
      itemId: itemId1,
      userId: new UniqueEntityID(),
      quantity: 3,
      movementType: MovementType.create('PRODUCTION'),
    });

    const result = await listItemMovements.execute({
      userId: userId.toString(),
    });

    expect(result.movements).toHaveLength(2);
    expect(result.movements[0].userId).toBe(userId.toString());
    expect(result.movements[1].userId).toBe(userId.toString());
  });

  it('should list movements by type', async () => {
    const itemId = new UniqueEntityID();
    const userId = new UniqueEntityID();

    await itemMovementsRepository.create({
      itemId,
      userId,
      quantity: 10,
      movementType: MovementType.create('SALE'),
    });

    await itemMovementsRepository.create({
      itemId,
      userId,
      quantity: 5,
      movementType: MovementType.create('SALE'),
    });

    await itemMovementsRepository.create({
      itemId,
      userId,
      quantity: 3,
      movementType: MovementType.create('PRODUCTION'),
    });

    const result = await listItemMovements.execute({
      movementType: 'SALE',
    });

    expect(result.movements).toHaveLength(2);
    expect(result.movements[0].movementType).toBe('SALE');
    expect(result.movements[1].movementType).toBe('SALE');
  });

  it('should list movements by sales order', async () => {
    const itemId = new UniqueEntityID();
    const userId = new UniqueEntityID();
    const salesOrderId = new UniqueEntityID();

    await itemMovementsRepository.create({
      itemId,
      userId,
      quantity: 10,
      movementType: MovementType.create('SALE'),
      salesOrderId,
    });

    await itemMovementsRepository.create({
      itemId,
      userId,
      quantity: 5,
      movementType: MovementType.create('SALE'),
      salesOrderId,
    });

    // Create movement without sales order
    await itemMovementsRepository.create({
      itemId,
      userId,
      quantity: 3,
      movementType: MovementType.create('PRODUCTION'),
    });

    const result = await listItemMovements.execute({
      salesOrderId: salesOrderId.toString(),
    });

    expect(result.movements).toHaveLength(2);
    expect(result.movements[0].salesOrderId).toBe(salesOrderId.toString());
    expect(result.movements[1].salesOrderId).toBe(salesOrderId.toString());
  });

  it('should list movements by batch number', async () => {
    const itemId = new UniqueEntityID();
    const userId = new UniqueEntityID();

    await itemMovementsRepository.create({
      itemId,
      userId,
      quantity: 10,
      movementType: MovementType.create('PRODUCTION'),
      batchNumber: 'BATCH-001',
    });

    await itemMovementsRepository.create({
      itemId,
      userId,
      quantity: 5,
      movementType: MovementType.create('PRODUCTION'),
      batchNumber: 'BATCH-001',
    });

    await itemMovementsRepository.create({
      itemId,
      userId,
      quantity: 3,
      movementType: MovementType.create('PRODUCTION'),
      batchNumber: 'BATCH-002',
    });

    const result = await listItemMovements.execute({
      batchNumber: 'BATCH-001',
    });

    expect(result.movements).toHaveLength(2);
    expect(result.movements[0].batchNumber).toBe('BATCH-001');
    expect(result.movements[1].batchNumber).toBe('BATCH-001');
  });

  it('should list pending approval movements', async () => {
    const itemId = new UniqueEntityID();
    const userId = new UniqueEntityID();

    // Create movement without approval (pending)
    await itemMovementsRepository.create({
      itemId,
      userId,
      quantity: 10,
      movementType: MovementType.create('LOSS'),
    });

    // Create approved movement
    const approvedMovement = await itemMovementsRepository.create({
      itemId,
      userId,
      quantity: 5,
      movementType: MovementType.create('LOSS'),
    });

    await itemMovementsRepository.update({
      id: approvedMovement.id,
      approvedBy: new UniqueEntityID(),
    });

    const result = await listItemMovements.execute({
      pendingApproval: true,
    });

    expect(result.movements).toHaveLength(1);
    expect(result.movements[0].approvedBy).toBeNull();
  });

  it('should return all movements when no filters provided', async () => {
    const itemId = new UniqueEntityID();
    const userId = new UniqueEntityID();

    await itemMovementsRepository.create({
      itemId,
      userId,
      quantity: 10,
      movementType: MovementType.create('PRODUCTION'),
    });

    await itemMovementsRepository.create({
      itemId,
      userId,
      quantity: 5,
      movementType: MovementType.create('SALE'),
    });

    const result = await listItemMovements.execute({});

    expect(result.movements).toHaveLength(2);
  });
});
