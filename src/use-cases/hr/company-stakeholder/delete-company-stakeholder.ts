import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CompanyStakeholderRepository } from '@/repositories/hr/company-stakeholder-repository';

interface DeleteCompanyStakeholderUseCaseRequest {
  id: string;
  anonimize?: boolean;
}

interface DeleteCompanyStakeholderUseCaseResponse {
  success: boolean;
}

export class DeleteCompanyStakeholderUseCase {
  constructor(
    private companyStakeholderRepository: CompanyStakeholderRepository,
  ) {}

  async execute(
    request: DeleteCompanyStakeholderUseCaseRequest,
  ): Promise<DeleteCompanyStakeholderUseCaseResponse> {
    const id = new UniqueEntityID(request.id);

    const stakeholder = await this.companyStakeholderRepository.findById(id);

    if (!stakeholder) {
      throw new ResourceNotFoundError('Stakeholder not found');
    }

    // Se é representante legal, valida que existe outro antes de deletar
    if (stakeholder.isLegalRepresentative) {
      const activeLegalRepCount =
        await this.companyStakeholderRepository.countActiveLegalRepresentatives(
          stakeholder.companyId,
        );

      // Se é o único representante legal, rejeita a deleção
      if (activeLegalRepCount <= 1) {
        throw new BadRequestError(
          'Cannot delete the last legal representative of the company',
        );
      }
    }

    // Soft delete
    await this.companyStakeholderRepository.softDelete(id);

    // Anonimizar se solicitado (LGPD)
    if (request.anonimize) {
      await this.companyStakeholderRepository.anonimize(id);
    }

    return {
      success: true,
    };
  }
}
