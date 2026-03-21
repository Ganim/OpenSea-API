import { describe, it, expect, beforeEach } from 'vitest';
import { GetTenantBrandUseCase } from './get-tenant-brand';
import { InMemoryTenantBrandsRepository } from '@/repositories/sales/in-memory/in-memory-tenant-brands-repository';
import { TenantBrand } from '@/entities/sales/tenant-brand';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

let brandsRepository: InMemoryTenantBrandsRepository;
let sut: GetTenantBrandUseCase;

describe('GetTenantBrandUseCase', () => {
  beforeEach(() => {
    brandsRepository = new InMemoryTenantBrandsRepository();
    sut = new GetTenantBrandUseCase(brandsRepository);
  });

  it('should return existing brand', async () => {
    const brand = TenantBrand.create({
      tenantId: new UniqueEntityID('tenant-1'),
      primaryColor: '#FF0000',
    });
    brandsRepository.items.push(brand);

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.brand.primaryColor).toBe('#FF0000');
  });

  it('should create default brand when none exists', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.brand.primaryColor).toBe('#4F46E5');
    expect(result.brand.fontFamily).toBe('Inter');
    expect(brandsRepository.items).toHaveLength(1);
  });
});
