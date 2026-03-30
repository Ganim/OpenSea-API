import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Application } from '@/entities/hr/application';
import type { ApplicationsRepository } from '@/repositories/hr/applications-repository';

export interface HireApplicationRequest {
  tenantId: string;
  applicationId: string;
}

export interface HireApplicationResponse {
  application: Application;
}

export class HireApplicationUseCase {
  constructor(private applicationsRepository: ApplicationsRepository) {}

  async execute(
    request: HireApplicationRequest,
  ): Promise<HireApplicationResponse> {
    const { tenantId, applicationId } = request;

    const existingApplication =
      await this.applicationsRepository.findById(
        new UniqueEntityID(applicationId),
        tenantId,
      );

    if (!existingApplication) {
      throw new ResourceNotFoundError('Candidatura não encontrada');
    }

    if (
      existingApplication.status === 'REJECTED' ||
      existingApplication.status === 'WITHDRAWN'
    ) {
      throw new BadRequestError(
        'Não é possível contratar um candidato com candidatura rejeitada ou desistente',
      );
    }

    if (existingApplication.status === 'HIRED') {
      throw new BadRequestError('Este candidato já foi contratado');
    }

    const updatedApplication = await this.applicationsRepository.update({
      id: new UniqueEntityID(applicationId),
      status: 'HIRED',
      hiredAt: new Date(),
    });

    if (!updatedApplication) {
      throw new ResourceNotFoundError('Candidatura não encontrada');
    }

    return { application: updatedApplication };
  }
}
