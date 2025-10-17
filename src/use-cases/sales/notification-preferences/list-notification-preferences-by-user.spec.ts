import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryNotificationPreferencesRepository } from '@/repositories/sales/in-memory/in-memory-notification-preferences-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListNotificationPreferencesByUserUseCase } from './list-notification-preferences-by-user';

let repository: InMemoryNotificationPreferencesRepository;
let sut: ListNotificationPreferencesByUserUseCase;
let userId: UniqueEntityID;

describe('ListNotificationPreferencesByUserUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryNotificationPreferencesRepository();
    sut = new ListNotificationPreferencesByUserUseCase(repository);
    userId = new UniqueEntityID();
  });

  it('should list all preferences for a user', async () => {
    await repository.create({
      userId,
      alertType: 'LOW_STOCK',
      channel: 'EMAIL',
      isEnabled: true,
    });

    await repository.create({
      userId,
      alertType: 'OUT_OF_STOCK',
      channel: 'SMS',
      isEnabled: false,
    });

    await repository.create({
      userId: new UniqueEntityID(),
      alertType: 'EXPIRING_SOON',
      channel: 'PUSH',
      isEnabled: true,
    });

    const result = await sut.execute({
      userId: userId.toString(),
    });

    expect(result.preferences).toHaveLength(2);
  });

  it('should list only enabled preferences when enabledOnly is true', async () => {
    await repository.create({
      userId,
      alertType: 'LOW_STOCK',
      channel: 'EMAIL',
      isEnabled: true,
    });

    await repository.create({
      userId,
      alertType: 'OUT_OF_STOCK',
      channel: 'SMS',
      isEnabled: false,
    });

    const result = await sut.execute({
      userId: userId.toString(),
      enabledOnly: true,
    });

    expect(result.preferences).toHaveLength(1);
    expect(result.preferences[0].alertType).toBe('LOW_STOCK');
  });
});
