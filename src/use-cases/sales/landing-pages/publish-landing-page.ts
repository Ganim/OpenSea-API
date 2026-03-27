import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { LandingPageDTO } from '@/mappers/sales/landing-page/landing-page-to-dto';
import { landingPageToDTO } from '@/mappers/sales/landing-page/landing-page-to-dto';
import type { LandingPagesRepository } from '@/repositories/sales/landing-pages-repository';

interface PublishLandingPageUseCaseRequest {
  tenantId: string;
  landingPageId: string;
}

interface PublishLandingPageUseCaseResponse {
  landingPage: LandingPageDTO;
}

export class PublishLandingPageUseCase {
  constructor(private landingPagesRepository: LandingPagesRepository) {}

  async execute(
    input: PublishLandingPageUseCaseRequest,
  ): Promise<PublishLandingPageUseCaseResponse> {
    const landingPage = await this.landingPagesRepository.findById(
      new UniqueEntityID(input.landingPageId),
      input.tenantId,
    );

    if (!landingPage) {
      throw new ResourceNotFoundError('Landing page not found.');
    }

    if (landingPage.status !== 'DRAFT') {
      throw new BadRequestError('Only draft landing pages can be published.');
    }

    landingPage.publish();
    await this.landingPagesRepository.save(landingPage);

    return {
      landingPage: landingPageToDTO(landingPage),
    };
  }
}
