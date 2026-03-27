import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { LandingPagesRepository } from '@/repositories/sales/landing-pages-repository';

interface DeleteLandingPageUseCaseRequest {
  tenantId: string;
  landingPageId: string;
}

export class DeleteLandingPageUseCase {
  constructor(private landingPagesRepository: LandingPagesRepository) {}

  async execute(input: DeleteLandingPageUseCaseRequest): Promise<void> {
    const landingPage = await this.landingPagesRepository.findById(
      new UniqueEntityID(input.landingPageId),
      input.tenantId,
    );

    if (!landingPage) {
      throw new ResourceNotFoundError('Landing page not found.');
    }

    await this.landingPagesRepository.delete(landingPage.id, input.tenantId);
  }
}
