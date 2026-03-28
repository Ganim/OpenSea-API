import { InMemoryCipaMandatesRepository } from '@/repositories/hr/in-memory/in-memory-cipa-mandates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListCipaMandatesUseCase } from './list-cipa-mandates';

let cipaMandatesRepository: InMemoryCipaMandatesRepository;
let sut: ListCipaMandatesUseCase;

const TENANT_ID = 'tenant-01';

describe('ListCipaMandatesUseCase', () => {
  beforeEach(() => {
    cipaMandatesRepository = new InMemoryCipaMandatesRepository();
    sut = new ListCipaMandatesUseCase(cipaMandatesRepository);
  });

  it('should list all mandates for a tenant', async () => {
    await cipaMandatesRepository.create({
      tenantId: TENANT_ID,
      name: 'CIPA 2024/2025',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-01-01'),
      status: 'EXPIRED',
    });

    await cipaMandatesRepository.create({
      tenantId: TENANT_ID,
      name: 'CIPA 2026/2027',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
      status: 'ACTIVE',
    });

    const { cipaMandates } = await sut.execute({ tenantId: TENANT_ID });

    expect(cipaMandates).toHaveLength(2);
  });

  it('should return empty array when tenant has no mandates', async () => {
    const { cipaMandates } = await sut.execute({ tenantId: TENANT_ID });

    expect(cipaMandates).toHaveLength(0);
  });

  it('should not return mandates from other tenants', async () => {
    await cipaMandatesRepository.create({
      tenantId: 'another-tenant',
      name: 'CIPA Outro Tenant',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
      status: 'ACTIVE',
    });

    await cipaMandatesRepository.create({
      tenantId: TENANT_ID,
      name: 'CIPA Meu Tenant',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
      status: 'ACTIVE',
    });

    const { cipaMandates } = await sut.execute({ tenantId: TENANT_ID });

    expect(cipaMandates).toHaveLength(1);
    expect(cipaMandates[0].name).toBe('CIPA Meu Tenant');
  });

  it('should filter mandates by status', async () => {
    await cipaMandatesRepository.create({
      tenantId: TENANT_ID,
      name: 'CIPA Ativa',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
      status: 'ACTIVE',
    });

    await cipaMandatesRepository.create({
      tenantId: TENANT_ID,
      name: 'CIPA Expirada',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-01-01'),
      status: 'EXPIRED',
    });

    await cipaMandatesRepository.create({
      tenantId: TENANT_ID,
      name: 'CIPA Rascunho',
      startDate: new Date('2027-01-01'),
      endDate: new Date('2028-01-01'),
      status: 'DRAFT',
    });

    const { cipaMandates } = await sut.execute({
      tenantId: TENANT_ID,
      status: 'ACTIVE',
    });

    expect(cipaMandates).toHaveLength(1);
    expect(cipaMandates[0].name).toBe('CIPA Ativa');
  });

  it('should paginate results', async () => {
    for (let i = 1; i <= 5; i++) {
      await cipaMandatesRepository.create({
        tenantId: TENANT_ID,
        name: `CIPA ${i}`,
        startDate: new Date(`202${i}-01-01`),
        endDate: new Date(`202${i + 1}-01-01`),
        status: 'ACTIVE',
      });
    }

    const firstPage = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      perPage: 2,
    });

    expect(firstPage.cipaMandates).toHaveLength(2);

    const secondPage = await sut.execute({
      tenantId: TENANT_ID,
      page: 2,
      perPage: 2,
    });

    expect(secondPage.cipaMandates).toHaveLength(2);

    const thirdPage = await sut.execute({
      tenantId: TENANT_ID,
      page: 3,
      perPage: 2,
    });

    expect(thirdPage.cipaMandates).toHaveLength(1);
  });

  it('should return all mandates when pagination is not specified', async () => {
    for (let i = 1; i <= 3; i++) {
      await cipaMandatesRepository.create({
        tenantId: TENANT_ID,
        name: `CIPA ${i}`,
        startDate: new Date(`202${i}-01-01`),
        endDate: new Date(`202${i + 1}-01-01`),
        status: 'ACTIVE',
      });
    }

    const { cipaMandates } = await sut.execute({ tenantId: TENANT_ID });

    expect(cipaMandates).toHaveLength(3);
  });
});
