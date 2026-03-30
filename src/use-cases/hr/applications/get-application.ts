import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Application } from '@/entities/hr/application';
import type { ApplicationsRepository } from '@/repositories/hr/applications-repository';

export interface GetApplicationRequest {
  tenantId: string;
  applicationId: string;
}

export interface GetApplicationResponse {
  application: Application;
}

export class GetApplicationUseCase {
  constructor(private applicationsRepository: ApplicationsRepository) {}

  async execute(
    request: GetApplicationRequest,
  ): Promise<GetApplicationResponse> {
    const { tenantId, applicationId } = request;

    const application = await this.applicationsRepository.findById(
      new UniqueEntityID(applicationId),
      tenantId,
    );

    if (!application) {
      throw new ResourceNotFoundError('Candidatura não encontrada');
    }

    return { application };
  }
}
