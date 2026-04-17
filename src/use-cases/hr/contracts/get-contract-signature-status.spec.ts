import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryGeneratedEmploymentContractsRepository } from '@/repositories/hr/in-memory/in-memory-generated-employment-contracts-repository';
import { InMemorySignatureAuditEventsRepository } from '@/repositories/signature/in-memory/in-memory-signature-audit-events-repository';
import { InMemorySignatureEnvelopeSignersRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelope-signers-repository';
import { InMemorySignatureEnvelopesRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelopes-repository';
import { CreateEnvelopeUseCase } from '@/use-cases/signature/envelopes/create-envelope';
import { GetEnvelopeByIdUseCase } from '@/use-cases/signature/envelopes/get-envelope-by-id';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetContractSignatureStatusUseCase } from './get-contract-signature-status';

const TENANT_ID = new UniqueEntityID().toString();
const USER_ID = new UniqueEntityID().toString();

let contractsRepository: InMemoryGeneratedEmploymentContractsRepository;
let envelopesRepository: InMemorySignatureEnvelopesRepository;
let signersRepository: InMemorySignatureEnvelopeSignersRepository;
let auditEventsRepository: InMemorySignatureAuditEventsRepository;
let createEnvelopeUseCase: CreateEnvelopeUseCase;
let getEnvelopeByIdUseCase: GetEnvelopeByIdUseCase;
let sut: GetContractSignatureStatusUseCase;

describe('GetContractSignatureStatusUseCase', () => {
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
    getEnvelopeByIdUseCase = new GetEnvelopeByIdUseCase(envelopesRepository);
    sut = new GetContractSignatureStatusUseCase(
      contractsRepository,
      getEnvelopeByIdUseCase,
    );
  });

  it('returns the envelope attached to the contract', async () => {
    const contract = await contractsRepository.create({
      tenantId: TENANT_ID,
      templateId: new UniqueEntityID(),
      employeeId: new UniqueEntityID(),
      generatedBy: new UniqueEntityID(USER_ID),
      variables: {},
      pdfKey: 'hr/contracts/tenant/contract.pdf',
    });

    const { envelope: createdEnvelope } = await createEnvelopeUseCase.execute({
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
      createdEnvelope.id.toString(),
      TENANT_ID,
    );

    const { envelope } = await sut.execute({
      tenantId: TENANT_ID,
      contractId: contract.id.toString(),
    });

    expect(envelope.id.toString()).toBe(createdEnvelope.id.toString());
  });

  it('throws ResourceNotFoundError when contract does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        contractId: new UniqueEntityID().toString(),
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
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
