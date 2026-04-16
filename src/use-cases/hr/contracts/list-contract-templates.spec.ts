import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryContractTemplatesRepository } from '@/repositories/hr/in-memory/in-memory-contract-templates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListContractTemplatesUseCase } from './list-contract-templates';

let contractTemplatesRepository: InMemoryContractTemplatesRepository;
let sut: ListContractTemplatesUseCase;

const tenantId = new UniqueEntityID().toString();

describe('List Contract Templates Use Case', () => {
  beforeEach(() => {
    contractTemplatesRepository = new InMemoryContractTemplatesRepository();
    sut = new ListContractTemplatesUseCase(contractTemplatesRepository);
  });

  async function seed() {
    await contractTemplatesRepository.create({
      tenantId,
      name: 'CLT Padrão',
      type: 'CLT',
      content: 'A',
      isActive: true,
    });
    await contractTemplatesRepository.create({
      tenantId,
      name: 'PJ Consultor',
      type: 'PJ',
      content: 'B',
      isActive: true,
    });
    await contractTemplatesRepository.create({
      tenantId,
      name: 'Estagiário',
      type: 'INTERN',
      content: 'C',
      isActive: false,
    });
  }

  it('returns paginated templates with metadata', async () => {
    await seed();

    const result = await sut.execute({ tenantId });

    expect(result.templates).toHaveLength(3);
    expect(result.meta).toEqual({
      total: 3,
      page: 1,
      perPage: 20,
      totalPages: 1,
    });
  });

  it('filters by template type', async () => {
    await seed();

    const result = await sut.execute({ tenantId, type: 'PJ' });

    expect(result.templates).toHaveLength(1);
    expect(result.templates[0].name).toBe('PJ Consultor');
  });

  it('filters by isActive flag', async () => {
    await seed();

    const result = await sut.execute({ tenantId, isActive: false });

    expect(result.templates).toHaveLength(1);
    expect(result.templates[0].name).toBe('Estagiário');
  });

  it('filters by search keyword (case insensitive)', async () => {
    await seed();

    const result = await sut.execute({ tenantId, search: 'estagi' });

    expect(result.templates).toHaveLength(1);
    expect(result.templates[0].name).toBe('Estagiário');
  });

  it('isolates results per tenant', async () => {
    await seed();
    const otherTenantId = new UniqueEntityID().toString();
    await contractTemplatesRepository.create({
      tenantId: otherTenantId,
      name: 'Outro Tenant',
      type: 'CLT',
      content: 'X',
    });

    const result = await sut.execute({ tenantId });
    expect(
      result.templates.every((t) => t.tenantId.toString() === tenantId),
    ).toBe(true);
  });
});
