import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryTenantUsersRepository } from '@/repositories/core/in-memory/in-memory-tenant-users-repository';
import { InMemoryTenantsRepository } from '@/repositories/core/in-memory/in-memory-tenants-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { SelectTenantUseCase } from './select-tenant';

let tenantsRepository: InMemoryTenantsRepository;
let tenantUsersRepository: InMemoryTenantUsersRepository;
let sut: SelectTenantUseCase;

import type { FastifyReply } from 'fastify';

const mockReply = {
  jwtSign: async () => 'mock-token',
} as unknown as FastifyReply;

describe('SelectTenantUseCase', () => {
  beforeEach(() => {
    tenantsRepository = new InMemoryTenantsRepository();
    tenantUsersRepository = new InMemoryTenantUsersRepository();
    sut = new SelectTenantUseCase(tenantsRepository, tenantUsersRepository);
  });

  it('should select a tenant and return a token', async () => {
    const userId = new UniqueEntityID();
    const tenant = await tenantsRepository.create({
      name: 'Test',
      slug: 'test',
    });
    await tenantUsersRepository.create({
      tenantId: tenant.tenantId,
      userId,
      role: 'member',
    });
    const { token, tenant: sel } = await sut.execute({
      userId: userId.toString(),
      tenantId: tenant.tenantId.toString(),
      sessionId: 's1',
      isSuperAdmin: false,
      reply: mockReply,
    });
    expect(token).toBe('mock-token');
    expect(sel.name).toBe('Test');
  });

  it('should throw ResourceNotFoundError for non-existent tenant', async () => {
    await expect(() =>
      sut.execute({
        userId: 'u',
        tenantId: 'no',
        sessionId: 's',
        isSuperAdmin: false,
        reply: mockReply,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ForbiddenError when tenant is not active', async () => {
    const t = await tenantsRepository.create({
      name: 'I',
      slug: 'i',
      status: 'INACTIVE',
    });
    await expect(() =>
      sut.execute({
        userId: 'u',
        tenantId: t.tenantId.toString(),
        sessionId: 's',
        isSuperAdmin: false,
        reply: mockReply,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw ForbiddenError when user is not a member', async () => {
    const t = await tenantsRepository.create({ name: 'T', slug: 't' });
    await expect(() =>
      sut.execute({
        userId: 'no-member',
        tenantId: t.tenantId.toString(),
        sessionId: 's',
        isSuperAdmin: false,
        reply: mockReply,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
