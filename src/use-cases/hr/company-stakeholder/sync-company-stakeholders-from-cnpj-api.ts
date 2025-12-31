import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CompanyStakeholder } from '@/entities/hr';
import { CompanyStakeholderRepository } from '@/repositories/hr/company-stakeholder-repository';

interface CnpjApiStakeholder {
  name: string;
  role?: string;
  entryDate?: Date;
  exitDate?: Date;
  personDocumentMasked?: string;
  isLegalRepresentative?: boolean;
  rawPayload: Record<string, unknown>;
}

interface SyncCompanyStakeholdersFromCnpjApiUseCaseRequest {
  companyId: string;
  stakeholders: CnpjApiStakeholder[];
}

interface SyncCompanyStakeholdersFromCnpjApiUseCaseResponse {
  created: number;
  updated: number;
}

export class SyncCompanyStakeholdersFromCnpjApiUseCase {
  constructor(
    private companyStakeholderRepository: CompanyStakeholderRepository,
  ) {}

  async execute(
    request: SyncCompanyStakeholdersFromCnpjApiUseCaseRequest,
  ): Promise<SyncCompanyStakeholdersFromCnpjApiUseCaseResponse> {
    const companyId = new UniqueEntityID(request.companyId);

    let created = 0;
    let updated = 0;

    for (const stakeholderData of request.stakeholders) {
      const existingStakeholder =
        await this.companyStakeholderRepository.findByCompanyIdAndName(
          companyId,
          stakeholderData.name,
        );

      if (existingStakeholder) {
        // Se existe e veio da API CNPJ, atualizar somente se a origem for CNPJ_API
        // Dados manuais têm prioridade
        if (existingStakeholder.source === 'MANUAL') {
          continue;
        }

        // Computar pending issues após atualização
        const pendingIssues: string[] = [];
        if (!stakeholderData.role) {
          pendingIssues.push('role_not_defined');
        }
        if (!stakeholderData.entryDate) {
          pendingIssues.push('entry_date_not_defined');
        }

        updated++;
      } else {
        // Criar novo
        const pendingIssues: string[] = [];
        if (!stakeholderData.role) {
          pendingIssues.push('role_not_defined');
        }
        if (!stakeholderData.entryDate) {
          pendingIssues.push('entry_date_not_defined');
        }

        const created_stakeholder =
          await this.companyStakeholderRepository.create({
            companyId,
            name: stakeholderData.name,
            role: stakeholderData.role,
            entryDate: stakeholderData.entryDate,
            exitDate: stakeholderData.exitDate,
            personDocumentMasked: stakeholderData.personDocumentMasked,
            isLegalRepresentative:
              stakeholderData.isLegalRepresentative ?? false,
            status: 'ACTIVE',
            source: 'CNPJ_API',
            rawPayloadRef: JSON.stringify(stakeholderData.rawPayload),
            metadata: {},
          });

        // Atualizar com pending issues
        const withPendingIssues = CompanyStakeholder.create(
          {
            ...created_stakeholder.props,
            pendingIssues,
          },
          created_stakeholder.id,
        );
        await this.companyStakeholderRepository.save(withPendingIssues);

        created++;
      }
    }

    return {
      created,
      updated,
    };
  }
}
