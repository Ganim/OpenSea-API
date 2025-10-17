import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryItemReservationsRepository } from '@/repositories/sales/in-memory/in-memory-item-reservations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListItemReservationsUseCase } from './list-item-reservations';

let repository: InMemoryItemReservationsRepository;
let sut: ListItemReservationsUseCase;

describe('ListItemReservationsUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryItemReservationsRepository();
    sut = new ListItemReservationsUseCase(repository);
  });

  it('should list reservations by item', async () => {
    const itemId = new UniqueEntityID();

    await repository.create({
      itemId,
      userId: new UniqueEntityID(),
      quantity: 10,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await repository.create({
      itemId,
      userId: new UniqueEntityID(),
      quantity: 20,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await repository.create({
      itemId: new UniqueEntityID(),
      userId: new UniqueEntityID(),
      quantity: 30,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const result = await sut.execute({
      itemId: itemId.toString(),
    });

    expect(result.reservations).toHaveLength(2);
  });

  it('should list reservations by user', async () => {
    const userId = new UniqueEntityID();

    await repository.create({
      itemId: new UniqueEntityID(),
      userId,
      quantity: 10,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await repository.create({
      itemId: new UniqueEntityID(),
      userId,
      quantity: 20,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await repository.create({
      itemId: new UniqueEntityID(),
      userId: new UniqueEntityID(),
      quantity: 30,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const result = await sut.execute({
      userId: userId.toString(),
    });

    expect(result.reservations).toHaveLength(2);
  });

  it('should list only active reservations when activeOnly is true', async () => {
    const itemId = new UniqueEntityID();

    // Active reservation
    await repository.create({
      itemId,
      userId: new UniqueEntityID(),
      quantity: 10,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // Released reservation
    const reservation2 = await repository.create({
      itemId,
      userId: new UniqueEntityID(),
      quantity: 20,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    reservation2.release();
    await repository.save(reservation2);

    const result = await sut.execute({
      itemId: itemId.toString(),
      activeOnly: true,
    });

    expect(result.reservations).toHaveLength(1);
    expect(result.reservations[0].quantity).toBe(10);
  });

  it('should return empty array when no filters provided', async () => {
    await repository.create({
      itemId: new UniqueEntityID(),
      userId: new UniqueEntityID(),
      quantity: 10,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const result = await sut.execute({});

    expect(result.reservations).toEqual([]);
  });
});
