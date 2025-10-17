import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryNotificationPreferencesRepository } from '@/repositories/sales/in-memory/in-memory-notification-preferences-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteNotificationPreferenceUseCase } from './delete-notification-preference';

let repository: InMemoryNotificationPreferencesRepository;
let sut: DeleteNotificationPreferenceUseCase;
let userId: UniqueEntityID;

describe('DeleteNotificationPreferenceUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryNotificationPreferencesRepository();
    sut = new DeleteNotificationPreferenceUseCase(repository);
    userId = new UniqueEntityID();
  });

  it('should be able to soft delete a preference', async () => {
    const preference = await repository.create({
      userId,
      alertType: 'LOW_STOCK',
      channel: 'EMAIL',
      isEnabled: true,
    });

    const result = await sut.execute({
      id: preference.id.toString(),
    });

    expect(result.preference.isDeleted).toBe(true);
    expect(result.preference.isEnabled).toBe(false);
  });

  it('should not delete nonexistent preference', async () => {
    await expect(() =>
      sut.execute({
        id: 'nonexistent-id',
      }),
    ).rejects.toThrow('Notification preference not found');
  });
});
