import type { Campaign } from '@/entities/sales/campaign';

export interface CampaignDTO {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  discountValue: number;
  applicableTo: string;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  maxUsageTotal?: number;
  maxUsagePerCustomer?: number;
  currentUsageTotal: number;
  startDate?: Date;
  endDate?: Date;
  priority: number;
  isStackable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function campaignToDTO(campaign: Campaign): CampaignDTO {
  const dto: CampaignDTO = {
    id: campaign.campaignId.toString(),
    tenantId: campaign.tenantId.toString(),
    name: campaign.name,
    type: campaign.type,
    status: campaign.status,
    discountValue: campaign.discountValue,
    applicableTo: campaign.applicableTo,
    currentUsageTotal: campaign.currentUsageTotal,
    priority: campaign.priority,
    isStackable: campaign.isStackable,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
  };

  if (campaign.description) dto.description = campaign.description;
  if (campaign.minOrderValue !== undefined) dto.minOrderValue = campaign.minOrderValue;
  if (campaign.maxDiscountAmount !== undefined) dto.maxDiscountAmount = campaign.maxDiscountAmount;
  if (campaign.maxUsageTotal !== undefined) dto.maxUsageTotal = campaign.maxUsageTotal;
  if (campaign.maxUsagePerCustomer !== undefined) dto.maxUsagePerCustomer = campaign.maxUsagePerCustomer;
  if (campaign.startDate) dto.startDate = campaign.startDate;
  if (campaign.endDate) dto.endDate = campaign.endDate;

  return dto;
}
