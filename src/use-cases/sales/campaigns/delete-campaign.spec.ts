import { InMemoryCampaignsRepository } from '@/repositories/sales/in-memory/in-memory-campaigns-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCampaignUseCase } from './create-campaign';
import { DeleteCampaignUseCase } from './delete-campaign';

let campaignsRepository: InMemoryCampaignsRepository;
let createCampaign: CreateCampaignUseCase;
let sut: DeleteCampaignUseCase;

describe('Delete Campaign Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    campaignsRepository = new InMemoryCampaignsRepository();
    createCampaign = new CreateCampaignUseCase(campaignsRepository);
    sut = new DeleteCampaignUseCase(campaignsRepository);
  });

  it('should soft delete a campaign', async () => {
    const { campaign: created } = await createCampaign.execute({
      tenantId: TENANT_ID,
      name: 'Campaign to Delete',
      type: 'PERCENTAGE',
      discountValue: 10,
      applicableTo: 'ALL',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      id: created.campaignId.toString(),
    });

    expect(result.message).toBe('Campaign deleted successfully.');

    const found = await campaignsRepository.findById(
      created.campaignId,
      TENANT_ID,
    );
    expect(found).toBeNull();
  });
});
