import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SignatureEnvelope } from '@/entities/signature/signature-envelope';
import type { QuotesRepository } from '@/repositories/sales/quotes-repository';
import type { GetEnvelopeByIdUseCase } from '@/use-cases/signature/envelopes/get-envelope-by-id';

interface GetQuoteSignatureStatusUseCaseRequest {
  tenantId: string;
  quoteId: string;
}

interface GetQuoteSignatureStatusUseCaseResponse {
  envelope: SignatureEnvelope;
}

export class GetQuoteSignatureStatusUseCase {
  constructor(
    private quotesRepository: QuotesRepository,
    private getEnvelopeByIdUseCase: GetEnvelopeByIdUseCase,
  ) {}

  async execute(
    input: GetQuoteSignatureStatusUseCaseRequest,
  ): Promise<GetQuoteSignatureStatusUseCaseResponse> {
    const quote = await this.quotesRepository.findById(
      new UniqueEntityID(input.quoteId),
      input.tenantId,
    );

    if (!quote) {
      throw new ResourceNotFoundError('Quote not found.');
    }

    if (!quote.signatureEnvelopeId) {
      throw new BadRequestError(
        'This quote does not have a signature envelope.',
      );
    }

    const { envelope } = await this.getEnvelopeByIdUseCase.execute({
      tenantId: input.tenantId,
      envelopeId: quote.signatureEnvelopeId,
    });

    return { envelope };
  }
}
