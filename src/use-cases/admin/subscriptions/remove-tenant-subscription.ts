import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { TenantSubscriptionsRepository } from '@/repositories/core/tenant-subscriptions-repository';

interface RemoveTenantSubscriptionUseCaseRequest {
  tenantId: string;
  skillCode: string;
}

interface RemoveTenantSubscriptionUseCaseResponse {
  success: boolean;
}

export class RemoveTenantSubscriptionUseCase {
  constructor(
    private tenantSubscriptionsRepository: TenantSubscriptionsRepository,
  ) {}

  async execute({
    tenantId,
    skillCode,
  }: RemoveTenantSubscriptionUseCaseRequest): Promise<RemoveTenantSubscriptionUseCaseResponse> {
    const subscription =
      await this.tenantSubscriptionsRepository.findByTenantAndSkill(
        tenantId,
        skillCode,
      );

    if (!subscription) {
      throw new ResourceNotFoundError(
        `Subscription for skill "${skillCode}" not found for this tenant`,
      );
    }

    subscription.status = 'CANCELLED';
    subscription.cancelledAt = new Date();

    await this.tenantSubscriptionsRepository.save(subscription);

    return { success: true };
  }
}
