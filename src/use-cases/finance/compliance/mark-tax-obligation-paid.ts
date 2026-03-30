import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TaxObligation } from '@/entities/finance/tax-obligation';
import type { TaxObligationsRepository } from '@/repositories/finance/tax-obligations-repository';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';

interface MarkTaxObligationPaidRequest {
  tenantId: string;
  obligationId: string;
  paidAt: Date;
  entryId?: string;
}

export interface MarkTaxObligationPaidResponse {
  obligation: TaxObligation;
}

export class MarkTaxObligationPaidUseCase {
  constructor(private taxObligationsRepository: TaxObligationsRepository) {}

  async execute(
    request: MarkTaxObligationPaidRequest,
  ): Promise<MarkTaxObligationPaidResponse> {
    const { tenantId, obligationId, paidAt, entryId } = request;

    const obligation = await this.taxObligationsRepository.findById(
      new UniqueEntityID(obligationId),
      tenantId,
    );

    if (!obligation) {
      throw new ResourceNotFoundError('TaxObligation');
    }

    if (obligation.status === 'PAID') {
      throw new Error('Esta obrigação tributária já foi paga');
    }

    if (obligation.status === 'CANCELLED') {
      throw new Error(
        'Não é possível pagar uma obrigação tributária cancelada',
      );
    }

    obligation.markAsPaid(paidAt, entryId);

    await this.taxObligationsRepository.update(obligation);

    return { obligation };
  }
}
