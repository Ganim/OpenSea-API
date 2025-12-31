import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CompanyCnae } from '@/entities/hr/company-cnae';
import type { CompanyAeRepository } from '@/repositories/hr/company-cnaes-repository';
import { computePendingIssues } from './compute-pending-issues';

export interface CreateCompanyCnaeRequest {
  companyId: string;
  code: string;
  description?: string;
  isPrimary?: boolean;
  status?: 'ACTIVE' | 'INACTIVE';
  metadata?: Record<string, unknown>;
}

export interface CreateCompanyCnaeResponse {
  cnae: CompanyCnae;
}

export class CreateCompanyCnaeUseCase {
  constructor(private companyCnaesRepository: CompanyAeRepository) {}

  async execute(
    request: CreateCompanyCnaeRequest,
  ): Promise<CreateCompanyCnaeResponse> {
    const companyId = new UniqueEntityID(request.companyId);

    // Check if code already exists for this company
    const existingSameCode =
      await this.companyCnaesRepository.findByCompanyAndCode(
        companyId,
        request.code,
      );
    if (existingSameCode) {
      throw new BadRequestError('CNAE code already exists for this company');
    }

    const pendingIssues = computePendingIssues({
      descriptionProvided: request.description !== undefined,
    });

    const cnae = await this.companyCnaesRepository.create({
      companyId,
      code: request.code,
      description: request.description,
      isPrimary: request.isPrimary ?? false,
      status: request.status ?? 'ACTIVE',
      pendingIssues,
      metadata: request.metadata ?? {},
    });

    if (cnae.isPrimary) {
      await this.companyCnaesRepository.unsetPrimaryForCompany(
        companyId,
        cnae.id,
      );
    }

    return { cnae };
  }
}
