import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryCampaignsRepository } from '@/repositories/sales/in-memory/in-memory-campaigns-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCampaignUseCase } from './create-campaign';

let campaignsRepository: InMemoryCampaignsRepository;
let sut: CreateCampaignUseCase;

describe('Create Campaign Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    campaignsRepository = new InMemoryCampaignsRepository();
    sut = new CreateCampaignUseCase(campaignsRepository);
  });

  it('should create a campaign with DRAFT status', async () => {
    const { campaign } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Summer Sale',
      description: '20% off all products',
      type: 'PERCENTAGE',
      discountValue: 20,
      applicableTo: 'ALL',
    });

    expect(campaign.campaignId.toString()).toEqual(expect.any(String));
    expect(campaign.name).toBe('Summer Sale');
    expect(campaign.status).toBe('DRAFT');
    expect(campaign.type).toBe('PERCENTAGE');
    expect(campaign.discountValue).toBe(20);
    expect(campaign.applicableTo).toBe('ALL');
  });

  it('should not create a campaign with empty name', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        name: '',
        type: 'PERCENTAGE',
        discountValue: 10,
        applicableTo: 'ALL',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not create a campaign with end date before start date', async () => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - 86400000);

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Invalid Campaign',
        type: 'PERCENTAGE',
        discountValue: 10,
        applicableTo: 'ALL',
        startDate: now,
        endDate: pastDate,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should create a campaign with all optional fields', async () => {
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 86400000 * 30);

    const { campaign } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Full Campaign',
      description: 'Complete campaign',
      type: 'FIXED_AMOUNT',
      discountValue: 50,
      applicableTo: 'SPECIFIC_PRODUCTS',
      minOrderValue: 100,
      maxDiscountAmount: 200,
      maxUsageTotal: 1000,
      maxUsagePerCustomer: 5,
      startDate,
      endDate,
      priority: 10,
      isStackable: true,
    });

    expect(campaign.name).toBe('Full Campaign');
    expect(campaign.minOrderValue).toBe(100);
    expect(campaign.maxUsageTotal).toBe(1000);
    expect(campaign.priority).toBe(10);
    expect(campaign.isStackable).toBe(true);
  });
});
