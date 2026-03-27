import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Quote } from '@/entities/sales/quote';
import { SignatureEnvelope } from '@/entities/signature/signature-envelope';
import { InMemoryQuotesRepository } from '@/repositories/sales/in-memory/in-memory-quotes-repository';
import { InMemorySignatureEnvelopesRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelopes-repository';
import { GetEnvelopeByIdUseCase } from '@/use-cases/signature/envelopes/get-envelope-by-id';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetQuoteSignatureStatusUseCase } from './get-quote-signature-status';

const TENANT_ID = 'tenant-1';

let quotesRepository: InMemoryQuotesRepository;
let envelopesRepository: InMemorySignatureEnvelopesRepository;
let getEnvelopeByIdUseCase: GetEnvelopeByIdUseCase;
let sut: GetQuoteSignatureStatusUseCase;

describe('GetQuoteSignatureStatusUseCase', () => {
  beforeEach(() => {
    quotesRepository = new InMemoryQuotesRepository();
    envelopesRepository = new InMemorySignatureEnvelopesRepository();
    getEnvelopeByIdUseCase = new GetEnvelopeByIdUseCase(envelopesRepository);
    sut = new GetQuoteSignatureStatusUseCase(
      quotesRepository,
      getEnvelopeByIdUseCase,
    );
  });

  it('should return the signature envelope for a quote', async () => {
    const envelope = SignatureEnvelope.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      title: 'Orcamento: Test',
      signatureLevel: 'SIMPLE',
      documentFileId: 'file-1',
      documentHash: 'hash123',
      sourceModule: 'sales',
      sourceEntityType: 'quote',
      sourceEntityId: 'quote-1',
      routingType: 'SEQUENTIAL',
      createdByUserId: 'user-1',
    });
    envelopesRepository.items.push(envelope);

    const quote = Quote.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      customerId: new UniqueEntityID('customer-1'),
      title: 'Test Quote',
      status: 'SENT',
      signatureEnvelopeId: envelope.id.toString(),
      createdBy: 'user-1',
    });
    quotesRepository.quotes.push(quote);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      quoteId: quote.id.toString(),
    });

    expect(result.envelope.id.toString()).toBe(envelope.id.toString());
    expect(result.envelope.status).toBe('DRAFT');
  });

  it('should throw if quote is not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        quoteId: 'non-existent',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw if quote has no signature envelope', async () => {
    const quote = Quote.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      customerId: new UniqueEntityID('customer-1'),
      title: 'Test Quote',
      status: 'SENT',
      createdBy: 'user-1',
    });
    quotesRepository.quotes.push(quote);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        quoteId: quote.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
