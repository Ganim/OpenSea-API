import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryConsortiaRepository } from '@/repositories/finance/in-memory/in-memory-consortia-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateConsortiumUseCase } from './update-consortium';

let consortiaRepository: InMemoryConsortiaRepository;
let sut: UpdateConsortiumUseCase;

let seededConsortiumId: string;

describe('UpdateConsortiumUseCase', () => {
  beforeEach(async () => {
    consortiaRepository = new InMemoryConsortiaRepository();
    sut = new UpdateConsortiumUseCase(consortiaRepository);

    const consortium = await consortiaRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      costCenterId: 'cc-1',
      name: 'Consorcio Original',
      administrator: 'Admin Original',
      creditValue: 100000,
      monthlyPayment: 1000,
      totalInstallments: 120,
      startDate: new Date('2026-01-01'),
    });
    seededConsortiumId = consortium.id.toString();
  });

  it('should update consortium name and administrator', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: seededConsortiumId,
      name: 'Consorcio Atualizado',
      administrator: 'Novo Admin',
    });

    expect(result.consortium.name).toBe('Consorcio Atualizado');
    expect(result.consortium.administrator).toBe('Novo Admin');
  });

  it('should not update a non-existent consortium', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: 'non-existent-id',
        name: 'Teste',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not update with empty name', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: seededConsortiumId,
        name: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
