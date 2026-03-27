import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SignatureEnvelope } from '@/entities/signature/signature-envelope';
import type { CustomersRepository } from '@/repositories/sales/customers-repository';
import type { ProposalsRepository } from '@/repositories/sales/proposals-repository';
import type { CreateEnvelopeUseCase } from '@/use-cases/signature/envelopes/create-envelope';

interface RequestProposalSignatureUseCaseRequest {
  tenantId: string;
  proposalId: string;
  userId: string;
  signerEmail?: string;
  signerName?: string;
  documentFileId: string;
  documentHash: string;
}

interface RequestProposalSignatureUseCaseResponse {
  envelope: SignatureEnvelope;
}

export class RequestProposalSignatureUseCase {
  constructor(
    private proposalsRepository: ProposalsRepository,
    private customersRepository: CustomersRepository,
    private createEnvelopeUseCase: CreateEnvelopeUseCase,
  ) {}

  async execute(
    input: RequestProposalSignatureUseCaseRequest,
  ): Promise<RequestProposalSignatureUseCaseResponse> {
    const proposal = await this.proposalsRepository.findById(
      new UniqueEntityID(input.proposalId),
      input.tenantId,
    );

    if (!proposal) {
      throw new ResourceNotFoundError('Proposal not found.');
    }

    if (proposal.status !== 'SENT') {
      throw new BadRequestError(
        'Only proposals in SENT status can be sent for signature.',
      );
    }

    if (proposal.signatureEnvelopeId) {
      throw new BadRequestError(
        'This proposal already has a signature envelope attached.',
      );
    }

    const customer = await this.customersRepository.findById(
      proposal.customerId,
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
      title: `Proposta: ${proposal.title}`,
      signatureLevel: 'SIMPLE',
      documentFileId: input.documentFileId,
      documentHash: input.documentHash,
      sourceModule: 'sales',
      sourceEntityType: 'proposal',
      sourceEntityId: input.proposalId,
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

    proposal.signatureEnvelopeId = envelope.id.toString();
    await this.proposalsRepository.save(proposal);

    return { envelope };
  }
}
