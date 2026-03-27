import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { LandingPageDTO } from '@/mappers/sales/landing-page/landing-page-to-dto';
import { landingPageToDTO } from '@/mappers/sales/landing-page/landing-page-to-dto';
import type { LandingPagesRepository } from '@/repositories/sales/landing-pages-repository';

interface GetLandingPageByIdUseCaseRequest {
  tenantId: string;
  landingPageId: string;
}

interface GetLandingPageByIdUseCaseResponse {
  landingPage: LandingPageDTO;
}

export class GetLandingPageByIdUseCase {
  constructor(private landingPagesRepository: LandingPagesRepository) {}

  async execute(
    input: GetLandingPageByIdUseCaseRequest,
  ): Promise<GetLandingPageByIdUseCaseResponse> {
    const landingPage = await this.landingPagesRepository.findById(
      new UniqueEntityID(input.landingPageId),
      input.tenantId,
    );

    if (!landingPage) {
      throw new ResourceNotFoundError('Landing page not found.');
    }

    return {
      landingPage: landingPageToDTO(landingPage),
    };
  }
}
