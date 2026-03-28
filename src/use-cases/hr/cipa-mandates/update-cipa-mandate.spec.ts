import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCipaMandatesRepository } from '@/repositories/hr/in-memory/in-memory-cipa-mandates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateCipaMandateUseCase } from './update-cipa-mandate';

let cipaMandatesRepository: InMemoryCipaMandatesRepository;
let sut: UpdateCipaMandateUseCase;

const TENANT_ID = 'tenant-01';

describe('UpdateCipaMandateUseCase', () => {
  beforeEach(() => {
    cipaMandatesRepository = new InMemoryCipaMandatesRepository();
    sut = new UpdateCipaMandateUseCase(cipaMandatesRepository);
  });

  it('should update a CIPA mandate name', async () => {
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
      name: 'CIPA 2026/2027 - Atualizado',
    });

    expect(cipaMandate.name).toBe('CIPA 2026/2027 - Atualizado');
  });

  it('should update mandate status', async () => {
    const createdMandate = await cipaMandatesRepository.create({
      tenantId: TENANT_ID,
      name: 'CIPA 2026/2027',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
      status: 'DRAFT',
    });

    const { cipaMandate } = await sut.execute({
      tenantId: TENANT_ID,
      mandateId: createdMandate.id.toString(),
      status: 'ACTIVE',
    });

    expect(cipaMandate.status).toBe('ACTIVE');
  });

  it('should update mandate dates', async () => {
    const createdMandate = await cipaMandatesRepository.create({
      tenantId: TENANT_ID,
      name: 'CIPA 2026/2027',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
      status: 'ACTIVE',
    });

    const newStartDate = new Date('2026-02-01');
    const newEndDate = new Date('2027-02-01');

    const { cipaMandate } = await sut.execute({
      tenantId: TENANT_ID,
      mandateId: createdMandate.id.toString(),
      startDate: newStartDate,
      endDate: newEndDate,
    });

    expect(cipaMandate.startDate).toEqual(newStartDate);
    expect(cipaMandate.endDate).toEqual(newEndDate);
  });

  it('should update election date and notes', async () => {
    const createdMandate = await cipaMandatesRepository.create({
      tenantId: TENANT_ID,
      name: 'CIPA 2026/2027',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
      status: 'ACTIVE',
    });

    const electionDate = new Date('2025-12-01');

    const { cipaMandate } = await sut.execute({
      tenantId: TENANT_ID,
      mandateId: createdMandate.id.toString(),
      electionDate,
      notes: 'Eleição realizada com sucesso',
    });

    expect(cipaMandate.electionDate).toEqual(electionDate);
    expect(cipaMandate.notes).toBe('Eleição realizada com sucesso');
  });

  it('should trim name and notes on update', async () => {
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
      name: '  Novo Nome  ',
      notes: '  Notas atualizadas  ',
    });

    expect(cipaMandate.name).toBe('Novo Nome');
    expect(cipaMandate.notes).toBe('Notas atualizadas');
  });

  it('should preserve unchanged fields', async () => {
    const createdMandate = await cipaMandatesRepository.create({
      tenantId: TENANT_ID,
      name: 'CIPA 2026/2027',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
      status: 'ACTIVE',
      notes: 'Notas originais',
    });

    const { cipaMandate } = await sut.execute({
      tenantId: TENANT_ID,
      mandateId: createdMandate.id.toString(),
      name: 'Nome Atualizado',
    });

    expect(cipaMandate.name).toBe('Nome Atualizado');
    expect(cipaMandate.startDate).toEqual(new Date('2026-01-01'));
    expect(cipaMandate.endDate).toEqual(new Date('2027-01-01'));
    expect(cipaMandate.status).toBe('ACTIVE');
    expect(cipaMandate.notes).toBe('Notas originais');
  });

  it('should throw ResourceNotFoundError when mandate does not exist', async () => {
    const nonExistentId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        mandateId: nonExistentId,
        name: 'Novo Nome',
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
        name: 'Tentativa de Update',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
