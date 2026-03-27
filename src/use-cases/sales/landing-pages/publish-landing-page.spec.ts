import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { LandingPage } from '@/entities/sales/landing-page';
import { InMemoryLandingPagesRepository } from '@/repositories/sales/in-memory/in-memory-landing-pages-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { PublishLandingPageUseCase } from './publish-landing-page';

let landingPagesRepository: InMemoryLandingPagesRepository;
let publishLandingPage: PublishLandingPageUseCase;

describe('PublishLandingPageUseCase', () => {
  beforeEach(() => {
    landingPagesRepository = new InMemoryLandingPagesRepository();
    publishLandingPage = new PublishLandingPageUseCase(landingPagesRepository);
  });

  it('should publish a draft landing page', async () => {
    const landingPage = LandingPage.create({
      tenantId: new UniqueEntityID('tenant-1'),
      title: 'Draft Page',
      slug: 'draft-page',
      createdBy: 'user-1',
      status: 'DRAFT',
    });
    landingPagesRepository.items.push(landingPage);

    const result = await publishLandingPage.execute({
      tenantId: 'tenant-1',
      landingPageId: landingPage.id.toString(),
    });

    expect(result.landingPage.status).toBe('PUBLISHED');
    expect(result.landingPage.isPublished).toBe(true);
    expect(result.landingPage.publishedAt).toBeDefined();
  });

  it('should not publish a page that is already published', async () => {
    const landingPage = LandingPage.create({
      tenantId: new UniqueEntityID('tenant-1'),
      title: 'Published Page',
      slug: 'published-page',
      createdBy: 'user-1',
      status: 'PUBLISHED',
      isPublished: true,
    });
    landingPagesRepository.items.push(landingPage);

    await expect(() =>
      publishLandingPage.execute({
        tenantId: 'tenant-1',
        landingPageId: landingPage.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw if landing page not found', async () => {
    await expect(() =>
      publishLandingPage.execute({
        tenantId: 'tenant-1',
        landingPageId: 'non-existent-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
