import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CompanyCnae } from '@/entities/hr/company-cnae';
import type { CompanyAeRepository } from '@/repositories/hr/company-cnaes-repository';
import { computePendingIssues } from './compute-pending-issues';

export interface UpdateCompanyCnaeRequest {
  companyId: string;
  cnaeId: string;
  code?: string;
  description?: string;
  isPrimary?: boolean;
  status?: 'ACTIVE' | 'INACTIVE';
  metadata?: Record<string, unknown>;
}

export interface UpdateCompanyCnaeResponse {
  cnae: CompanyCnae;
}

export class UpdateCompanyCnaeUseCase {
  constructor(private companyCnaesRepository: CompanyAeRepository) {}

  async execute(
    request: UpdateCompanyCnaeRequest,
  ): Promise<UpdateCompanyCnaeResponse> {
    const companyId = new UniqueEntityID(request.companyId);
    const cnaeId = new UniqueEntityID(request.cnaeId);

    const cnae = await this.companyCnaesRepository.findById(cnaeId, {
      companyId,
    });

    if (!cnae) {
      throw new ResourceNotFoundError('CNAE not found');
    }

    // Check if trying to change code to a code that already exists
    if (request.code && request.code !== cnae.code) {
      const duplicate = await this.companyCnaesRepository.findByCompanyAndCode(
        companyId,
        request.code,
      );

      if (duplicate && duplicate.id.toString() !== cnaeId.toString()) {
        throw new BadRequestError('CNAE code already exists for this company');
      }
    }

    const pendingIssues =
      request.description !== undefined
        ? computePendingIssues({
            descriptionProvided:
              request.description !== undefined &&
              request.description.length > 0,
          })
        : cnae.pendingIssues;

    cnae.update({
      description: request.description,
      isPrimary: request.isPrimary,
      status: request.status,
      metadata: request.metadata,
      pendingIssues,
    });

    if (
      request.isPrimary === true ||
      (request.isPrimary === undefined && cnae.isPrimary)
    ) {
      await this.companyCnaesRepository.unsetPrimaryForCompany(
        companyId,
        cnaeId,
      );
    }

    await this.companyCnaesRepository.save(cnae);

    return { cnae };
  }
}
