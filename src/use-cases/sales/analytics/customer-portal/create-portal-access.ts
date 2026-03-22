import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { randomBytes } from 'crypto';
import type { CustomerPortalAccessDTO } from '@/mappers/sales/analytics/portal-access-to-dto';
import { portalAccessToDTO } from '@/mappers/sales/analytics/portal-access-to-dto';
import { CustomerPortalAccessesRepository } from '@/repositories/sales/customer-portal-accesses-repository';

interface CreatePortalAccessUseCaseRequest {
  tenantId: string;
  customerId: string;
  contactId?: string;
  permissions?: Record<string, boolean>;
  expiresAt?: string;
}

interface CreatePortalAccessUseCaseResponse {
  access: CustomerPortalAccessDTO;
}

export class CreatePortalAccessUseCase {
  constructor(
    private portalAccessesRepository: CustomerPortalAccessesRepository,
  ) {}

  async execute(
    input: CreatePortalAccessUseCaseRequest,
  ): Promise<CreatePortalAccessUseCaseResponse> {
    if (!input.customerId) {
      throw new BadRequestError('Customer ID is required.');
    }

    const accessToken = randomBytes(32).toString('hex');

    const expiresAt = input.expiresAt ? new Date(input.expiresAt) : undefined;
    if (expiresAt && isNaN(expiresAt.getTime())) {
      throw new BadRequestError('Invalid expiration date format.');
    }

    const access = await this.portalAccessesRepository.create({
      tenantId: input.tenantId,
      customerId: input.customerId,
      accessToken,
      contactId: input.contactId,
      permissions: input.permissions,
      expiresAt,
    });

    return { access: portalAccessToDTO(access) };
  }
}
