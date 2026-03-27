import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SignatureEnvelope } from '@/entities/signature/signature-envelope';
import type { CustomersRepository } from '@/repositories/sales/customers-repository';
import type { QuotesRepository } from '@/repositories/sales/quotes-repository';
import type { CreateEnvelopeUseCase } from '@/use-cases/signature/envelopes/create-envelope';

interface RequestQuoteSignatureUseCaseRequest {
  tenantId: string;
  quoteId: string;
  userId: string;
  signerEmail?: string;
  signerName?: string;
  documentFileId: string;
  documentHash: string;
}

interface RequestQuoteSignatureUseCaseResponse {
  envelope: SignatureEnvelope;
}

export class RequestQuoteSignatureUseCase {
  constructor(
    private quotesRepository: QuotesRepository,
    private customersRepository: CustomersRepository,
    private createEnvelopeUseCase: CreateEnvelopeUseCase,
  ) {}

  async execute(
    input: RequestQuoteSignatureUseCaseRequest,
  ): Promise<RequestQuoteSignatureUseCaseResponse> {
    const quote = await this.quotesRepository.findById(
      new UniqueEntityID(input.quoteId),
      input.tenantId,
    );

    if (!quote) {
      throw new ResourceNotFoundError('Quote not found.');
    }

    if (quote.status !== 'SENT') {
      throw new BadRequestError(
        'Only quotes in SENT status can be sent for signature.',
      );
    }

    if (quote.signatureEnvelopeId) {
      throw new BadRequestError(
        'This quote already has a signature envelope attached.',
      );
    }

    const customer = await this.customersRepository.findById(
      quote.customerId,
      input.tenantId,
    );

    if (!customer) {
      throw new ResourceNotFoundError('Customer not found.');
    }

    const signerName = input.signerName ?? customer.name;
    const signerEmail = input.signerEmail ?? customer.email;

    if (!signerEmail) {
      throw new BadRequestError(
        'Customer does not have an email address. Provide signerEmail override.',
      );
    }

    const { envelope } = await this.createEnvelopeUseCase.execute({
      tenantId: input.tenantId,
      title: `Orcamento: ${quote.title}`,
      signatureLevel: 'SIMPLE',
      documentFileId: input.documentFileId,
      documentHash: input.documentHash,
      sourceModule: 'sales',
      sourceEntityType: 'quote',
      sourceEntityId: input.quoteId,
      routingType: 'SEQUENTIAL',
      createdByUserId: input.userId,
      signers: [
        {
          externalName: signerName,
          externalEmail: signerEmail,
          order: 1,
          group: 1,
          role: 'SIGNER',
          signatureLevel: 'SIMPLE',
        },
      ],
    });

    quote.signatureEnvelopeId = envelope.id.toString();
    await this.quotesRepository.save(quote);

    return { envelope };
  }
}
