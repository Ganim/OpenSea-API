import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryCipaMandatesRepository } from '@/repositories/hr/in-memory/in-memory-cipa-mandates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCipaMandateUseCase } from './create-cipa-mandate';

let cipaMandatesRepository: InMemoryCipaMandatesRepository;
let sut: CreateCipaMandateUseCase;

const TENANT_ID = 'tenant-01';

describe('CreateCipaMandateUseCase', () => {
  beforeEach(() => {
    cipaMandatesRepository = new InMemoryCipaMandatesRepository();
    sut = new CreateCipaMandateUseCase(cipaMandatesRepository);
  });

  it('should create a CIPA mandate successfully', async () => {
    const startDate = new Date('2026-01-01');
    const endDate = new Date('2027-01-01');

    const { cipaMandate } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'CIPA 2026/2027',
      startDate,
      endDate,
      status: 'ACTIVE',
    });

    expect(cipaMandate).toBeDefined();
    expect(cipaMandate.name).toBe('CIPA 2026/2027');
    expect(cipaMandate.startDate).toEqual(startDate);
    expect(cipaMandate.endDate).toEqual(endDate);
    expect(cipaMandate.status).toBe('ACTIVE');
    expect(cipaMandate.tenantId.toString()).toBe(TENANT_ID);
  });

  it('should create a mandate with optional fields', async () => {
    const electionDate = new Date('2025-11-15');

    const { cipaMandate } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'CIPA 2026/2027',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
      status: 'DRAFT',
      electionDate,
      notes: 'Mandato inaugural da empresa',
    });

    expect(cipaMandate.electionDate).toEqual(electionDate);
    expect(cipaMandate.notes).toBe('Mandato inaugural da empresa');
    expect(cipaMandate.status).toBe('DRAFT');
  });

  it('should trim the mandate name', async () => {
    const { cipaMandate } = await sut.execute({
      tenantId: TENANT_ID,
      name: '  CIPA 2026/2027  ',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
    });

    expect(cipaMandate.name).toBe('CIPA 2026/2027');
  });

  it('should trim notes when provided', async () => {
    const { cipaMandate } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'CIPA 2026/2027',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
      notes: '  Notas com espaços  ',
    });

    expect(cipaMandate.notes).toBe('Notas com espaços');
  });

  it('should throw BadRequestError when name is empty', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: '',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2027-01-01'),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError when name is only whitespace', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: '   ',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2027-01-01'),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError when endDate is before startDate', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'CIPA 2026/2027',
        startDate: new Date('2027-01-01'),
        endDate: new Date('2026-01-01'),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError when endDate equals startDate', async () => {
    const sameDate = new Date('2026-01-01');

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'CIPA 2026/2027',
        startDate: sameDate,
        endDate: sameDate,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should default status to ACTIVE when not provided', async () => {
    const { cipaMandate } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'CIPA 2026/2027',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
    });

    expect(cipaMandate.status).toBe('ACTIVE');
  });

  it('should persist the mandate in the repository', async () => {
    const { cipaMandate } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'CIPA 2026/2027',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
    });

    const foundMandate = await cipaMandatesRepository.findById(
      cipaMandate.id,
      TENANT_ID,
    );

    expect(foundMandate).not.toBeNull();
    expect(foundMandate?.name).toBe('CIPA 2026/2027');
  });
});
