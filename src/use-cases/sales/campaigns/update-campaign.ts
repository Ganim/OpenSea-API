import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  Campaign,
  CampaignApplicableTo,
  CampaignType,
} from '@/entities/sales/campaign';
import type { CampaignsRepository } from '@/repositories/sales/campaigns-repository';

interface UpdateCampaignUseCaseRequest {
  tenantId: string;
  id: string;
  name?: string;
  description?: string;
  type?: CampaignType;
  discountValue?: number;
  applicableTo?: CampaignApplicableTo;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  maxUsageTotal?: number;
  maxUsagePerCustomer?: number;
  startDate?: Date;
  endDate?: Date;
  priority?: number;
  isStackable?: boolean;
}

interface UpdateCampaignUseCaseResponse {
  campaign: Campaign;
}

export class UpdateCampaignUseCase {
  constructor(private campaignsRepository: CampaignsRepository) {}

  async execute(
    request: UpdateCampaignUseCaseRequest,
  ): Promise<UpdateCampaignUseCaseResponse> {
    const existing = await this.campaignsRepository.findById(
      new UniqueEntityID(request.id),
      request.tenantId,
    );

    if (!existing) {
      throw new ResourceNotFoundError('Campaign not found.');
    }

    const campaign = await this.campaignsRepository.update({
      id: new UniqueEntityID(request.id),
      tenantId: request.tenantId,
      name: request.name,
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
      priority: request.priority,
      isStackable: request.isStackable,
    });

    if (!campaign) {
      throw new ResourceNotFoundError('Campaign not found.');
    }

    return { campaign };
  }
}
