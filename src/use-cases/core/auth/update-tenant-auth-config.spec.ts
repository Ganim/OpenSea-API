import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryAuthLinksRepository } from '@/repositories/core/in-memory/in-memory-auth-links-repository';
import { InMemoryTenantAuthConfigRepository } from '@/repositories/core/in-memory/in-memory-tenant-auth-config-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateTenantAuthConfigUseCase } from './update-tenant-auth-config';

let tenantAuthConfigRepository: InMemoryTenantAuthConfigRepository;
let authLinksRepository: InMemoryAuthLinksRepository;
let sut: UpdateTenantAuthConfigUseCase;

describe('UpdateTenantAuthConfigUseCase', () => {
  beforeEach(() => {
    tenantAuthConfigRepository = new InMemoryTenantAuthConfigRepository();
    authLinksRepository = new InMemoryAuthLinksRepository();
    sut = new UpdateTenantAuthConfigUseCase(
      tenantAuthConfigRepository,
      authLinksRepository,
    );
  });

  it('should create config when none exists (upsert)', async () => {
    const tenantId = new UniqueEntityID();

    const result = await sut.execute({
      tenantId,
      allowedMethods: ['EMAIL', 'CPF'],
      magicLinkEnabled: true,
      magicLinkExpiresIn: 30,
      defaultMethod: 'EMAIL',
    });

    expect(result.config.tenantId).toBe(tenantId.toString());
    expect(result.config.allowedMethods).toEqual(['EMAIL', 'CPF']);
    expect(result.config.magicLinkEnabled).toBe(true);
    expect(result.config.magicLinkExpiresIn).toBe(30);
    expect(result.config.defaultMethod).toBe('EMAIL');
  });

  it('should update existing config (upsert)', async () => {
    const tenantId = new UniqueEntityID();

    // Create initial config
    await tenantAuthConfigRepository.create({
      tenantId,
      allowedMethods: ['EMAIL'],
      magicLinkEnabled: false,
      magicLinkExpiresIn: 15,
      defaultMethod: null,
    });

    const result = await sut.execute({
      tenantId,
      allowedMethods: ['EMAIL', 'CPF'],
      magicLinkEnabled: true,
    });

    expect(result.config.allowedMethods).toEqual(['EMAIL', 'CPF']);
    expect(result.config.magicLinkEnabled).toBe(true);
  });

  it('should handle partial updates correctly', async () => {
    const tenantId = new UniqueEntityID();

    // Create initial config
    await tenantAuthConfigRepository.create({
      tenantId,
      allowedMethods: ['EMAIL', 'CPF'],
      magicLinkEnabled: true,
      magicLinkExpiresIn: 30,
      defaultMethod: 'EMAIL',
    });

    // Only update magicLinkEnabled
    const result = await sut.execute({
      tenantId,
      magicLinkEnabled: false,
    });

    expect(result.config.magicLinkEnabled).toBe(false);
    // Other fields should remain unchanged
    expect(result.config.allowedMethods).toEqual(['EMAIL', 'CPF']);
  });
});
