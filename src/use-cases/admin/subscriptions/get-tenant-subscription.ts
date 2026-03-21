import type { TenantSubscription } from '@/entities/core/tenant-subscription';
import type { TenantSubscriptionsRepository } from '@/repositories/core/tenant-subscriptions-repository';

interface GetTenantSubscriptionUseCaseRequest {
  tenantId: string;
}

interface GetTenantSubscriptionUseCaseResponse {
  subscriptions: TenantSubscription[];
}

export class GetTenantSubscriptionUseCase {
  constructor(
    private tenantSubscriptionsRepository: TenantSubscriptionsRepository,
  ) {}

  async execute({
    tenantId,
  }: GetTenantSubscriptionUseCaseRequest): Promise<GetTenantSubscriptionUseCaseResponse> {
    const subscriptions =
      await this.tenantSubscriptionsRepository.findByTenantId(tenantId);

    return { subscriptions };
  }
}
