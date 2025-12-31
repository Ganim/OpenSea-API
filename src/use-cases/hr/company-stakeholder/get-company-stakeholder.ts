import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CompanyStakeholder } from '@/entities/hr';
import { CompanyStakeholderRepository } from '@/repositories/hr/company-stakeholder-repository';

interface GetCompanyStakeholderUseCaseRequest {
  companyId: string;
}

interface GetCompanyStakeholderUseCaseResponse {
  stakeholders: CompanyStakeholder[];
}

export class GetCompanyStakeholderUseCase {
  constructor(
    private companyStakeholderRepository: CompanyStakeholderRepository,
  ) {}

  async execute(
    request: GetCompanyStakeholderUseCaseRequest,
  ): Promise<GetCompanyStakeholderUseCaseResponse> {
    const companyId = new UniqueEntityID(request.companyId);

    const stakeholders =
      await this.companyStakeholderRepository.findByCompanyId(companyId);

    if (!stakeholders || stakeholders.length === 0) {
      throw new ResourceNotFoundError('Company stakeholders');
    }

    return {
      stakeholders,
    };
  }
}
