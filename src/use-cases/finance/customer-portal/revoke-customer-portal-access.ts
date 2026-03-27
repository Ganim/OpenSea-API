import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { CustomerPortalAccessesRepository } from '@/repositories/finance/customer-portal-accesses-repository';

interface RevokeCustomerPortalAccessRequest {
  tenantId: string;
  id: string;
}

export class RevokeCustomerPortalAccessUseCase {
  constructor(
    private customerPortalAccessesRepository: CustomerPortalAccessesRepository,
  ) {}

  async execute({
    tenantId,
    id,
  }: RevokeCustomerPortalAccessRequest): Promise<void> {
    const access = await this.customerPortalAccessesRepository.findById(
      id,
      tenantId,
    );

    if (!access) {
      throw new ResourceNotFoundError(
        'Acesso ao portal do cliente não encontrado.',
      );
    }

    await this.customerPortalAccessesRepository.deactivate(id, tenantId);
  }
}
