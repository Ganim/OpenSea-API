import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Campaign } from '@/entities/sales/campaign';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  CampaignsRepository,
  CreateCampaignSchema,
  FindManyCampaignsParams,
  UpdateCampaignSchema,
} from '../campaigns-repository';

export class InMemoryCampaignsRepository implements CampaignsRepository {
  public items: Campaign[] = [];

  async create(data: CreateCampaignSchema): Promise<Campaign> {
    const campaign = Campaign.create({
      tenantId: new EntityID(data.tenantId),
      name: data.name,
      description: data.description,
      type: data.type,
      discountValue: data.discountValue,
      applicableTo: data.applicableTo,
      minOrderValue: data.minOrderValue,
      maxDiscountAmount: data.maxDiscountAmount,
      maxUsageTotal: data.maxUsageTotal,
      maxUsagePerCustomer: data.maxUsagePerCustomer,
      startDate: data.startDate,
      endDate: data.endDate,
      rules: data.rules ?? [],
      products: data.products ?? [],
      categoryIds: data.categoryIds ?? [],
      priority: data.priority ?? 0,
      isStackable: data.isStackable ?? false,
    });

    this.items.push(campaign);
    return campaign;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Campaign | null> {
    const campaign = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    return campaign ?? null;
  }

  async findManyPaginated(
    params: FindManyCampaignsParams,
  ): Promise<PaginatedResult<Campaign>> {
    let filtered = this.items.filter(
      (item) => !item.deletedAt && item.tenantId.toString() === params.tenantId,
    );

    if (params.status) {
      filtered = filtered.filter((item) => item.status === params.status);
    }

    if (params.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(search) ||
          item.description?.toLowerCase().includes(search),
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / params.limit);
    const start = (params.page - 1) * params.limit;
    const data = filtered.slice(start, start + params.limit);

    return { data, total, page: params.page, limit: params.limit, totalPages };
  }

  async findActive(tenantId: string): Promise<Campaign[]> {
    return this.items.filter(
      (item) =>
        !item.deletedAt &&
        item.status === 'ACTIVE' &&
        item.tenantId.toString() === tenantId,
    );
  }

  async update(data: UpdateCampaignSchema): Promise<Campaign | null> {
    const campaign = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(data.id) &&
        item.tenantId.toString() === data.tenantId,
    );
    if (!campaign) return null;

    if (data.name !== undefined) campaign.name = data.name;
    if (data.description !== undefined) campaign.description = data.description;
    if (data.type !== undefined) campaign.type = data.type;
    if (data.status !== undefined) campaign.status = data.status;
    if (data.discountValue !== undefined)
      campaign.discountValue = data.discountValue;
    if (data.applicableTo !== undefined)
      campaign.applicableTo = data.applicableTo;

    return campaign;
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    const campaign = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    if (campaign) {
      campaign.delete();
    }
  }

  async incrementUsage(id: UniqueEntityID, tenantId: string): Promise<void> {
    const campaign = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    if (campaign) {
      campaign.incrementUsage();
    }
  }
}
