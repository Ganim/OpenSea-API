import type { TenantSubscription } from '@/entities/core/tenant-subscription';
import type { SkillPricingRepository } from '@/repositories/core/skill-pricing-repository';
import type { TenantSubscriptionsRepository } from '@/repositories/core/tenant-subscriptions-repository';

interface GetTenantSubscriptionUseCaseRequest {
  tenantId: string;
}

interface GetTenantSubscriptionUseCaseResponse {
  subscriptions: TenantSubscription[];
  totalMRR: number;
}

export class GetTenantSubscriptionUseCase {
  constructor(
    private tenantSubscriptionsRepository: TenantSubscriptionsRepository,
    private skillPricingRepository: SkillPricingRepository,
  ) {}

  async execute({
    tenantId,
  }: GetTenantSubscriptionUseCaseRequest): Promise<GetTenantSubscriptionUseCaseResponse> {
    const activeSubscriptions =
      await this.tenantSubscriptionsRepository.findActiveByTenantId(tenantId);

    let totalMRR = 0;

    for (const subscription of activeSubscriptions) {
      const effectivePrice = await this.resolveEffectivePrice(subscription);
      totalMRR += effectivePrice * subscription.quantity;
    }

    return {
      subscriptions: activeSubscriptions,
      totalMRR,
    };
  }

  private async resolveEffectivePrice(
    subscription: TenantSubscription,
  ): Promise<number> {
    if (subscription.customPrice !== null) {
      return this.applyDiscount(
        subscription.customPrice,
        subscription.discountPercent,
      );
    }

    const pricing = await this.skillPricingRepository.findBySkillCode(
      subscription.skillCode,
    );

    if (!pricing || pricing.flatPrice === null) {
      return 0;
    }

    return this.applyDiscount(pricing.flatPrice, subscription.discountPercent);
  }

  private applyDiscount(price: number, discountPercent: number | null): number {
    if (discountPercent === null || discountPercent === 0) {
      return price;
    }

    return price * (1 - discountPercent / 100);
  }
}
