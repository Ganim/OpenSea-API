import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Application } from '@/entities/hr/application';
import type { ApplicationsRepository } from '@/repositories/hr/applications-repository';

export interface RejectApplicationRequest {
  tenantId: string;
  applicationId: string;
  rejectionReason?: string;
}

export interface RejectApplicationResponse {
  application: Application;
}

export class RejectApplicationUseCase {
  constructor(private applicationsRepository: ApplicationsRepository) {}

  async execute(
    request: RejectApplicationRequest,
  ): Promise<RejectApplicationResponse> {
    const { tenantId, applicationId, rejectionReason } = request;

    const existingApplication = await this.applicationsRepository.findById(
      new UniqueEntityID(applicationId),
      tenantId,
    );

    if (!existingApplication) {
      throw new ResourceNotFoundError('Candidatura não encontrada');
    }

    if (
      existingApplication.status === 'HIRED' ||
      existingApplication.status === 'REJECTED'
    ) {
      throw new BadRequestError('Esta candidatura já foi finalizada');
    }

    const updatedApplication = await this.applicationsRepository.update({
      id: new UniqueEntityID(applicationId),
      status: 'REJECTED',
      rejectedAt: new Date(),
      rejectionReason,
    });

    if (!updatedApplication) {
      throw new ResourceNotFoundError('Candidatura não encontrada');
    }

    return { application: updatedApplication };
  }
}
