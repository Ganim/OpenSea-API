import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TenantUsersRepository } from '@/repositories/core/tenant-users-repository';
import type { TenantsRepository } from '@/repositories/core/tenants-repository';
import type { FastifyReply } from 'fastify';

interface SelectTenantUseCaseRequest {
  userId: string;
  tenantId: string;
  sessionId: string;
  reply: FastifyReply;
}

interface SelectTenantUseCaseResponse {
  token: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
}

export class SelectTenantUseCase {
  constructor(
    private tenantsRepository: TenantsRepository,
    private tenantUsersRepository: TenantUsersRepository,
  ) {}

  async execute({
    userId,
    tenantId,
    sessionId,
    reply,
  }: SelectTenantUseCaseRequest): Promise<SelectTenantUseCaseResponse> {
    // Verify tenant exists and is active
    const tenant = await this.tenantsRepository.findById(
      new UniqueEntityID(tenantId),
    );

    if (!tenant) {
      throw new ResourceNotFoundError('Tenant not found');
    }

    if (!tenant.isActive) {
      throw new ForbiddenError('Tenant is not active');
    }

    // Verify user is a member of the tenant
    const membership = await this.tenantUsersRepository.findByTenantAndUser(
      new UniqueEntityID(tenantId),
      new UniqueEntityID(userId),
    );

    if (!membership) {
      throw new ForbiddenError('You are not a member of this tenant');
    }

    // Sign a new JWT with tenantId included
    const token = await reply.jwtSign(
      { sessionId, tenantId },
      { sign: { sub: userId } },
    );

    return {
      token,
      tenant: {
        id: tenant.tenantId.toString(),
        name: tenant.name,
        slug: tenant.slug,
      },
    };
  }
}
