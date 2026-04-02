import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryTenantAuthConfigRepository } from '@/repositories/core/in-memory/in-memory-tenant-auth-config-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetTenantAuthConfigUseCase } from './get-tenant-auth-config';

let tenantAuthConfigRepository: InMemoryTenantAuthConfigRepository;
let sut: GetTenantAuthConfigUseCase;

describe('GetTenantAuthConfigUseCase', () => {
  beforeEach(() => {
    tenantAuthConfigRepository = new InMemoryTenantAuthConfigRepository();
    sut = new GetTenantAuthConfigUseCase(tenantAuthConfigRepository);
  });

  it('should return existing config when tenant has one', async () => {
    const tenantId = new UniqueEntityID();

    await tenantAuthConfigRepository.create({
      tenantId,
      allowedMethods: ['EMAIL', 'CPF'],
      magicLinkEnabled: true,
      magicLinkExpiresIn: 30,
      defaultMethod: 'EMAIL',
    });

    const result = await sut.execute({ tenantId });

    expect(result.config.tenantId).toBe(tenantId.toString());
    expect(result.config.allowedMethods).toEqual(['EMAIL', 'CPF']);
    expect(result.config.magicLinkEnabled).toBe(true);
    expect(result.config.magicLinkExpiresIn).toBe(30);
    expect(result.config.defaultMethod).toBe('EMAIL');
  });

  it('should return default config when tenant has no config', async () => {
    const tenantId = new UniqueEntityID();

    const result = await sut.execute({ tenantId });

    expect(result.config.id).toBe('');
    expect(result.config.tenantId).toBe(tenantId.toString());
    expect(result.config.allowedMethods).toEqual(['EMAIL']);
    expect(result.config.magicLinkEnabled).toBe(false);
    expect(result.config.magicLinkExpiresIn).toBe(15);
    expect(result.config.defaultMethod).toBeNull();
  });
});
