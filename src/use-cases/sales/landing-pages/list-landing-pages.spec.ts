import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { LandingPage } from '@/entities/sales/landing-page';
import { InMemoryLandingPagesRepository } from '@/repositories/sales/in-memory/in-memory-landing-pages-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListLandingPagesUseCase } from './list-landing-pages';

let landingPagesRepository: InMemoryLandingPagesRepository;
let listLandingPages: ListLandingPagesUseCase;

describe('ListLandingPagesUseCase', () => {
  beforeEach(() => {
    landingPagesRepository = new InMemoryLandingPagesRepository();
    listLandingPages = new ListLandingPagesUseCase(landingPagesRepository);
  });

  it('should list landing pages with pagination', async () => {
    for (let i = 0; i < 25; i++) {
      const landingPage = LandingPage.create({
        tenantId: new UniqueEntityID('tenant-1'),
        title: `Page ${i}`,
        slug: `page-${i}`,
        createdBy: 'user-1',
      });
      landingPagesRepository.items.push(landingPage);
    }

    const result = await listLandingPages.execute({
      tenantId: 'tenant-1',
      page: 1,
      perPage: 10,
    });

    expect(result.landingPages).toHaveLength(10);
    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(3);
  });

  it('should filter by status', async () => {
    const draftPage = LandingPage.create({
      tenantId: new UniqueEntityID('tenant-1'),
      title: 'Draft Page',
      slug: 'draft-page',
      createdBy: 'user-1',
      status: 'DRAFT',
    });

    const publishedPage = LandingPage.create({
      tenantId: new UniqueEntityID('tenant-1'),
      title: 'Published Page',
      slug: 'published-page',
      createdBy: 'user-1',
      status: 'PUBLISHED',
      isPublished: true,
    });

    landingPagesRepository.items.push(draftPage, publishedPage);

    const result = await listLandingPages.execute({
      tenantId: 'tenant-1',
      status: 'PUBLISHED',
    });

    expect(result.landingPages).toHaveLength(1);
    expect(result.landingPages[0].status).toBe('PUBLISHED');
  });

  it('should return empty list for tenant with no pages', async () => {
    const result = await listLandingPages.execute({
      tenantId: 'tenant-empty',
    });

    expect(result.landingPages).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
