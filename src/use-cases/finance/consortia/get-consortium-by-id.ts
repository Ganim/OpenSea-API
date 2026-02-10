import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type ConsortiumDTO,
  consortiumToDTO,
} from '@/mappers/finance/consortium/consortium-to-dto';
import {
  type ConsortiumPaymentDTO,
  consortiumPaymentToDTO,
} from '@/mappers/finance/consortium-payment/consortium-payment-to-dto';
import type { ConsortiaRepository } from '@/repositories/finance/consortia-repository';
import type { ConsortiumPaymentsRepository } from '@/repositories/finance/consortium-payments-repository';

interface GetConsortiumByIdUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetConsortiumByIdUseCaseResponse {
  consortium: ConsortiumDTO;
  payments: ConsortiumPaymentDTO[];
}

export class GetConsortiumByIdUseCase {
  constructor(
    private consortiaRepository: ConsortiaRepository,
    private consortiumPaymentsRepository: ConsortiumPaymentsRepository,
  ) {}

  async execute({
    tenantId,
    id,
  }: GetConsortiumByIdUseCaseRequest): Promise<GetConsortiumByIdUseCaseResponse> {
    const consortium = await this.consortiaRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!consortium) {
      throw new ResourceNotFoundError('Consortium not found');
    }

    const payments = await this.consortiumPaymentsRepository.findByConsortiumId(
      new UniqueEntityID(id),
    );

    return {
      consortium: consortiumToDTO(consortium),
      payments: payments.map(consortiumPaymentToDTO),
    };
  }
}
