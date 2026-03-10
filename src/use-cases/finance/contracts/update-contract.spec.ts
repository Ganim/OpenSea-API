import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryContractsRepository } from '@/repositories/finance/in-memory/in-memory-contracts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateContractUseCase } from './update-contract';

let contractsRepository: InMemoryContractsRepository;
let sut: UpdateContractUseCase;

describe('UpdateContractUseCase', () => {
  beforeEach(() => {
    contractsRepository = new InMemoryContractsRepository();
    sut = new UpdateContractUseCase(contractsRepository);
  });

  it('should update a contract title', async () => {
    const contract = await contractsRepository.create({
      tenantId: 'tenant-1',
      code: 'CTR-001',
      title: 'Contrato Original',
      companyName: 'Empresa A',
      totalValue: 12000,
      paymentFrequency: 'MONTHLY',
      paymentAmount: 1000,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      contractId: contract.id.toString(),
      title: 'Contrato Atualizado',
    });

    expect(result.contract.title).toBe('Contrato Atualizado');
  });

  it('should throw for non-existent contract', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        contractId: 'non-existent',
        title: 'Novo Titulo',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw for cancelled contract', async () => {
    const contract = await contractsRepository.create({
      tenantId: 'tenant-1',
      code: 'CTR-002',
      title: 'Contrato Cancelado',
      companyName: 'Empresa B',
      totalValue: 1000,
      paymentFrequency: 'MONTHLY',
      paymentAmount: 100,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'CANCELLED',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        contractId: contract.id.toString(),
        title: 'Novo Titulo',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should reject empty title', async () => {
    const contract = await contractsRepository.create({
      tenantId: 'tenant-1',
      code: 'CTR-003',
      title: 'Contrato',
      companyName: 'Empresa C',
      totalValue: 1000,
      paymentFrequency: 'MONTHLY',
      paymentAmount: 100,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        contractId: contract.id.toString(),
        title: '',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should update multiple fields at once', async () => {
    const contract = await contractsRepository.create({
      tenantId: 'tenant-1',
      code: 'CTR-004',
      title: 'Contrato Multi',
      companyName: 'Empresa D',
      totalValue: 1000,
      paymentFrequency: 'MONTHLY',
      paymentAmount: 100,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      contractId: contract.id.toString(),
      totalValue: 2000,
      paymentAmount: 200,
      autoRenew: true,
      alertDaysBefore: 90,
      notes: 'Notas atualizadas',
    });

    expect(result.contract.totalValue).toBe(2000);
    expect(result.contract.paymentAmount).toBe(200);
    expect(result.contract.autoRenew).toBe(true);
    expect(result.contract.alertDaysBefore).toBe(90);
    expect(result.contract.notes).toBe('Notas atualizadas');
  });
});
