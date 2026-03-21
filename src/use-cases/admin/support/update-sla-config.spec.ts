import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemorySupportSlaConfigsRepository } from '@/repositories/core/in-memory/in-memory-support-sla-configs-repository';
import { makeSupportSlaConfig } from '@/utils/tests/factories/core/make-support-sla-config';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateSlaConfigUseCase } from './update-sla-config';

let supportSlaConfigsRepository: InMemorySupportSlaConfigsRepository;
let sut: UpdateSlaConfigUseCase;

describe('UpdateSlaConfigUseCase', () => {
  beforeEach(() => {
    supportSlaConfigsRepository = new InMemorySupportSlaConfigsRepository();
    sut = new UpdateSlaConfigUseCase(supportSlaConfigsRepository);
  });

  it('should update SLA config for a priority', async () => {
    await supportSlaConfigsRepository.save(
      makeSupportSlaConfig({
        priority: 'HIGH',
        firstResponseMinutes: 30,
        resolutionMinutes: 240,
      }),
    );

    const { slaConfig } = await sut.execute({
      priority: 'HIGH',
      firstResponseMinutes: 15,
      resolutionMinutes: 120,
    });

    expect(slaConfig.firstResponseMinutes).toBe(15);
    expect(slaConfig.resolutionMinutes).toBe(120);
  });

  it('should throw ResourceNotFoundError when SLA config does not exist', async () => {
    await expect(
      sut.execute({
        priority: 'CRITICAL',
        firstResponseMinutes: 10,
        resolutionMinutes: 60,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
