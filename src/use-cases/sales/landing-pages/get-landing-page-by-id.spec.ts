import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { LandingPage } from '@/entities/sales/landing-page';
import { InMemoryLandingPagesRepository } from '@/repositories/sales/in-memory/in-memory-landing-pages-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetLandingPageByIdUseCase } from './get-landing-page-by-id';

let landingPagesRepository: InMemoryLandingPagesRepository;
let getLandingPageById: GetLandingPageByIdUseCase;

describe('GetLandingPageByIdUseCase', () => {
  beforeEach(() => {
    landingPagesRepository = new InMemoryLandingPagesRepository();
    getLandingPageById = new GetLandingPageByIdUseCase(landingPagesRepository);
  });

  it('should return a landing page by id', async () => {
    const landingPage = LandingPage.create({
      tenantId: new UniqueEntityID('tenant-1'),
      title: 'My Page',
      slug: 'my-page',
      createdBy: 'user-1',
    });
    landingPagesRepository.items.push(landingPage);

    const result = await getLandingPageById.execute({
      tenantId: 'tenant-1',
      landingPageId: landingPage.id.toString(),
    });

    expect(result.landingPage.title).toBe('My Page');
    expect(result.landingPage.slug).toBe('my-page');
  });

  it('should throw if landing page not found', async () => {
    await expect(() =>
      getLandingPageById.execute({
        tenantId: 'tenant-1',
        landingPageId: 'non-existent-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
