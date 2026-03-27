import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Proposal } from '@/entities/sales/proposal';
import { SignatureEnvelope } from '@/entities/signature/signature-envelope';
import { InMemoryProposalsRepository } from '@/repositories/sales/in-memory/in-memory-proposals-repository';
import { InMemorySignatureEnvelopesRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelopes-repository';
import { GetEnvelopeByIdUseCase } from '@/use-cases/signature/envelopes/get-envelope-by-id';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetProposalSignatureStatusUseCase } from './get-proposal-signature-status';

const TENANT_ID = 'tenant-1';

let proposalsRepository: InMemoryProposalsRepository;
let envelopesRepository: InMemorySignatureEnvelopesRepository;
let getEnvelopeByIdUseCase: GetEnvelopeByIdUseCase;
let sut: GetProposalSignatureStatusUseCase;

describe('GetProposalSignatureStatusUseCase', () => {
  beforeEach(() => {
    proposalsRepository = new InMemoryProposalsRepository();
    envelopesRepository = new InMemorySignatureEnvelopesRepository();
    getEnvelopeByIdUseCase = new GetEnvelopeByIdUseCase(envelopesRepository);
    sut = new GetProposalSignatureStatusUseCase(
      proposalsRepository,
      getEnvelopeByIdUseCase,
    );
  });

  it('should return the signature envelope for a proposal', async () => {
    const envelope = SignatureEnvelope.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      title: 'Proposta: Test',
      signatureLevel: 'SIMPLE',
      documentFileId: 'file-1',
      documentHash: 'hash456',
      sourceModule: 'sales',
      sourceEntityType: 'proposal',
      sourceEntityId: 'proposal-1',
      routingType: 'SEQUENTIAL',
      createdByUserId: 'user-1',
    });
    envelopesRepository.items.push(envelope);

    const proposal = Proposal.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      customerId: new UniqueEntityID('customer-1'),
      title: 'Test Proposal',
      status: 'SENT',
      signatureEnvelopeId: envelope.id.toString(),
      createdBy: 'user-1',
    });
    proposalsRepository.proposals.push(proposal);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      proposalId: proposal.id.toString(),
    });

    expect(result.envelope.id.toString()).toBe(envelope.id.toString());
    expect(result.envelope.status).toBe('DRAFT');
  });

  it('should throw if proposal is not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        proposalId: 'non-existent',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw if proposal has no signature envelope', async () => {
    const proposal = Proposal.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      customerId: new UniqueEntityID('customer-1'),
      title: 'Test Proposal',
      status: 'SENT',
      createdBy: 'user-1',
    });
    proposalsRepository.proposals.push(proposal);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        proposalId: proposal.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
