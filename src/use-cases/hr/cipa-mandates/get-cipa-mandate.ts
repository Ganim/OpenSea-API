import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CipaMandate } from '@/entities/hr/cipa-mandate';
import { CipaMandatesRepository } from '@/repositories/hr/cipa-mandates-repository';

export interface GetCipaMandateRequest {
  tenantId: string;
  mandateId: string;
}

export interface GetCipaMandateResponse {
  cipaMandate: CipaMandate;
}

export class GetCipaMandateUseCase {
  constructor(private cipaMandatesRepository: CipaMandatesRepository) {}

  async execute(
    request: GetCipaMandateRequest,
  ): Promise<GetCipaMandateResponse> {
    const { tenantId, mandateId } = request;

    const cipaMandate = await this.cipaMandatesRepository.findById(
      new UniqueEntityID(mandateId),
      tenantId,
    );

    if (!cipaMandate) {
      throw new ResourceNotFoundError('Mandato CIPA não encontrado');
    }

    return { cipaMandate };
  }
}
