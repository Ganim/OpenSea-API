import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryConsortiaRepository } from '@/repositories/finance/in-memory/in-memory-consortia-repository';
import { InMemoryConsortiumPaymentsRepository } from '@/repositories/finance/in-memory/in-memory-consortium-payments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetConsortiumByIdUseCase } from './get-consortium-by-id';

let consortiaRepository: InMemoryConsortiaRepository;
let paymentsRepository: InMemoryConsortiumPaymentsRepository;
let sut: GetConsortiumByIdUseCase;

let seededConsortiumId: string;

describe('GetConsortiumByIdUseCase', () => {
  beforeEach(async () => {
    consortiaRepository = new InMemoryConsortiaRepository();
    paymentsRepository = new InMemoryConsortiumPaymentsRepository();
    sut = new GetConsortiumByIdUseCase(consortiaRepository, paymentsRepository);

    const consortium = await consortiaRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      costCenterId: 'cc-1',
      name: 'Consorcio Teste',
      administrator: 'Admin Teste',
      creditValue: 100000,
      monthlyPayment: 1000,
      totalInstallments: 120,
      startDate: new Date('2026-01-01'),
    });
    seededConsortiumId = consortium.id.toString();

    await paymentsRepository.create({
      consortiumId: seededConsortiumId,
      installmentNumber: 1,
      dueDate: new Date('2026-02-01'),
      expectedAmount: 1000,
    });
    await paymentsRepository.create({
      consortiumId: seededConsortiumId,
      installmentNumber: 2,
      dueDate: new Date('2026-03-01'),
      expectedAmount: 1000,
    });
  });

  it('should return consortium with payments', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: seededConsortiumId,
    });

    expect(result.consortium.name).toBe('Consorcio Teste');
    expect(result.payments).toHaveLength(2);
    expect(result.payments[0].installmentNumber).toBe(1);
    expect(result.payments[1].installmentNumber).toBe(2);
  });

  it('should not find a non-existent consortium', async () => {
    await expect(
      sut.execute({ tenantId: 'tenant-1', id: 'non-existent-id' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
