import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryItemReservationsRepository } from '@/repositories/sales/in-memory/in-memory-item-reservations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ReleaseItemReservationUseCase } from './release-item-reservation';

let repository: InMemoryItemReservationsRepository;
let sut: ReleaseItemReservationUseCase;

describe('ReleaseItemReservationUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryItemReservationsRepository();
    sut = new ReleaseItemReservationUseCase(repository);
  });

  it('should be able to release a reservation', async () => {
    const reservation = await repository.create({
      itemId: new UniqueEntityID(),
      userId: new UniqueEntityID(),
      quantity: 10,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const result = await sut.execute({
      id: reservation.id.toString(),
    });

    expect(result.reservation.isReleased).toBe(true);
    expect(result.reservation.releasedAt).toBeDefined();
    expect(result.reservation.isActive).toBe(false);
  });

  it('should not release nonexistent reservation', async () => {
    await expect(() =>
      sut.execute({
        id: 'nonexistent-id',
      }),
    ).rejects.toThrow('Reservation not found');
  });

  it('should not release already released reservation', async () => {
    const reservation = await repository.create({
      itemId: new UniqueEntityID(),
      userId: new UniqueEntityID(),
      quantity: 10,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // Release once
    await sut.execute({
      id: reservation.id.toString(),
    });

    // Try to release again
    await expect(() =>
      sut.execute({
        id: reservation.id.toString(),
      }),
    ).rejects.toThrow('Reservation already released');
  });
});
