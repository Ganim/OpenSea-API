import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryNotificationPreferencesRepository } from '@/repositories/sales/in-memory/in-memory-notification-preferences-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateNotificationPreferenceUseCase } from './update-notification-preference';

let repository: InMemoryNotificationPreferencesRepository;
let sut: UpdateNotificationPreferenceUseCase;
let userId: UniqueEntityID;

describe('UpdateNotificationPreferenceUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryNotificationPreferencesRepository();
    sut = new UpdateNotificationPreferenceUseCase(repository);
    userId = new UniqueEntityID();
  });

  it('should be able to update preference isEnabled', async () => {
    const preference = await repository.create({
      userId,
      alertType: 'LOW_STOCK',
      channel: 'EMAIL',
      isEnabled: true,
    });

    const result = await sut.execute({
      id: preference.id.toString(),
      isEnabled: false,
    });

    expect(result.preference.isEnabled).toBe(false);
  });

  it('should not update nonexistent preference', async () => {
    await expect(() =>
      sut.execute({
        id: 'nonexistent-id',
        isEnabled: false,
      }),
    ).rejects.toThrow('Notification preference not found');
  });
});
