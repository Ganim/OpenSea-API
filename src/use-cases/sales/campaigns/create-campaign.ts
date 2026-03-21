import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { Campaign, CampaignApplicableTo, CampaignType } from '@/entities/sales/campaign';
import type { CampaignProductProps, CampaignRuleProps } from '@/entities/sales/campaign';
import type { CampaignsRepository } from '@/repositories/sales/campaigns-repository';

interface CreateCampaignUseCaseRequest {
  tenantId: string;
  name: string;
  description?: string;
  type: CampaignType;
  discountValue: number;
  applicableTo: CampaignApplicableTo;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  maxUsageTotal?: number;
  maxUsagePerCustomer?: number;
  startDate?: Date;
  endDate?: Date;
  rules?: CampaignRuleProps[];
  products?: CampaignProductProps[];
  categoryIds?: string[];
  priority?: number;
  isStackable?: boolean;
}

interface CreateCampaignUseCaseResponse {
  campaign: Campaign;
}

export class CreateCampaignUseCase {
  constructor(private campaignsRepository: CampaignsRepository) {}

  async execute(
    request: CreateCampaignUseCaseRequest,
  ): Promise<CreateCampaignUseCaseResponse> {
    if (!request.name || request.name.trim().length === 0) {
      throw new BadRequestError('Campaign name is required.');
    }

    if (
      request.startDate &&
      request.endDate &&
      request.endDate < request.startDate
    ) {
      throw new BadRequestError('End date must be after start date.');
    }

    const campaign = await this.campaignsRepository.create({
      tenantId: request.tenantId,
      name: request.name.trim(),
      description: request.description,
      type: request.type,
      discountValue: request.discountValue,
      applicableTo: request.applicableTo,
      minOrderValue: request.minOrderValue,
      maxDiscountAmount: request.maxDiscountAmount,
      maxUsageTotal: request.maxUsageTotal,
      maxUsagePerCustomer: request.maxUsagePerCustomer,
      startDate: request.startDate,
      endDate: request.endDate,
      rules: request.rules,
      products: request.products,
      categoryIds: request.categoryIds,
      priority: request.priority,
      isStackable: request.isStackable,
    });

    return { campaign };
  }
}
