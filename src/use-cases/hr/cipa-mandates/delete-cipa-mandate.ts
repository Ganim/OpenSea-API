import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CipaMandate } from '@/entities/hr/cipa-mandate';
import { CipaMandatesRepository } from '@/repositories/hr/cipa-mandates-repository';

export interface DeleteCipaMandateRequest {
  tenantId: string;
  mandateId: string;
}

export interface DeleteCipaMandateResponse {
  cipaMandate: CipaMandate;
}

export class DeleteCipaMandateUseCase {
  constructor(private cipaMandatesRepository: CipaMandatesRepository) {}

  async execute(
    request: DeleteCipaMandateRequest,
  ): Promise<DeleteCipaMandateResponse> {
    const { tenantId, mandateId } = request;

    const cipaMandate = await this.cipaMandatesRepository.findById(
      new UniqueEntityID(mandateId),
      tenantId,
    );

    if (!cipaMandate) {
      throw new ResourceNotFoundError('Mandato CIPA não encontrado');
    }

    const membersCount = await this.cipaMandatesRepository.countMembers(
      new UniqueEntityID(mandateId),
    );

    if (membersCount > 0) {
      throw new BadRequestError(
        'Não é possível excluir um mandato CIPA que possui membros vinculados',
      );
    }

    await this.cipaMandatesRepository.delete(new UniqueEntityID(mandateId));

    return { cipaMandate };
  }
}
