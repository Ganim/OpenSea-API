import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { TenantSubscription } from '@/entities/core/tenant-subscription';
import type { TenantSubscriptionsRepository } from '@/repositories/core/tenant-subscriptions-repository';

interface ApplyTenantDiscountUseCaseRequest {
  tenantId: string;
  skillCode: string;
  discountPercent: number;
  notes?: string;
}

interface ApplyTenantDiscountUseCaseResponse {
  subscription: TenantSubscription;
}

export class ApplyTenantDiscountUseCase {
  constructor(
    private tenantSubscriptionsRepository: TenantSubscriptionsRepository,
  ) {}

  async execute({
    tenantId,
    skillCode,
    discountPercent,
    notes,
  }: ApplyTenantDiscountUseCaseRequest): Promise<ApplyTenantDiscountUseCaseResponse> {
    if (discountPercent < 0 || discountPercent > 100) {
      throw new BadRequestError('Discount percent must be between 0 and 100');
    }

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

    subscription.discountPercent = discountPercent;

    if (notes !== undefined) {
      subscription.notes = notes ?? null;
    }

    await this.tenantSubscriptionsRepository.save(subscription);

    return { subscription };
  }
}
