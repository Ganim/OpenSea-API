import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Proposal } from '@/entities/sales/proposal';
import { Customer } from '@/entities/sales/customer';
import { CustomerType } from '@/entities/sales/value-objects/customer-type';
import { InMemoryCustomersRepository } from '@/repositories/sales/in-memory/in-memory-customers-repository';
import { InMemoryProposalsRepository } from '@/repositories/sales/in-memory/in-memory-proposals-repository';
import { InMemorySignatureEnvelopesRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelopes-repository';
import { InMemorySignatureEnvelopeSignersRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelope-signers-repository';
import { InMemorySignatureAuditEventsRepository } from '@/repositories/signature/in-memory/in-memory-signature-audit-events-repository';
import { CreateEnvelopeUseCase } from '@/use-cases/signature/envelopes/create-envelope';
import { beforeEach, describe, expect, it } from 'vitest';
import { RequestProposalSignatureUseCase } from './request-proposal-signature';

const TENANT_ID = 'tenant-1';
const USER_ID = 'user-1';

let proposalsRepository: InMemoryProposalsRepository;
let customersRepository: InMemoryCustomersRepository;
let envelopesRepository: InMemorySignatureEnvelopesRepository;
let signersRepository: InMemorySignatureEnvelopeSignersRepository;
let auditEventsRepository: InMemorySignatureAuditEventsRepository;
let createEnvelopeUseCase: CreateEnvelopeUseCase;
let sut: RequestProposalSignatureUseCase;

function createTestCustomer(overrides?: Partial<{ email: string }>): Customer {
  return Customer.create({
    tenantId: new UniqueEntityID(TENANT_ID),
    name: 'Beta Inc',
    type: new CustomerType('COMPANY'),
    email: overrides?.email ?? 'contact@beta.com',
  });
}

function createTestProposal(
  customerId: UniqueEntityID,
  overrides?: Partial<{
    status:
      | 'DRAFT'
      | 'SENT'
      | 'UNDER_REVIEW'
      | 'APPROVED'
      | 'REJECTED'
      | 'EXPIRED';
    signatureEnvelopeId: string;
  }>,
): Proposal {
  return Proposal.create({
    tenantId: new UniqueEntityID(TENANT_ID),
    customerId,
    title: 'Proposta Consultoria',
    status: overrides?.status ?? 'SENT',
    signatureEnvelopeId: overrides?.signatureEnvelopeId,
    createdBy: USER_ID,
  });
}

describe('RequestProposalSignatureUseCase', () => {
  beforeEach(() => {
    proposalsRepository = new InMemoryProposalsRepository();
    customersRepository = new InMemoryCustomersRepository();
    envelopesRepository = new InMemorySignatureEnvelopesRepository();
    signersRepository = new InMemorySignatureEnvelopeSignersRepository();
    auditEventsRepository = new InMemorySignatureAuditEventsRepository();
    createEnvelopeUseCase = new CreateEnvelopeUseCase(
      envelopesRepository,
      signersRepository,
      auditEventsRepository,
    );
    sut = new RequestProposalSignatureUseCase(
      proposalsRepository,
      customersRepository,
      createEnvelopeUseCase,
    );
  });

  it('should create a signature envelope for a sent proposal', async () => {
    const customer = createTestCustomer();
    customersRepository.items.push(customer);

    const proposal = createTestProposal(customer.id);
    proposalsRepository.proposals.push(proposal);

    const { envelope } = await sut.execute({
      tenantId: TENANT_ID,
      proposalId: proposal.id.toString(),
      userId: USER_ID,
      documentFileId: 'file-1',
      documentHash: 'hash456',
    });

    expect(envelope.title).toBe('Proposta: Proposta Consultoria');
    expect(envelope.sourceModule).toBe('sales');
    expect(envelope.sourceEntityType).toBe('proposal');
    expect(envelope.sourceEntityId).toBe(proposal.id.toString());
    expect(envelopesRepository.items).toHaveLength(1);
    expect(signersRepository.items).toHaveLength(1);
    expect(signersRepository.items[0].externalEmail).toBe('contact@beta.com');

    const updatedProposal = proposalsRepository.proposals[0];
    expect(updatedProposal.signatureEnvelopeId).toBe(envelope.id.toString());
  });

  it('should use signer override when provided', async () => {
    const customer = createTestCustomer();
    customersRepository.items.push(customer);

    const proposal = createTestProposal(customer.id);
    proposalsRepository.proposals.push(proposal);

    await sut.execute({
      tenantId: TENANT_ID,
      proposalId: proposal.id.toString(),
      userId: USER_ID,
      documentFileId: 'file-1',
      documentHash: 'hash456',
      signerEmail: 'ceo@beta.com',
      signerName: 'CEO Beta',
    });

    expect(signersRepository.items[0].externalEmail).toBe('ceo@beta.com');
    expect(signersRepository.items[0].externalName).toBe('CEO Beta');
  });

  it('should throw if proposal is not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        proposalId: 'non-existent',
        userId: USER_ID,
        documentFileId: 'file-1',
        documentHash: 'hash456',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw if proposal is not in SENT status', async () => {
    const customer = createTestCustomer();
    customersRepository.items.push(customer);

    const draftProposal = createTestProposal(customer.id, { status: 'DRAFT' });
    proposalsRepository.proposals.push(draftProposal);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        proposalId: draftProposal.id.toString(),
        userId: USER_ID,
        documentFileId: 'file-1',
        documentHash: 'hash456',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if proposal already has a signature envelope', async () => {
    const customer = createTestCustomer();
    customersRepository.items.push(customer);

    const proposal = createTestProposal(customer.id, {
      signatureEnvelopeId: 'existing-envelope-id',
    });
    proposalsRepository.proposals.push(proposal);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        proposalId: proposal.id.toString(),
        userId: USER_ID,
        documentFileId: 'file-1',
        documentHash: 'hash456',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if customer has no email and no override provided', async () => {
    const customerWithoutEmail = Customer.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'No Email Inc',
      type: new CustomerType('COMPANY'),
    });
    customersRepository.items.push(customerWithoutEmail);

    const proposal = createTestProposal(customerWithoutEmail.id);
    proposalsRepository.proposals.push(proposal);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        proposalId: proposal.id.toString(),
        userId: USER_ID,
        documentFileId: 'file-1',
        documentHash: 'hash456',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
