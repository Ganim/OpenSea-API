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

  // P1-39: expanded update body now mirrors create (minus creditValue).
  it('should update monthlyPayment, totalInstallments, startDate, and paymentDay', async () => {
    const newStart = new Date('2026-06-01');
    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: seededConsortiumId,
      monthlyPayment: 1500,
      totalInstallments: 60,
      startDate: newStart,
      paymentDay: 15,
      groupNumber: 'G-42',
      quotaNumber: 'Q-7',
    });

    expect(result.consortium.monthlyPayment).toBe(1500);
    expect(result.consortium.totalInstallments).toBe(60);
    expect(result.consortium.startDate).toEqual(newStart);
    expect(result.consortium.paymentDay).toBe(15);
    expect(result.consortium.groupNumber).toBe('G-42');
    expect(result.consortium.quotaNumber).toBe('Q-7');
  });

  it('should update bankAccountId and costCenterId', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: seededConsortiumId,
      bankAccountId: 'bank-2',
      costCenterId: 'cc-2',
    });

    expect(result.consortium.bankAccountId).toBe('bank-2');
    expect(result.consortium.costCenterId).toBe('cc-2');
  });
});
