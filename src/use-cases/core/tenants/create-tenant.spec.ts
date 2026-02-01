import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryPlansRepository } from '@/repositories/core/in-memory/in-memory-plans-repository';
import { InMemoryTenantPlansRepository } from '@/repositories/core/in-memory/in-memory-tenant-plans-repository';
import { InMemoryTenantUsersRepository } from '@/repositories/core/in-memory/in-memory-tenant-users-repository';
import { InMemoryTenantsRepository } from '@/repositories/core/in-memory/in-memory-tenants-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateTenantUseCase } from './create-tenant';

let tenantsRepository: InMemoryTenantsRepository;
let tenantUsersRepository: InMemoryTenantUsersRepository;
let tenantPlansRepository: InMemoryTenantPlansRepository;
let plansRepository: InMemoryPlansRepository;
let sut: CreateTenantUseCase;

describe('CreateTenantUseCase', () => {
  beforeEach(() => {
    tenantsRepository = new InMemoryTenantsRepository();
    tenantUsersRepository = new InMemoryTenantUsersRepository();
    tenantPlansRepository = new InMemoryTenantPlansRepository();
    plansRepository = new InMemoryPlansRepository();
    sut = new CreateTenantUseCase(
      tenantsRepository,
      tenantUsersRepository,
      tenantPlansRepository,
      plansRepository,
    );
  });

  it('should create a tenant and assign user as owner', async () => {
    const { tenant } = await sut.execute({
      name: 'Acme Corp',
      userId: 'user-1',
    });
    expect(tenant).toBeDefined();
    expect(tenant.name).toBe('Acme Corp');
    expect(tenantUsersRepository.items).toHaveLength(1);
    expect(tenantUsersRepository.items[0].role).toBe('owner');
  });

  it('should auto-assign Free plan when available', async () => {
    await plansRepository.create({ name: 'Free' });
    await sut.execute({ name: 'Test Corp', userId: 'user-1' });
    expect(tenantPlansRepository.items).toHaveLength(1);
  });

  it('should throw BadRequestError when name is empty', async () => {
    await expect(() =>
      sut.execute({ name: '', userId: 'user-1' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError when slug already exists', async () => {
    await sut.execute({ name: 'First', slug: 'same-slug', userId: 'user-1' });
    await expect(() =>
      sut.execute({ name: 'Second', slug: 'same-slug', userId: 'user-2' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError when name exceeds 128 characters', async () => {
    const longName = 'A'.repeat(129);
    await expect(() =>
      sut.execute({ name: longName, userId: 'user-1' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
