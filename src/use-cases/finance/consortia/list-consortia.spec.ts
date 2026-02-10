import { InMemoryConsortiaRepository } from '@/repositories/finance/in-memory/in-memory-consortia-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListConsortiaUseCase } from './list-consortia';

let consortiaRepository: InMemoryConsortiaRepository;
let sut: ListConsortiaUseCase;

describe('ListConsortiaUseCase', () => {
  beforeEach(async () => {
    consortiaRepository = new InMemoryConsortiaRepository();
    sut = new ListConsortiaUseCase(consortiaRepository);

    await consortiaRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      costCenterId: 'cc-1',
      name: 'Consorcio Imobiliario',
      administrator: 'Porto Seguro',
      creditValue: 200000,
      monthlyPayment: 1500,
      totalInstallments: 180,
      startDate: new Date('2026-01-01'),
    });

    await consortiaRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      costCenterId: 'cc-1',
      name: 'Consorcio Auto',
      administrator: 'Embracon',
      creditValue: 80000,
      monthlyPayment: 800,
      totalInstallments: 60,
      startDate: new Date('2026-01-01'),
    });

    await consortiaRepository.create({
      tenantId: 'tenant-2',
      bankAccountId: 'bank-2',
      costCenterId: 'cc-2',
      name: 'Outro tenant',
      administrator: 'Admin',
      creditValue: 50000,
      monthlyPayment: 500,
      totalInstallments: 100,
      startDate: new Date('2026-01-01'),
    });
  });

  it('should list consortia for a tenant', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.consortia).toHaveLength(2);
    expect(result.meta.total).toBe(2);
  });

  it('should search by name', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1', search: 'Auto' });

    expect(result.consortia).toHaveLength(1);
    expect(result.consortia[0].name).toBe('Consorcio Auto');
  });

  it('should search by administrator', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      search: 'Embracon',
    });

    expect(result.consortia).toHaveLength(1);
    expect(result.consortia[0].administrator).toBe('Embracon');
  });
});
