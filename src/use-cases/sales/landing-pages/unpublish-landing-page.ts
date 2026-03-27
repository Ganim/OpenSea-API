import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { LandingPageDTO } from '@/mappers/sales/landing-page/landing-page-to-dto';
import { landingPageToDTO } from '@/mappers/sales/landing-page/landing-page-to-dto';
import type { LandingPagesRepository } from '@/repositories/sales/landing-pages-repository';

interface UnpublishLandingPageUseCaseRequest {
  tenantId: string;
  landingPageId: string;
}

interface UnpublishLandingPageUseCaseResponse {
  landingPage: LandingPageDTO;
}

export class UnpublishLandingPageUseCase {
  constructor(private landingPagesRepository: LandingPagesRepository) {}

  async execute(
    input: UnpublishLandingPageUseCaseRequest,
  ): Promise<UnpublishLandingPageUseCaseResponse> {
    const landingPage = await this.landingPagesRepository.findById(
      new UniqueEntityID(input.landingPageId),
      input.tenantId,
    );

    if (!landingPage) {
      throw new ResourceNotFoundError('Landing page not found.');
    }

    if (landingPage.status !== 'PUBLISHED') {
      throw new BadRequestError(
        'Only published landing pages can be unpublished.',
      );
    }

    landingPage.unpublish();
    await this.landingPagesRepository.save(landingPage);

    return {
      landingPage: landingPageToDTO(landingPage),
    };
  }
}
