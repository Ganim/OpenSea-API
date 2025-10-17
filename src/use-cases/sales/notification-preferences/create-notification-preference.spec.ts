import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryNotificationPreferencesRepository } from '@/repositories/sales/in-memory/in-memory-notification-preferences-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateNotificationPreferenceUseCase } from './create-notification-preference';

let repository: InMemoryNotificationPreferencesRepository;
let sut: CreateNotificationPreferenceUseCase;
let userId: UniqueEntityID;

describe('CreateNotificationPreferenceUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryNotificationPreferencesRepository();
    sut = new CreateNotificationPreferenceUseCase(repository);
    userId = new UniqueEntityID();
  });

  it('should be able to create notification preference', async () => {
    const result = await sut.execute({
      userId: userId.toString(),
      alertType: 'LOW_STOCK',
      channel: 'EMAIL',
      isEnabled: true,
    });

    expect(result.preference).toBeDefined();
    expect(result.preference.alertType).toBe('LOW_STOCK');
    expect(result.preference.channel).toBe('EMAIL');
    expect(result.preference.isEnabled).toBe(true);
  });

  it('should create preference with isEnabled=true by default', async () => {
    const result = await sut.execute({
      userId: userId.toString(),
      alertType: 'OUT_OF_STOCK',
      channel: 'SMS',
    });

    expect(result.preference.isEnabled).toBe(true);
  });

  it('should not create preference with invalid alert type', async () => {
    await expect(() =>
      sut.execute({
        userId: userId.toString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        alertType: 'INVALID_TYPE' as any,
        channel: 'EMAIL',
      }),
    ).rejects.toThrow('Invalid alert type');
  });

  it('should not create preference with invalid channel', async () => {
    await expect(() =>
      sut.execute({
        userId: userId.toString(),
        alertType: 'LOW_STOCK',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        channel: 'INVALID_CHANNEL' as any,
      }),
    ).rejects.toThrow('Invalid notification channel');
  });

  it('should create preferences for all alert types', async () => {
    const alertTypes = [
      'LOW_STOCK',
      'OUT_OF_STOCK',
      'EXPIRING_SOON',
      'EXPIRED',
      'PRICE_CHANGE',
      'REORDER_POINT',
    ] as const;

    for (const alertType of alertTypes) {
      const result = await sut.execute({
        userId: userId.toString(),
        alertType,
        channel: 'IN_APP',
      });

      expect(result.preference.alertType).toBe(alertType);
    }
  });

  it('should create preferences for all channels', async () => {
    const channels = ['IN_APP', 'EMAIL', 'SMS', 'PUSH'] as const;

    for (const channel of channels) {
      const result = await sut.execute({
        userId: userId.toString(),
        alertType: 'LOW_STOCK',
        channel,
      });

      expect(result.preference.channel).toBe(channel);
    }
  });
});
