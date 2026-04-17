import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryGeneratedEmploymentContractsRepository } from '@/repositories/hr/in-memory/in-memory-generated-employment-contracts-repository';
import { InMemorySignatureAuditEventsRepository } from '@/repositories/signature/in-memory/in-memory-signature-audit-events-repository';
import { InMemorySignatureEnvelopeSignersRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelope-signers-repository';
import { InMemorySignatureEnvelopesRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelopes-repository';
import { CancelEnvelopeUseCase } from '@/use-cases/signature/envelopes/cancel-envelope';
import { CreateEnvelopeUseCase } from '@/use-cases/signature/envelopes/create-envelope';
import { beforeEach, describe, expect, it } from 'vitest';
import { CancelContractSignatureUseCase } from './cancel-contract-signature';

const TENANT_ID = new UniqueEntityID().toString();
const USER_ID = new UniqueEntityID().toString();

let contractsRepository: InMemoryGeneratedEmploymentContractsRepository;
let envelopesRepository: InMemorySignatureEnvelopesRepository;
let signersRepository: InMemorySignatureEnvelopeSignersRepository;
let auditEventsRepository: InMemorySignatureAuditEventsRepository;
let createEnvelopeUseCase: CreateEnvelopeUseCase;
let cancelEnvelopeUseCase: CancelEnvelopeUseCase;
let sut: CancelContractSignatureUseCase;

describe('CancelContractSignatureUseCase', () => {
  beforeEach(() => {
    contractsRepository = new InMemoryGeneratedEmploymentContractsRepository();
    envelopesRepository = new InMemorySignatureEnvelopesRepository();
    signersRepository = new InMemorySignatureEnvelopeSignersRepository();
    auditEventsRepository = new InMemorySignatureAuditEventsRepository();
    createEnvelopeUseCase = new CreateEnvelopeUseCase(
      envelopesRepository,
      signersRepository,
      auditEventsRepository,
    );
    cancelEnvelopeUseCase = new CancelEnvelopeUseCase(
      envelopesRepository,
      signersRepository,
      auditEventsRepository,
    );
    sut = new CancelContractSignatureUseCase(
      contractsRepository,
      cancelEnvelopeUseCase,
    );
  });

  it('cancels the envelope attached to the contract', async () => {
    const contract = await contractsRepository.create({
      tenantId: TENANT_ID,
      templateId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      generatedBy: new UniqueEntityID(USER_ID),
      variables: {},
      pdfKey: 'hr/contracts/tenant/contract.pdf',
    });

    const { envelope } = await createEnvelopeUseCase.execute({
      tenantId: TENANT_ID,
      title: 'Contrato de trabalho — Test',
      signatureLevel: 'ADVANCED',
      documentFileId: new UniqueEntityID().toString(),
      documentHash: 'abc',
      sourceModule: 'hr',
      sourceEntityType: 'employment_contract',
      sourceEntityId: contract.id.toString(),
      routingType: 'SEQUENTIAL',
      createdByUserId: USER_ID,
      signers: [
        {
          externalName: 'Tester',
          externalEmail: 'test@acme.com',
          order: 1,
          group: 1,
          role: 'SIGNER',
          signatureLevel: 'ADVANCED',
        },
      ],
    });

    await contractsRepository.updateSignatureEnvelopeId(
      contract.id,
      envelope.id.toString(),
      TENANT_ID,
    );

    await sut.execute({
      tenantId: TENANT_ID,
      contractId: contract.id.toString(),
      userId: USER_ID,
      reason: 'Cancelled by HR',
    });

    const cancelled = envelopesRepository.items.find(
      (item) => item.id.toString() === envelope.id.toString(),
    );
    expect(cancelled?.status).toBe('CANCELLED');

    // signatureEnvelopeId must be kept on the contract for audit purposes.
    const updatedContract = await contractsRepository.findById(
      contract.id,
      TENANT_ID,
    );
    expect(updatedContract?.signatureEnvelopeId).toBe(envelope.id.toString());
  });

  it('throws ResourceNotFoundError when contract does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        contractId: new UniqueEntityID().toString(),
        userId: USER_ID,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('throws BadRequestError when contract has no signature envelope', async () => {
    const contract = await contractsRepository.create({
      tenantId: TENANT_ID,
      templateId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      generatedBy: new UniqueEntityID(USER_ID),
      variables: {},
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        contractId: contract.id.toString(),
        userId: USER_ID,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
