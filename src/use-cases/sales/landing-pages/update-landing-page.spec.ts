import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { LandingPage } from '@/entities/sales/landing-page';
import { InMemoryLandingPagesRepository } from '@/repositories/sales/in-memory/in-memory-landing-pages-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateLandingPageUseCase } from './update-landing-page';

let landingPagesRepository: InMemoryLandingPagesRepository;
let updateLandingPage: UpdateLandingPageUseCase;

describe('UpdateLandingPageUseCase', () => {
  beforeEach(() => {
    landingPagesRepository = new InMemoryLandingPagesRepository();
    updateLandingPage = new UpdateLandingPageUseCase(landingPagesRepository);
  });

  it('should update a landing page title', async () => {
    const landingPage = LandingPage.create({
      tenantId: new UniqueEntityID('tenant-1'),
      title: 'Old Title',
      slug: 'old-title',
      createdBy: 'user-1',
    });
    landingPagesRepository.items.push(landingPage);

    const result = await updateLandingPage.execute({
      tenantId: 'tenant-1',
      landingPageId: landingPage.id.toString(),
      title: 'New Title',
    });

    expect(result.landingPage.title).toBe('New Title');
  });

  it('should update content and template', async () => {
    const landingPage = LandingPage.create({
      tenantId: new UniqueEntityID('tenant-1'),
      title: 'Page',
      slug: 'page',
      createdBy: 'user-1',
    });
    landingPagesRepository.items.push(landingPage);

    const result = await updateLandingPage.execute({
      tenantId: 'tenant-1',
      landingPageId: landingPage.id.toString(),
      template: 'product-showcase',
      content: { hero: { heading: 'New Content' } },
    });

    expect(result.landingPage.template).toBe('product-showcase');
    expect(result.landingPage.content).toEqual({
      hero: { heading: 'New Content' },
    });
  });

  it('should not allow duplicate slug', async () => {
    const landingPageA = LandingPage.create({
      tenantId: new UniqueEntityID('tenant-1'),
      title: 'Page A',
      slug: 'page-a',
      createdBy: 'user-1',
    });
    const landingPageB = LandingPage.create({
      tenantId: new UniqueEntityID('tenant-1'),
      title: 'Page B',
      slug: 'page-b',
      createdBy: 'user-1',
    });
    landingPagesRepository.items.push(landingPageA, landingPageB);

    await expect(() =>
      updateLandingPage.execute({
        tenantId: 'tenant-1',
        landingPageId: landingPageB.id.toString(),
        slug: 'page-a',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw if landing page not found', async () => {
    await expect(() =>
      updateLandingPage.execute({
        tenantId: 'tenant-1',
        landingPageId: 'non-existent-id',
        title: 'Updated',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should update formId link', async () => {
    const landingPage = LandingPage.create({
      tenantId: new UniqueEntityID('tenant-1'),
      title: 'Page',
      slug: 'page',
      createdBy: 'user-1',
    });
    landingPagesRepository.items.push(landingPage);

    const result = await updateLandingPage.execute({
      tenantId: 'tenant-1',
      landingPageId: landingPage.id.toString(),
      formId: 'form-123',
    });

    expect(result.landingPage.formId).toBe('form-123');
  });
});
