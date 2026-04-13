import { InMemoryDowntimeReasonsRepository } from '@/repositories/production/in-memory/in-memory-downtime-reasons-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDowntimeReasonUseCase } from './create-downtime-reason';
import { ListDowntimeReasonsUseCase } from './list-downtime-reasons';

let downtimeReasonsRepository: InMemoryDowntimeReasonsRepository;
let createDowntimeReason: CreateDowntimeReasonUseCase;
let sut: ListDowntimeReasonsUseCase;

describe('ListDowntimeReasonsUseCase', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    downtimeReasonsRepository = new InMemoryDowntimeReasonsRepository();
    createDowntimeReason = new CreateDowntimeReasonUseCase(
      downtimeReasonsRepository,
    );
    sut = new ListDowntimeReasonsUseCase(downtimeReasonsRepository);
  });

  it('should list all downtime reasons for a tenant', async () => {
    await createDowntimeReason.execute({
      tenantId: TENANT_ID,
      code: 'MCH-001',
      name: 'Machine Breakdown',
      category: 'MACHINE',
    });

    await createDowntimeReason.execute({
      tenantId: TENANT_ID,
      code: 'MTR-001',
      name: 'Material Shortage',
      category: 'MATERIAL',
    });

    const { downtimeReasons } = await sut.execute({ tenantId: TENANT_ID });

    expect(downtimeReasons).toHaveLength(2);
  });

  it('should return empty array when no reasons exist', async () => {
    const { downtimeReasons } = await sut.execute({ tenantId: TENANT_ID });

    expect(downtimeReasons).toHaveLength(0);
  });

  it('should not return reasons from other tenants', async () => {
    await createDowntimeReason.execute({
      tenantId: 'tenant-1',
      code: 'MCH-001',
      name: 'Machine Breakdown',
      category: 'MACHINE',
    });

    await createDowntimeReason.execute({
      tenantId: 'tenant-2',
      code: 'MCH-002',
      name: 'Other Breakdown',
      category: 'MACHINE',
    });

    const { downtimeReasons } = await sut.execute({ tenantId: 'tenant-1' });

    expect(downtimeReasons).toHaveLength(1);
    expect(downtimeReasons[0].code).toBe('MCH-001');
  });
});
