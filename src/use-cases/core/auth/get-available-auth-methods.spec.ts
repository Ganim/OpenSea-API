import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryTenantAuthConfigRepository } from '@/repositories/core/in-memory/in-memory-tenant-auth-config-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetAvailableAuthMethodsUseCase } from './get-available-auth-methods';

let tenantAuthConfigRepository: InMemoryTenantAuthConfigRepository;
let sut: GetAvailableAuthMethodsUseCase;

describe('GetAvailableAuthMethodsUseCase', () => {
  beforeEach(() => {
    tenantAuthConfigRepository = new InMemoryTenantAuthConfigRepository();
    sut = new GetAvailableAuthMethodsUseCase(tenantAuthConfigRepository);
  });

  it('should return default methods when no tenantId is provided', async () => {
    const result = await sut.execute({ tenantId: undefined });

    expect(result.methods).toEqual(['EMAIL']);
    expect(result.magicLinkEnabled).toBe(false);
    expect(result.defaultMethod).toBeNull();
  });

  it('should return default methods when no config exists for tenant', async () => {
    const tenantId = new UniqueEntityID();
    const result = await sut.execute({ tenantId });

    expect(result.methods).toEqual(['EMAIL']);
    expect(result.magicLinkEnabled).toBe(false);
    expect(result.defaultMethod).toBeNull();
  });

  it('should return tenant config when it exists', async () => {
    const tenantId = new UniqueEntityID();

    await tenantAuthConfigRepository.create({
      tenantId,
      allowedMethods: ['EMAIL', 'CPF'],
      magicLinkEnabled: true,
      magicLinkExpiresIn: 30,
      defaultMethod: 'CPF',
    });

    const result = await sut.execute({ tenantId });

    expect(result.methods).toEqual(['EMAIL', 'CPF']);
    expect(result.magicLinkEnabled).toBe(true);
    expect(result.defaultMethod).toBe('CPF');
  });
});
