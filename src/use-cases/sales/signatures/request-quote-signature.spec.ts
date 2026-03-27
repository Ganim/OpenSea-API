import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Quote } from '@/entities/sales/quote';
import { Customer } from '@/entities/sales/customer';
import { CustomerType } from '@/entities/sales/value-objects/customer-type';
import { InMemoryCustomersRepository } from '@/repositories/sales/in-memory/in-memory-customers-repository';
import { InMemoryQuotesRepository } from '@/repositories/sales/in-memory/in-memory-quotes-repository';
import { InMemorySignatureEnvelopesRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelopes-repository';
import { InMemorySignatureEnvelopeSignersRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelope-signers-repository';
import { InMemorySignatureAuditEventsRepository } from '@/repositories/signature/in-memory/in-memory-signature-audit-events-repository';
import { CreateEnvelopeUseCase } from '@/use-cases/signature/envelopes/create-envelope';
import { beforeEach, describe, expect, it } from 'vitest';
import { RequestQuoteSignatureUseCase } from './request-quote-signature';

const TENANT_ID = 'tenant-1';
const USER_ID = 'user-1';

let quotesRepository: InMemoryQuotesRepository;
let customersRepository: InMemoryCustomersRepository;
let envelopesRepository: InMemorySignatureEnvelopesRepository;
let signersRepository: InMemorySignatureEnvelopeSignersRepository;
let auditEventsRepository: InMemorySignatureAuditEventsRepository;
let createEnvelopeUseCase: CreateEnvelopeUseCase;
let sut: RequestQuoteSignatureUseCase;

function createTestCustomer(overrides?: Partial<{ email: string }>): Customer {
  return Customer.create({
    tenantId: new UniqueEntityID(TENANT_ID),
    name: 'Acme Corp',
    type: CustomerType.BUSINESS(),
    email: overrides?.email ?? 'customer@acme.com',
  });
}

function createTestQuote(
  customerId: UniqueEntityID,
  overrides?: Partial<{
    status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
    signatureEnvelopeId: string;
  }>,
): Quote {
  return Quote.create({
    tenantId: new UniqueEntityID(TENANT_ID),
    customerId,
    title: 'Orcamento Servidor Cloud',
    status: overrides?.status ?? 'SENT',
    signatureEnvelopeId: overrides?.signatureEnvelopeId,
    createdBy: USER_ID,
  });
}

describe('RequestQuoteSignatureUseCase', () => {
  beforeEach(() => {
    quotesRepository = new InMemoryQuotesRepository();
    customersRepository = new InMemoryCustomersRepository();
    envelopesRepository = new InMemorySignatureEnvelopesRepository();
    signersRepository = new InMemorySignatureEnvelopeSignersRepository();
    auditEventsRepository = new InMemorySignatureAuditEventsRepository();
    createEnvelopeUseCase = new CreateEnvelopeUseCase(
      envelopesRepository,
      signersRepository,
      auditEventsRepository,
    );
    sut = new RequestQuoteSignatureUseCase(
      quotesRepository,
      customersRepository,
      createEnvelopeUseCase,
    );
  });

  it('should create a signature envelope for a sent quote', async () => {
    const customer = createTestCustomer();
    customersRepository.items.push(customer);

    const quote = createTestQuote(customer.id);
    quotesRepository.quotes.push(quote);

    const { envelope } = await sut.execute({
      tenantId: TENANT_ID,
      quoteId: quote.id.toString(),
      userId: USER_ID,
      documentFileId: 'file-1',
      documentHash: 'hash123',
    });

    expect(envelope.title).toBe('Orcamento: Orcamento Servidor Cloud');
    expect(envelope.sourceModule).toBe('sales');
    expect(envelope.sourceEntityType).toBe('quote');
    expect(envelope.sourceEntityId).toBe(quote.id.toString());
    expect(envelopesRepository.items).toHaveLength(1);
    expect(signersRepository.items).toHaveLength(1);
    expect(signersRepository.items[0].externalEmail).toBe('customer@acme.com');

    const updatedQuote = quotesRepository.quotes[0];
    expect(updatedQuote.signatureEnvelopeId).toBe(envelope.id.toString());
  });

  it('should use signer override when provided', async () => {
    const customer = createTestCustomer();
    customersRepository.items.push(customer);

    const quote = createTestQuote(customer.id);
    quotesRepository.quotes.push(quote);

    await sut.execute({
      tenantId: TENANT_ID,
      quoteId: quote.id.toString(),
      userId: USER_ID,
      documentFileId: 'file-1',
      documentHash: 'hash123',
      signerEmail: 'director@acme.com',
      signerName: 'Director',
    });

    expect(signersRepository.items[0].externalEmail).toBe('director@acme.com');
    expect(signersRepository.items[0].externalName).toBe('Director');
  });

  it('should throw if quote is not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        quoteId: 'non-existent',
        userId: USER_ID,
        documentFileId: 'file-1',
        documentHash: 'hash123',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw if quote is not in SENT status', async () => {
    const customer = createTestCustomer();
    customersRepository.items.push(customer);

    const draftQuote = createTestQuote(customer.id, { status: 'DRAFT' });
    quotesRepository.quotes.push(draftQuote);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        quoteId: draftQuote.id.toString(),
        userId: USER_ID,
        documentFileId: 'file-1',
        documentHash: 'hash123',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if quote already has a signature envelope', async () => {
    const customer = createTestCustomer();
    customersRepository.items.push(customer);

    const quote = createTestQuote(customer.id, {
      signatureEnvelopeId: 'existing-envelope-id',
    });
    quotesRepository.quotes.push(quote);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        quoteId: quote.id.toString(),
        userId: USER_ID,
        documentFileId: 'file-1',
        documentHash: 'hash123',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if customer has no email and no override provided', async () => {
    const customerWithoutEmail = Customer.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'No Email Corp',
      type: CustomerType.BUSINESS(),
    });
    customersRepository.items.push(customerWithoutEmail);

    const quote = createTestQuote(customerWithoutEmail.id);
    quotesRepository.quotes.push(quote);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        quoteId: quote.id.toString(),
        userId: USER_ID,
        documentFileId: 'file-1',
        documentHash: 'hash123',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
