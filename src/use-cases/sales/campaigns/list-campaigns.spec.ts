import { InMemoryCampaignsRepository } from '@/repositories/sales/in-memory/in-memory-campaigns-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCampaignUseCase } from './create-campaign';
import { ListCampaignsUseCase } from './list-campaigns';

let campaignsRepository: InMemoryCampaignsRepository;
let createCampaign: CreateCampaignUseCase;
let sut: ListCampaignsUseCase;

describe('List Campaigns Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    campaignsRepository = new InMemoryCampaignsRepository();
    createCampaign = new CreateCampaignUseCase(campaignsRepository);
    sut = new ListCampaignsUseCase(campaignsRepository);
  });

  it('should list campaigns', async () => {
    await createCampaign.execute({
      tenantId: TENANT_ID,
      name: 'Campaign A',
      type: 'PERCENTAGE',
      discountValue: 10,
      applicableTo: 'ALL',
    });

    await createCampaign.execute({
      tenantId: TENANT_ID,
      name: 'Campaign B',
      type: 'FIXED_AMOUNT',
      discountValue: 50,
      applicableTo: 'ALL',
    });

    const { campaigns } = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
    });

    expect(campaigns.data).toHaveLength(2);
    expect(campaigns.total).toBe(2);
  });

  it('should filter campaigns by status', async () => {
    const { campaign } = await createCampaign.execute({
      tenantId: TENANT_ID,
      name: 'Active Campaign',
      type: 'PERCENTAGE',
      discountValue: 10,
      applicableTo: 'ALL',
    });

    campaign.activate();

    await createCampaign.execute({
      tenantId: TENANT_ID,
      name: 'Draft Campaign',
      type: 'PERCENTAGE',
      discountValue: 20,
      applicableTo: 'ALL',
    });

    const { campaigns: activeOnly } = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
      status: 'ACTIVE',
    });

    expect(activeOnly.data).toHaveLength(1);
    expect(activeOnly.data[0].name).toBe('Active Campaign');

    const { campaigns: draftOnly } = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
      status: 'DRAFT',
    });

    expect(draftOnly.data).toHaveLength(1);
    expect(draftOnly.data[0].name).toBe('Draft Campaign');
  });
});
