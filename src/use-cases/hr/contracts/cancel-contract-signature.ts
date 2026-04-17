import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { GeneratedEmploymentContractsRepository } from '@/repositories/hr/generated-employment-contracts-repository';
import type { CancelEnvelopeUseCase } from '@/use-cases/signature/envelopes/cancel-envelope';

interface CancelContractSignatureUseCaseRequest {
  tenantId: string;
  contractId: string;
  userId: string;
  reason?: string;
}

export class CancelContractSignatureUseCase {
  constructor(
    private generatedContractsRepository: GeneratedEmploymentContractsRepository,
    private cancelEnvelopeUseCase: CancelEnvelopeUseCase,
  ) {}

  async execute(input: CancelContractSignatureUseCaseRequest): Promise<void> {
    const contract = await this.generatedContractsRepository.findById(
      new UniqueEntityID(input.contractId),
      input.tenantId,
    );

    if (!contract) {
      throw new ResourceNotFoundError('Employment contract not found.');
    }

    if (!contract.signatureEnvelopeId) {
      throw new BadRequestError(
        'Este contrato ainda não foi enviado para assinatura.',
      );
    }

    await this.cancelEnvelopeUseCase.execute({
      tenantId: input.tenantId,
      envelopeId: contract.signatureEnvelopeId,
      reason: input.reason,
    });

    // Keep the signatureEnvelopeId on the contract for audit/history purposes.
  }
}
