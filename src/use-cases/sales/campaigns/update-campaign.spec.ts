import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCampaignsRepository } from '@/repositories/sales/in-memory/in-memory-campaigns-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCampaignUseCase } from './create-campaign';
import { UpdateCampaignUseCase } from './update-campaign';

let campaignsRepository: InMemoryCampaignsRepository;
let createCampaign: CreateCampaignUseCase;
let sut: UpdateCampaignUseCase;

describe('Update Campaign Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    campaignsRepository = new InMemoryCampaignsRepository();
    createCampaign = new CreateCampaignUseCase(campaignsRepository);
    sut = new UpdateCampaignUseCase(campaignsRepository);
  });

  it('should update a campaign', async () => {
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
      name: 'Winter Sale',
      discountValue: 30,
    });

    expect(campaign.name).toBe('Winter Sale');
    expect(campaign.discountValue).toBe(30);
  });

  it('should throw if campaign not found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: 'non-existent-id',
        name: 'Updated',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
