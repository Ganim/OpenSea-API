import type { LandingPageDTO } from '@/mappers/sales/landing-page/landing-page-to-dto';
import { landingPageToDTO } from '@/mappers/sales/landing-page/landing-page-to-dto';
import type { LandingPagesRepository } from '@/repositories/sales/landing-pages-repository';

interface ListLandingPagesUseCaseRequest {
  tenantId: string;
  page?: number;
  perPage?: number;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

interface ListLandingPagesUseCaseResponse {
  landingPages: LandingPageDTO[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export class ListLandingPagesUseCase {
  constructor(private landingPagesRepository: LandingPagesRepository) {}

  async execute(
    input: ListLandingPagesUseCaseRequest,
  ): Promise<ListLandingPagesUseCaseResponse> {
    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;

    const [landingPages, total] = await Promise.all([
      this.landingPagesRepository.findMany(
        page,
        perPage,
        input.tenantId,
        input.status,
      ),
      this.landingPagesRepository.countByTenant(input.tenantId, input.status),
    ]);

    return {
      landingPages: landingPages.map((lp) => landingPageToDTO(lp)),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
}
