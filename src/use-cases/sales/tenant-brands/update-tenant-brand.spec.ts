import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateTenantBrandUseCase } from './update-tenant-brand';
import { InMemoryTenantBrandsRepository } from '@/repositories/sales/in-memory/in-memory-tenant-brands-repository';
import { TenantBrand } from '@/entities/sales/tenant-brand';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

let brandsRepository: InMemoryTenantBrandsRepository;
let sut: UpdateTenantBrandUseCase;

describe('UpdateTenantBrandUseCase', () => {
  beforeEach(() => {
    brandsRepository = new InMemoryTenantBrandsRepository();
    sut = new UpdateTenantBrandUseCase(brandsRepository);
  });

  it('should update brand colors', async () => {
    const brand = TenantBrand.create({
      tenantId: new UniqueEntityID('tenant-1'),
    });
    brandsRepository.items.push(brand);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      primaryColor: '#FF0000',
      fontFamily: 'Roboto',
    });

    expect(result.brand.primaryColor).toBe('#FF0000');
    expect(result.brand.fontFamily).toBe('Roboto');
  });

  it('should throw when brand not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'non-existent',
        primaryColor: '#FF0000',
      }),
    ).rejects.toThrow('Brand not found');
  });
});
