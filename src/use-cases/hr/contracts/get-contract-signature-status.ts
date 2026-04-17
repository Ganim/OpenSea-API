import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SignatureEnvelope } from '@/entities/signature/signature-envelope';
import type { GeneratedEmploymentContractsRepository } from '@/repositories/hr/generated-employment-contracts-repository';
import type { GetEnvelopeByIdUseCase } from '@/use-cases/signature/envelopes/get-envelope-by-id';

interface GetContractSignatureStatusUseCaseRequest {
  tenantId: string;
  contractId: string;
}

interface GetContractSignatureStatusUseCaseResponse {
  envelope: SignatureEnvelope;
}

export class GetContractSignatureStatusUseCase {
  constructor(
    private generatedContractsRepository: GeneratedEmploymentContractsRepository,
    private getEnvelopeByIdUseCase: GetEnvelopeByIdUseCase,
  ) {}

  async execute(
    input: GetContractSignatureStatusUseCaseRequest,
  ): Promise<GetContractSignatureStatusUseCaseResponse> {
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

    const { envelope } = await this.getEnvelopeByIdUseCase.execute({
      tenantId: input.tenantId,
      envelopeId: contract.signatureEnvelopeId,
    });

    return { envelope };
  }
}
