import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { LandingPage } from '@/entities/sales/landing-page';
import { InMemoryLandingPagesRepository } from '@/repositories/sales/in-memory/in-memory-landing-pages-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UnpublishLandingPageUseCase } from './unpublish-landing-page';

let landingPagesRepository: InMemoryLandingPagesRepository;
let unpublishLandingPage: UnpublishLandingPageUseCase;

describe('UnpublishLandingPageUseCase', () => {
  beforeEach(() => {
    landingPagesRepository = new InMemoryLandingPagesRepository();
    unpublishLandingPage = new UnpublishLandingPageUseCase(
      landingPagesRepository,
    );
  });

  it('should unpublish a published landing page', async () => {
    const landingPage = LandingPage.create({
      tenantId: new UniqueEntityID('tenant-1'),
      title: 'Published Page',
      slug: 'published-page',
      createdBy: 'user-1',
      status: 'PUBLISHED',
      isPublished: true,
    });
    landingPagesRepository.items.push(landingPage);

    const result = await unpublishLandingPage.execute({
      tenantId: 'tenant-1',
      landingPageId: landingPage.id.toString(),
    });

    expect(result.landingPage.status).toBe('DRAFT');
    expect(result.landingPage.isPublished).toBe(false);
  });

  it('should not unpublish a draft page', async () => {
    const landingPage = LandingPage.create({
      tenantId: new UniqueEntityID('tenant-1'),
      title: 'Draft Page',
      slug: 'draft-page',
      createdBy: 'user-1',
      status: 'DRAFT',
    });
    landingPagesRepository.items.push(landingPage);

    await expect(() =>
      unpublishLandingPage.execute({
        tenantId: 'tenant-1',
        landingPageId: landingPage.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw if landing page not found', async () => {
    await expect(() =>
      unpublishLandingPage.execute({
        tenantId: 'tenant-1',
        landingPageId: 'non-existent-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
