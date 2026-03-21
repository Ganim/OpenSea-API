import { InMemorySupportSlaConfigsRepository } from '@/repositories/core/in-memory/in-memory-support-sla-configs-repository';
import { makeSupportSlaConfig } from '@/utils/tests/factories/core/make-support-sla-config';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetSlaConfigUseCase } from './get-sla-config';

let supportSlaConfigsRepository: InMemorySupportSlaConfigsRepository;
let sut: GetSlaConfigUseCase;

describe('GetSlaConfigUseCase', () => {
  beforeEach(() => {
    supportSlaConfigsRepository = new InMemorySupportSlaConfigsRepository();
    sut = new GetSlaConfigUseCase(supportSlaConfigsRepository);
  });

  it('should return all SLA configs', async () => {
    await supportSlaConfigsRepository.save(
      makeSupportSlaConfig({ priority: 'CRITICAL', firstResponseMinutes: 15 }),
    );
    await supportSlaConfigsRepository.save(
      makeSupportSlaConfig({ priority: 'HIGH', firstResponseMinutes: 30 }),
    );

    const { slaConfigs } = await sut.execute();

    expect(slaConfigs).toHaveLength(2);
  });

  it('should return empty array when no configs exist', async () => {
    const { slaConfigs } = await sut.execute();
    expect(slaConfigs).toHaveLength(0);
  });
});
