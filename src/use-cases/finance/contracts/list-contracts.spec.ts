import { InMemoryContractsRepository } from '@/repositories/finance/in-memory/in-memory-contracts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListContractsUseCase } from './list-contracts';

let contractsRepository: InMemoryContractsRepository;
let sut: ListContractsUseCase;

describe('ListContractsUseCase', () => {
  beforeEach(async () => {
    contractsRepository = new InMemoryContractsRepository();
    sut = new ListContractsUseCase(contractsRepository);

    // Seed data
    await contractsRepository.create({
      tenantId: 'tenant-1',
      code: 'CTR-001',
      title: 'Contrato Limpeza',
      companyName: 'Empresa ABC',
      totalValue: 12000,
      paymentFrequency: 'MONTHLY',
      paymentAmount: 1000,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'ACTIVE',
    });

    await contractsRepository.create({
      tenantId: 'tenant-1',
      code: 'CTR-002',
      title: 'Contrato Seguranca',
      companyName: 'Empresa XYZ',
      totalValue: 24000,
      paymentFrequency: 'MONTHLY',
      paymentAmount: 2000,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2027-05-31'),
      status: 'ACTIVE',
    });

    await contractsRepository.create({
      tenantId: 'tenant-1',
      code: 'CTR-003',
      title: 'Contrato Cancelado',
      companyName: 'Empresa QWE',
      totalValue: 5000,
      paymentFrequency: 'QUARTERLY',
      paymentAmount: 1250,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      status: 'CANCELLED',
    });

    // Different tenant
    await contractsRepository.create({
      tenantId: 'tenant-2',
      code: 'CTR-004',
      title: 'Contrato Outro Tenant',
      companyName: 'Empresa Outra',
      totalValue: 3000,
      paymentFrequency: 'MONTHLY',
      paymentAmount: 250,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
    });
  });

  it('should list contracts for a tenant', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.contracts).toHaveLength(3);
    expect(result.total).toBe(3);
  });

  it('should filter by status', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      status: 'ACTIVE',
    });

    expect(result.contracts).toHaveLength(2);
    expect(result.contracts.every((c) => c.status === 'ACTIVE')).toBe(true);
  });

  it('should search by title or company name', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      search: 'Seguranca',
    });

    expect(result.contracts).toHaveLength(1);
    expect(result.contracts[0].title).toBe('Contrato Seguranca');
  });

  it('should not return contracts from other tenants', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1' });

    for (const contract of result.contracts) {
      expect(contract.tenantId).toBe('tenant-1');
    }
  });

  it('should paginate results', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 2,
    });

    expect(result.contracts).toHaveLength(2);
    expect(result.total).toBe(3);
  });
});
