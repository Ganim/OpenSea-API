import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryConsortiaRepository } from '@/repositories/finance/in-memory/in-memory-consortia-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { MarkContemplatedUseCase } from './mark-contemplated';

let consortiaRepository: InMemoryConsortiaRepository;
let sut: MarkContemplatedUseCase;

let seededConsortiumId: string;

describe('MarkContemplatedUseCase', () => {
  beforeEach(async () => {
    consortiaRepository = new InMemoryConsortiaRepository();
    sut = new MarkContemplatedUseCase(consortiaRepository);

    const consortium = await consortiaRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      costCenterId: 'cc-1',
      name: 'Consorcio para contemplar',
      administrator: 'Admin',
      creditValue: 100000,
      monthlyPayment: 1000,
      totalInstallments: 120,
      startDate: new Date('2026-01-01'),
    });
    seededConsortiumId = consortium.id.toString();
  });

  it('should mark consortium as contemplated via BID', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: seededConsortiumId,
      contemplationType: 'BID',
      contemplatedAt: new Date('2026-06-15'),
    });

    expect(result.consortium.isContemplated).toBe(true);
    expect(result.consortium.contemplationType).toBe('BID');
    expect(result.consortium.status).toBe('CONTEMPLATED');
  });

  it('should mark consortium as contemplated via DRAW', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: seededConsortiumId,
      contemplationType: 'DRAW',
      contemplatedAt: new Date('2026-06-15'),
    });

    expect(result.consortium.isContemplated).toBe(true);
    expect(result.consortium.contemplationType).toBe('DRAW');
    expect(result.consortium.status).toBe('CONTEMPLATED');
  });

  it('should not contemplate a non-existent consortium', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: 'non-existent-id',
        contemplationType: 'BID',
        contemplatedAt: new Date('2026-06-15'),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
