import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryItemReservationsRepository } from '@/repositories/sales/in-memory/in-memory-item-reservations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetItemReservationByIdUseCase } from './get-item-reservation-by-id';

let repository: InMemoryItemReservationsRepository;
let sut: GetItemReservationByIdUseCase;

describe('GetItemReservationByIdUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryItemReservationsRepository();
    sut = new GetItemReservationByIdUseCase(repository);
  });

  it('should be able to get reservation by id', async () => {
    const reservation = await repository.create({
      itemId: new UniqueEntityID(),
      userId: new UniqueEntityID(),
      quantity: 10,
      reason: 'Test reservation',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const result = await sut.execute({
      id: reservation.id.toString(),
    });

    expect(result.reservation).toBeDefined();
    expect(result.reservation.quantity).toBe(10);
    expect(result.reservation.reason).toBe('Test reservation');
  });

  it('should not get nonexistent reservation', async () => {
    await expect(() =>
      sut.execute({
        id: 'nonexistent-id',
      }),
    ).rejects.toThrow('Reservation not found');
  });
});
