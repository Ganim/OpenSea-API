import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryDowntimeReasonsRepository } from '@/repositories/production/in-memory/in-memory-downtime-reasons-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDowntimeReasonUseCase } from './create-downtime-reason';

let downtimeReasonsRepository: InMemoryDowntimeReasonsRepository;
let sut: CreateDowntimeReasonUseCase;

describe('CreateDowntimeReasonUseCase', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    downtimeReasonsRepository = new InMemoryDowntimeReasonsRepository();
    sut = new CreateDowntimeReasonUseCase(downtimeReasonsRepository);
  });

  it('should create a downtime reason', async () => {
    const { downtimeReason } = await sut.execute({
      tenantId: TENANT_ID,
      code: 'MCH-001',
      name: 'Machine Breakdown',
      category: 'MACHINE',
    });

    expect(downtimeReason.id.toString()).toEqual(expect.any(String));
    expect(downtimeReason.code).toBe('MCH-001');
    expect(downtimeReason.name).toBe('Machine Breakdown');
    expect(downtimeReason.category).toBe('MACHINE');
    expect(downtimeReason.isActive).toBe(true);
  });

  it('should create an inactive downtime reason', async () => {
    const { downtimeReason } = await sut.execute({
      tenantId: TENANT_ID,
      code: 'MTR-001',
      name: 'Material Shortage',
      category: 'MATERIAL',
      isActive: false,
    });

    expect(downtimeReason.isActive).toBe(false);
  });

  it('should create with all categories', async () => {
    const categories = [
      'MACHINE',
      'MATERIAL',
      'QUALITY',
      'SETUP',
      'PLANNING',
      'MAINTENANCE',
      'OTHER',
    ] as const;

    for (let i = 0; i < categories.length; i++) {
      const { downtimeReason } = await sut.execute({
        tenantId: TENANT_ID,
        code: `CAT-${i}`,
        name: `Reason ${i}`,
        category: categories[i],
      });

      expect(downtimeReason.category).toBe(categories[i]);
    }
  });

  it('should not allow duplicate code per tenant', async () => {
    await sut.execute({
      tenantId: TENANT_ID,
      code: 'MCH-001',
      name: 'Machine Breakdown',
      category: 'MACHINE',
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        code: 'MCH-001',
        name: 'Different Name',
        category: 'MACHINE',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should allow same code for different tenants', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      code: 'MCH-001',
      name: 'Machine Breakdown',
      category: 'MACHINE',
    });

    const { downtimeReason } = await sut.execute({
      tenantId: 'tenant-2',
      code: 'MCH-001',
      name: 'Machine Breakdown',
      category: 'MACHINE',
    });

    expect(downtimeReason.id.toString()).toEqual(expect.any(String));
  });
});
