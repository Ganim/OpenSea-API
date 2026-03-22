import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { CustomerPortalAccessDTO } from '@/mappers/sales/analytics/portal-access-to-dto';
import { portalAccessToDTO } from '@/mappers/sales/analytics/portal-access-to-dto';
import { CustomerPortalAccessesRepository } from '@/repositories/sales/customer-portal-accesses-repository';

interface GetPortalDataUseCaseRequest {
  accessToken: string;
}

interface GetPortalDataUseCaseResponse {
  access: CustomerPortalAccessDTO;
}

export class GetPortalDataUseCase {
  constructor(
    private portalAccessesRepository: CustomerPortalAccessesRepository,
  ) {}

  async execute(
    input: GetPortalDataUseCaseRequest,
  ): Promise<GetPortalDataUseCaseResponse> {
    if (!input.accessToken) {
      throw new BadRequestError('Access token is required.');
    }

    const access = await this.portalAccessesRepository.findByToken(
      input.accessToken,
    );

    if (!access) {
      throw new ResourceNotFoundError();
    }

    if (!access.isActive) {
      throw new BadRequestError('Portal access has been revoked.');
    }

    if (access.isExpired) {
      throw new BadRequestError('Portal access has expired.');
    }

    // Record access
    access.recordAccess();
    await this.portalAccessesRepository.save(access);

    return { access: portalAccessToDTO(access) };
  }
}
