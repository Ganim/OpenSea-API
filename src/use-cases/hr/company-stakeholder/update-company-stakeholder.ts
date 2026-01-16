import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  CompanyStakeholder,
  type CompanyStakeholderRole,
  type CompanyStakeholderStatus,
} from '@/entities/hr';
import { CompanyStakeholderRepository } from '@/repositories/hr/company-stakeholder-repository';

interface UpdateCompanyStakeholderUseCaseRequest {
  id: string;
  companyId: string;
  name?: string;
  role?: string | null;
  entryDate?: Date | null;
  exitDate?: Date | null;
  personDocumentMasked?: string | null;
  isLegalRepresentative?: boolean;
  status?: string;
}

interface UpdateCompanyStakeholderUseCaseResponse {
  stakeholder: CompanyStakeholder;
}

export class UpdateCompanyStakeholderUseCase {
  constructor(
    private companyStakeholderRepository: CompanyStakeholderRepository,
  ) {}

  async execute(
    request: UpdateCompanyStakeholderUseCaseRequest,
  ): Promise<UpdateCompanyStakeholderUseCaseResponse> {
    const id = new UniqueEntityID(request.id);

    const stakeholder = await this.companyStakeholderRepository.findById(id);

    if (!stakeholder) {
      throw new ResourceNotFoundError('Stakeholder not found');
    }

    // Validar entrada de data
    const entryDate =
      request.entryDate !== undefined
        ? request.entryDate
        : stakeholder.entryDate;
    const exitDate =
      request.exitDate !== undefined ? request.exitDate : stakeholder.exitDate;

    if (entryDate && entryDate > new Date()) {
      throw new BadRequestError('Entry date cannot be in the future');
    }

    // Validar saída de data
    if (entryDate && exitDate && exitDate < entryDate) {
      throw new BadRequestError('Exit date must be after entry date');
    }

    // Se mudar status para INACTIVE, exitDate é obrigatório
    const status = request.status ?? stakeholder.status;
    if (status === 'INACTIVE' && !exitDate) {
      throw new BadRequestError(
        'Exit date is required when status is INACTIVE',
      );
    }

    // Verificar duplicatas se o nome foi alterado
    if (request.name && request.name !== stakeholder.name) {
      const existingStakeholder =
        await this.companyStakeholderRepository.findByCompanyIdAndName(
          stakeholder.companyId,
          request.name,
        );
      if (existingStakeholder) {
        throw new BadRequestError(
          'A stakeholder with this name already exists for this company',
        );
      }
    }

    // Computar pending issues
    const pendingIssues: string[] = [];
    const finalRole =
      request.role !== undefined ? request.role : stakeholder.role;
    if (!finalRole) {
      pendingIssues.push('role_not_defined');
    }
    if (!entryDate) {
      pendingIssues.push('entry_date_not_defined');
    }

    const updated = CompanyStakeholder.create(
      {
        ...stakeholder.props,
        name: request.name ?? stakeholder.name,
        role: (finalRole ?? undefined) as CompanyStakeholderRole | undefined,
        entryDate: entryDate ?? undefined,
        exitDate: exitDate ?? undefined,
        personDocumentMasked:
          request.personDocumentMasked !== undefined
            ? (request.personDocumentMasked ?? undefined)
            : stakeholder.personDocumentMasked,
        isLegalRepresentative:
          request.isLegalRepresentative ?? stakeholder.isLegalRepresentative,
        status: status as CompanyStakeholderStatus,
        pendingIssues,
      },
      stakeholder.id,
    );

    await this.companyStakeholderRepository.save(updated);

    return {
      stakeholder: updated,
    };
  }
}
