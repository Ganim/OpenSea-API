import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { LandingPage } from '@/entities/sales/landing-page';
import { InMemoryLandingPagesRepository } from '@/repositories/sales/in-memory/in-memory-landing-pages-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteLandingPageUseCase } from './delete-landing-page';

let landingPagesRepository: InMemoryLandingPagesRepository;
let deleteLandingPage: DeleteLandingPageUseCase;

describe('DeleteLandingPageUseCase', () => {
  beforeEach(() => {
    landingPagesRepository = new InMemoryLandingPagesRepository();
    deleteLandingPage = new DeleteLandingPageUseCase(landingPagesRepository);
  });

  it('should soft delete a landing page', async () => {
    const landingPage = LandingPage.create({
      tenantId: new UniqueEntityID('tenant-1'),
      title: 'Page to Delete',
      slug: 'page-to-delete',
      createdBy: 'user-1',
    });
    landingPagesRepository.items.push(landingPage);

    await deleteLandingPage.execute({
      tenantId: 'tenant-1',
      landingPageId: landingPage.id.toString(),
    });

    const deletedPage = landingPagesRepository.items.find((lp) =>
      lp.id.equals(landingPage.id),
    );
    expect(deletedPage?.deletedAt).toBeDefined();
  });

  it('should throw if landing page not found', async () => {
    await expect(() =>
      deleteLandingPage.execute({
        tenantId: 'tenant-1',
        landingPageId: 'non-existent-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
