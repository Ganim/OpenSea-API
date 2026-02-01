import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryNotificationPreferencesRepository } from '@/repositories/sales/in-memory/in-memory-notification-preferences-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetNotificationPreferenceUseCase } from './get-notification-preference';

let notificationPreferencesRepository: InMemoryNotificationPreferencesRepository;
let sut: GetNotificationPreferenceUseCase;

describe('GetNotificationPreferenceUseCase', () => {
  beforeEach(() => {
    notificationPreferencesRepository =
      new InMemoryNotificationPreferencesRepository();
    sut = new GetNotificationPreferenceUseCase(
      notificationPreferencesRepository,
    );
  });

  it('should throw ResourceNotFoundError for non-existent preference', async () => {
    await expect(() =>
      sut.execute({ id: 'non-existent' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
