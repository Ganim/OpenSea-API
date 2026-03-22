import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { TenantSubscriptionsRepository } from '@/repositories/core/tenant-subscriptions-repository';

interface ApplyTenantDiscountUseCaseRequest {
  tenantId: string;
  skillCode?: string;
  discountPercent?: number;
  customPrice?: number;
  notes?: string;
  grantedBy?: string;
}

interface ApplyTenantDiscountUseCaseResponse {
  updated: number;
}

export class ApplyTenantDiscountUseCase {
  constructor(
    private tenantSubscriptionsRepository: TenantSubscriptionsRepository,
  ) {}

  async execute({
    tenantId,
    skillCode,
    discountPercent,
    customPrice,
    notes,
    grantedBy,
  }: ApplyTenantDiscountUseCaseRequest): Promise<ApplyTenantDiscountUseCaseResponse> {
    if (discountPercent === undefined && customPrice === undefined) {
      throw new BadRequestError(
        'Either discountPercent or customPrice must be provided',
      );
    }

    if (
      discountPercent !== undefined &&
      (discountPercent < 0 || discountPercent > 100)
    ) {
      throw new BadRequestError('Discount percent must be between 0 and 100');
    }

    if (skillCode) {
      return this.applyToSingleSubscription({
        tenantId,
        skillCode,
        discountPercent,
        customPrice,
        notes,
        grantedBy,
      });
    }

    return this.applyToAllSubscriptions({
      tenantId,
      discountPercent,
      notes,
      grantedBy,
    });
  }

  private async applyToSingleSubscription({
    tenantId,
    skillCode,
    discountPercent,
    customPrice,
    notes,
    grantedBy,
  }: {
    tenantId: string;
    skillCode: string;
    discountPercent?: number;
    customPrice?: number;
    notes?: string;
    grantedBy?: string;
  }): Promise<ApplyTenantDiscountUseCaseResponse> {
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

    if (discountPercent !== undefined)
      subscription.discountPercent = discountPercent;
    if (customPrice !== undefined) subscription.customPrice = customPrice;
    if (notes !== undefined) subscription.notes = notes;
    if (grantedBy !== undefined) {
      subscription.metadata = {
        ...subscription.metadata,
        discountGrantedBy: grantedBy,
      };
    }

    await this.tenantSubscriptionsRepository.save(subscription);

    return { updated: 1 };
  }

  private async applyToAllSubscriptions({
    tenantId,
    discountPercent,
    notes,
    grantedBy,
  }: {
    tenantId: string;
    discountPercent?: number;
    notes?: string;
    grantedBy?: string;
  }): Promise<ApplyTenantDiscountUseCaseResponse> {
    const activeSubscriptions =
      await this.tenantSubscriptionsRepository.findActiveByTenantId(tenantId);

    if (activeSubscriptions.length === 0) {
      return { updated: 0 };
    }

    for (const subscription of activeSubscriptions) {
      if (discountPercent !== undefined)
        subscription.discountPercent = discountPercent;
      if (notes !== undefined) subscription.notes = notes;
      if (grantedBy !== undefined) {
        subscription.metadata = {
          ...subscription.metadata,
          discountGrantedBy: grantedBy,
        };
      }

      await this.tenantSubscriptionsRepository.save(subscription);
    }

    return { updated: activeSubscriptions.length };
  }
}
