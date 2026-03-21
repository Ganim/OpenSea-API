import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCampaignsRepository } from '@/repositories/sales/in-memory/in-memory-campaigns-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCampaignUseCase } from './create-campaign';
import { GetCampaignByIdUseCase } from './get-campaign-by-id';

let campaignsRepository: InMemoryCampaignsRepository;
let createCampaign: CreateCampaignUseCase;
let sut: GetCampaignByIdUseCase;

describe('Get Campaign By Id Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    campaignsRepository = new InMemoryCampaignsRepository();
    createCampaign = new CreateCampaignUseCase(campaignsRepository);
    sut = new GetCampaignByIdUseCase(campaignsRepository);
  });

  it('should get a campaign by id', async () => {
    const { campaign: created } = await createCampaign.execute({
      tenantId: TENANT_ID,
      name: 'Summer Sale',
      type: 'PERCENTAGE',
      discountValue: 20,
      applicableTo: 'ALL',
    });

    const { campaign } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.campaignId.toString(),
    });

    expect(campaign.name).toBe('Summer Sale');
    expect(campaign.campaignId.toString()).toBe(created.campaignId.toString());
  });

  it('should throw if campaign not found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: 'non-existent-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
