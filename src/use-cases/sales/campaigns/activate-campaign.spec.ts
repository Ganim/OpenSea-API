import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCampaignsRepository } from '@/repositories/sales/in-memory/in-memory-campaigns-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ActivateCampaignUseCase } from './activate-campaign';
import { CreateCampaignUseCase } from './create-campaign';

let campaignsRepository: InMemoryCampaignsRepository;
let createCampaign: CreateCampaignUseCase;
let sut: ActivateCampaignUseCase;

describe('Activate Campaign Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    campaignsRepository = new InMemoryCampaignsRepository();
    createCampaign = new CreateCampaignUseCase(campaignsRepository);
    sut = new ActivateCampaignUseCase(campaignsRepository);
  });

  it('should activate a DRAFT campaign to ACTIVE', async () => {
    const { campaign: created } = await createCampaign.execute({
      tenantId: TENANT_ID,
      name: 'Campaign',
      type: 'PERCENTAGE',
      discountValue: 10,
      applicableTo: 'ALL',
    });

    const { campaign } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.campaignId.toString(),
      targetStatus: 'ACTIVE',
    });

    expect(campaign.status).toBe('ACTIVE');
  });

  it('should schedule a DRAFT campaign to SCHEDULED', async () => {
    const { campaign: created } = await createCampaign.execute({
      tenantId: TENANT_ID,
      name: 'Campaign',
      type: 'PERCENTAGE',
      discountValue: 10,
      applicableTo: 'ALL',
    });

    const { campaign } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.campaignId.toString(),
      targetStatus: 'SCHEDULED',
    });

    expect(campaign.status).toBe('SCHEDULED');
  });

  it('should not allow activating an ENDED campaign', async () => {
    const { campaign: created } = await createCampaign.execute({
      tenantId: TENANT_ID,
      name: 'Campaign',
      type: 'PERCENTAGE',
      discountValue: 10,
      applicableTo: 'ALL',
    });

    // Transition: DRAFT -> ACTIVE -> ENDED
    created.activate();
    created.end();

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: created.campaignId.toString(),
        targetStatus: 'ACTIVE',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if campaign not found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: 'non-existent-id',
        targetStatus: 'ACTIVE',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
