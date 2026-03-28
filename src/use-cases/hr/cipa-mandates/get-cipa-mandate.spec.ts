import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCipaMandatesRepository } from '@/repositories/hr/in-memory/in-memory-cipa-mandates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetCipaMandateUseCase } from './get-cipa-mandate';

let cipaMandatesRepository: InMemoryCipaMandatesRepository;
let sut: GetCipaMandateUseCase;

const TENANT_ID = 'tenant-01';

describe('GetCipaMandateUseCase', () => {
  beforeEach(() => {
    cipaMandatesRepository = new InMemoryCipaMandatesRepository();
    sut = new GetCipaMandateUseCase(cipaMandatesRepository);
  });

  it('should return a CIPA mandate by id', async () => {
    const createdMandate = await cipaMandatesRepository.create({
      tenantId: TENANT_ID,
      name: 'CIPA 2026/2027',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
      status: 'ACTIVE',
    });

    const { cipaMandate } = await sut.execute({
      tenantId: TENANT_ID,
      mandateId: createdMandate.id.toString(),
    });

    expect(cipaMandate.id.equals(createdMandate.id)).toBe(true);
    expect(cipaMandate.name).toBe('CIPA 2026/2027');
    expect(cipaMandate.status).toBe('ACTIVE');
  });

  it('should return mandate with all optional fields', async () => {
    const electionDate = new Date('2025-11-15');

    const createdMandate = await cipaMandatesRepository.create({
      tenantId: TENANT_ID,
      name: 'CIPA 2026/2027',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
      status: 'DRAFT',
      electionDate,
      notes: 'Notas do mandato',
    });

    const { cipaMandate } = await sut.execute({
      tenantId: TENANT_ID,
      mandateId: createdMandate.id.toString(),
    });

    expect(cipaMandate.electionDate).toEqual(electionDate);
    expect(cipaMandate.notes).toBe('Notas do mandato');
  });

  it('should throw ResourceNotFoundError when mandate does not exist', async () => {
    const nonExistentId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        mandateId: nonExistentId,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError when mandate belongs to another tenant', async () => {
    const createdMandate = await cipaMandatesRepository.create({
      tenantId: 'another-tenant',
      name: 'CIPA 2026/2027',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
      status: 'ACTIVE',
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        mandateId: createdMandate.id.toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
