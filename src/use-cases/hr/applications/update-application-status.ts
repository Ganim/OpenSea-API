import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Application } from '@/entities/hr/application';
import type { ApplicationsRepository } from '@/repositories/hr/applications-repository';

const VALID_STATUSES = [
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'ASSESSMENT',
  'OFFER',
  'HIRED',
  'REJECTED',
  'WITHDRAWN',
] as const;

export interface UpdateApplicationStatusRequest {
  tenantId: string;
  applicationId: string;
  status: string;
}

export interface UpdateApplicationStatusResponse {
  application: Application;
}

export class UpdateApplicationStatusUseCase {
  constructor(private applicationsRepository: ApplicationsRepository) {}

  async execute(
    request: UpdateApplicationStatusRequest,
  ): Promise<UpdateApplicationStatusResponse> {
    const { tenantId, applicationId, status } = request;

    if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      throw new BadRequestError(
        `Status inválido. Status válidos: ${VALID_STATUSES.join(', ')}`,
      );
    }

    const existingApplication = await this.applicationsRepository.findById(
      new UniqueEntityID(applicationId),
      tenantId,
    );

    if (!existingApplication) {
      throw new ResourceNotFoundError('Candidatura não encontrada');
    }

    if (
      existingApplication.status === 'HIRED' ||
      existingApplication.status === 'REJECTED' ||
      existingApplication.status === 'WITHDRAWN'
    ) {
      throw new BadRequestError(
        'Não é possível alterar o status de uma candidatura finalizada',
      );
    }

    const updatedApplication = await this.applicationsRepository.update({
      id: new UniqueEntityID(applicationId),
      status,
    });

    if (!updatedApplication) {
      throw new ResourceNotFoundError('Candidatura não encontrada');
    }

    return { application: updatedApplication };
  }
}
