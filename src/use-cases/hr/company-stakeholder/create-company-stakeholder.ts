import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CompanyStakeholder } from '@/entities/hr';
import { CompanyStakeholderRepository } from '@/repositories/hr/company-stakeholder-repository';

interface CreateCompanyStakeholderUseCaseRequest {
  companyId: string;
  name: string;
  role?: string;
  entryDate?: Date;
  exitDate?: Date;
  personDocumentMasked?: string;
  isLegalRepresentative?: boolean;
  source?: string;
  rawPayloadRef?: string;
}

interface CreateCompanyStakeholderUseCaseResponse {
  stakeholder: CompanyStakeholder;
}

export class CreateCompanyStakeholderUseCase {
  constructor(
    private companyStakeholderRepository: CompanyStakeholderRepository,
  ) {}

  async execute(
    request: CreateCompanyStakeholderUseCaseRequest,
  ): Promise<CreateCompanyStakeholderUseCaseResponse> {
    const companyId = new UniqueEntityID(request.companyId);

    // Validar entrada de data
    if (request.entryDate && request.entryDate > new Date()) {
      throw new BadRequestError('Entry date cannot be in the future');
    }

    // Validar saída de data
    if (
      request.entryDate &&
      request.exitDate &&
      request.exitDate < request.entryDate
    ) {
      throw new BadRequestError('Exit date must be after entry date');
    }

    // Verificar duplicatas (nome + role + empresa)
    const existingStakeholder =
      await this.companyStakeholderRepository.findByCompanyIdAndName(
        companyId,
        request.name,
      );

    if (existingStakeholder) {
      throw new BadRequestError(
        'A stakeholder with this name already exists for this company',
      );
    }

    // Computar pending issues
    const pendingIssues: string[] = [];
    if (!request.role) {
      pendingIssues.push('role_not_defined');
    }
    if (!request.entryDate) {
      pendingIssues.push('entry_date_not_defined');
    }

    const stakeholder = await this.companyStakeholderRepository.create({
      companyId,
      name: request.name,
      role: request.role,
      entryDate: request.entryDate,
      exitDate: request.exitDate,
      personDocumentMasked: request.personDocumentMasked,
      isLegalRepresentative: request.isLegalRepresentative ?? false,
      status: 'ACTIVE',
      source: request.source ?? 'MANUAL',
      rawPayloadRef: request.rawPayloadRef,
      metadata: {},
    });

    // Atualizar com pending issues
    const stakeholderWithPendingIssues = CompanyStakeholder.create(
      {
        ...stakeholder.props,
        pendingIssues,
      },
      stakeholder.id,
    );

    await this.companyStakeholderRepository.save(stakeholderWithPendingIssues);

    return {
      stakeholder: stakeholderWithPendingIssues,
    };
  }
}
