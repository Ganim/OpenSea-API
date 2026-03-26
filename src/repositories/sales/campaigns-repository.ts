import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  Campaign,
  CampaignApplicableTo,
  CampaignProductProps,
  CampaignRuleProps,
  CampaignStatus,
  CampaignType,
} from '@/entities/sales/campaign';
import type { PaginatedResult } from '@/repositories/pagination-params';

export interface CreateCampaignSchema {
  tenantId: string;
  createdByUserId: string;
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

export interface UpdateCampaignSchema {
  id: UniqueEntityID;
  tenantId: string;
  name?: string;
  description?: string;
  type?: CampaignType;
  status?: CampaignStatus;
  discountValue?: number;
  applicableTo?: CampaignApplicableTo;
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

export interface FindManyCampaignsParams {
  tenantId: string;
  page: number;
  limit: number;
  status?: CampaignStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CampaignsRepository {
  create(data: CreateCampaignSchema): Promise<Campaign>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Campaign | null>;
  findManyPaginated(
    params: FindManyCampaignsParams,
  ): Promise<PaginatedResult<Campaign>>;
  findActive(tenantId: string): Promise<Campaign[]>;
  update(data: UpdateCampaignSchema): Promise<Campaign | null>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
  incrementUsage(id: UniqueEntityID, tenantId: string): Promise<void>;
}
