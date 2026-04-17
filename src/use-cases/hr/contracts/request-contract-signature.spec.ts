import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Employee } from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryGeneratedEmploymentContractsRepository } from '@/repositories/hr/in-memory/in-memory-generated-employment-contracts-repository';
import { InMemorySignatureAuditEventsRepository } from '@/repositories/signature/in-memory/in-memory-signature-audit-events-repository';
import { InMemorySignatureEnvelopeSignersRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelope-signers-repository';
import { InMemorySignatureEnvelopesRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelopes-repository';
import { InMemoryStorageFilesRepository } from '@/repositories/storage/in-memory/in-memory-storage-files-repository';
import type {
  FileUploadService,
  MultipartCompletePart,
  MultipartPartUrl,
  MultipartUploadInit,
  UploadOptions,
  UploadResult,
} from '@/services/storage/file-upload-service';
import { CreateEnvelopeUseCase } from '@/use-cases/signature/envelopes/create-envelope';
import { GetEnvelopeByIdUseCase } from '@/use-cases/signature/envelopes/get-envelope-by-id';
import { beforeEach, describe, expect, it } from 'vitest';
import { RequestContractSignatureUseCase } from './request-contract-signature';

class StubFileUploadService implements FileUploadService {
  public pdfBuffer: Buffer = Buffer.from('mock-contract-pdf-bytes');

  async upload(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    options: UploadOptions,
  ): Promise<UploadResult> {
    return {
      key: `${options.prefix}/${fileName}`,
      url: `https://files.example.com/${options.prefix}/${fileName}`,
      size: fileBuffer.length,
      mimeType,
    };
  }

  async getPresignedUrl(key: string): Promise<string> {
    return `https://files.example.com/signed/${key}`;
  }

  async getObject(): Promise<Buffer> {
    return this.pdfBuffer;
  }

  async delete(): Promise<void> {}

  async initiateMultipartUpload(): Promise<MultipartUploadInit> {
    return { uploadId: 'mp-1', key: 'mp-1' };
  }

  async getPresignedPartUrls(): Promise<MultipartPartUrl[]> {
    return [];
  }

  async completeMultipartUpload(): Promise<UploadResult> {
    return { key: '', url: '', size: 0, mimeType: '' };
  }

  async abortMultipartUpload(): Promise<void> {}

  async getPresignedPartUrlsParts(
    _key: string,
    _uploadId: string,
    _parts: MultipartCompletePart[],
  ): Promise<void> {}
}

const TENANT_ID = new UniqueEntityID().toString();
const USER_ID = new UniqueEntityID().toString();
const VALID_CPFS = ['529.982.247-25', '123.456.789-09', '935.411.347-80'];

let contractsRepository: InMemoryGeneratedEmploymentContractsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let storageFilesRepository: InMemoryStorageFilesRepository;
let envelopesRepository: InMemorySignatureEnvelopesRepository;
let signersRepository: InMemorySignatureEnvelopeSignersRepository;
let auditEventsRepository: InMemorySignatureAuditEventsRepository;
let fileUploadService: StubFileUploadService;
let createEnvelopeUseCase: CreateEnvelopeUseCase;
let getEnvelopeByIdUseCase: GetEnvelopeByIdUseCase;
let sut: RequestContractSignatureUseCase;

async function createTestEmployee(
  overrides?: Partial<{
    email?: string;
    cpf: string;
    fullName: string;
    registrationNumber: string;
  }>,
): Promise<Employee> {
  return employeesRepository.create({
    tenantId: TENANT_ID,
    registrationNumber: overrides?.registrationNumber ?? 'EMP-9001',
    fullName: overrides?.fullName ?? 'Mariana Lopes',
    cpf: CPF.create(overrides?.cpf ?? VALID_CPFS[0]),
    hireDate: new Date('2024-01-10'),
    status: EmployeeStatus.ACTIVE(),
    baseSalary: 6500,
    contractType: ContractType.CLT(),
    workRegime: WorkRegime.FULL_TIME(),
    weeklyHours: 44,
    country: 'Brasil',
    email: overrides?.email,
  });
}

async function createTestContract(
  employeeId: UniqueEntityID,
  overrides?: Partial<{
    pdfKey: string;
    pdfUrl: string;
    signatureEnvelopeId: string | null;
  }>,
) {
  const contract = await contractsRepository.create({
    tenantId: TENANT_ID,
    templateId: new UniqueEntityID(),
    employeeId,
    generatedBy: new UniqueEntityID(USER_ID),
    variables: {},
    pdfKey: overrides?.pdfKey ?? 'hr/contracts/tenant/contract-9001.pdf',
    pdfUrl: overrides?.pdfUrl ?? 'https://files.example.com/contract-9001.pdf',
  });

  if (overrides?.signatureEnvelopeId !== undefined) {
    contract.signatureEnvelopeId = overrides.signatureEnvelopeId;
    await contractsRepository.save(contract);
  }

  return contract;
}

describe('RequestContractSignatureUseCase', () => {
  beforeEach(() => {
    contractsRepository = new InMemoryGeneratedEmploymentContractsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    storageFilesRepository = new InMemoryStorageFilesRepository();
    envelopesRepository = new InMemorySignatureEnvelopesRepository();
    signersRepository = new InMemorySignatureEnvelopeSignersRepository();
    auditEventsRepository = new InMemorySignatureAuditEventsRepository();
    fileUploadService = new StubFileUploadService();
    createEnvelopeUseCase = new CreateEnvelopeUseCase(
      envelopesRepository,
      signersRepository,
      auditEventsRepository,
    );
    getEnvelopeByIdUseCase = new GetEnvelopeByIdUseCase(envelopesRepository);
    sut = new RequestContractSignatureUseCase(
      contractsRepository,
      employeesRepository,
      storageFilesRepository,
      createEnvelopeUseCase,
      getEnvelopeByIdUseCase,
      fileUploadService,
    );
  });

  it('creates a signature envelope for an employment contract', async () => {
    const employee = await createTestEmployee({ email: 'mariana@acme.com' });
    const contract = await createTestContract(employee.id);

    const { envelope, envelopeId } = await sut.execute({
      tenantId: TENANT_ID,
      contractId: contract.id.toString(),
      userId: USER_ID,
    });

    expect(envelopeId).toBe(envelope.id.toString());
    expect(envelope.title).toBe('Contrato de trabalho — Mariana Lopes');
    expect(envelope.sourceModule).toBe('hr');
    expect(envelope.sourceEntityType).toBe('employment_contract');
    expect(envelope.sourceEntityId).toBe(contract.id.toString());
    expect(envelopesRepository.items).toHaveLength(1);
    expect(signersRepository.items).toHaveLength(1);
    expect(signersRepository.items[0].externalEmail).toBe('mariana@acme.com');

    const updatedContract = await contractsRepository.findById(
      contract.id,
      TENANT_ID,
    );
    expect(updatedContract?.signatureEnvelopeId).toBe(envelope.id.toString());
  });

  it('creates a StorageFile on demand when the contract only has pdfKey', async () => {
    const employee = await createTestEmployee({ email: 'mariana@acme.com' });
    const contract = await createTestContract(employee.id);

    expect(storageFilesRepository.items).toHaveLength(0);

    await sut.execute({
      tenantId: TENANT_ID,
      contractId: contract.id.toString(),
      userId: USER_ID,
    });

    expect(storageFilesRepository.items).toHaveLength(1);
    const storageFile = storageFilesRepository.items[0];
    expect(storageFile.entityType).toBe('employment_contract');
    expect(storageFile.entityId).toBe(contract.id.toString());

    const updatedContract = await contractsRepository.findById(
      contract.id,
      TENANT_ID,
    );
    expect(updatedContract?.storageFileId?.toString()).toBe(
      storageFile.id.toString(),
    );
  });

  it('uses signerEmail and signerName overrides when provided', async () => {
    const employee = await createTestEmployee({ email: 'mariana@acme.com' });
    const contract = await createTestContract(employee.id);

    await sut.execute({
      tenantId: TENANT_ID,
      contractId: contract.id.toString(),
      userId: USER_ID,
      signerEmail: 'override@acme.com',
      signerName: 'Override Name',
    });

    expect(signersRepository.items[0].externalEmail).toBe('override@acme.com');
    expect(signersRepository.items[0].externalName).toBe('Override Name');
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

  it('throws BadRequestError when the employee has no email and no override is provided', async () => {
    const employee = await createTestEmployee();
    const contract = await createTestContract(employee.id);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        contractId: contract.id.toString(),
        userId: USER_ID,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('throws BadRequestError when contract already has an active envelope', async () => {
    const employee = await createTestEmployee({ email: 'mariana@acme.com' });
    const contract = await createTestContract(employee.id);

    const { envelope } = await sut.execute({
      tenantId: TENANT_ID,
      contractId: contract.id.toString(),
      userId: USER_ID,
    });
    expect(['DRAFT', 'PENDING', 'IN_PROGRESS']).toContain(envelope.status);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        contractId: contract.id.toString(),
        userId: USER_ID,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('allows re-sending after previous envelope was cancelled', async () => {
    const employee = await createTestEmployee({ email: 'mariana@acme.com' });
    const contract = await createTestContract(employee.id);

    const firstResult = await sut.execute({
      tenantId: TENANT_ID,
      contractId: contract.id.toString(),
      userId: USER_ID,
    });

    // Simulate envelope being cancelled externally.
    const cancelledEnvelope = envelopesRepository.items.find(
      (item) => item.id.toString() === firstResult.envelopeId,
    );
    if (cancelledEnvelope) {
      cancelledEnvelope.status = 'CANCELLED';
    }

    const secondResult = await sut.execute({
      tenantId: TENANT_ID,
      contractId: contract.id.toString(),
      userId: USER_ID,
    });

    expect(secondResult.envelopeId).not.toBe(firstResult.envelopeId);
    expect(envelopesRepository.items).toHaveLength(2);
  });

  it('throws BadRequestError when contract has no pdfKey', async () => {
    const employee = await createTestEmployee({ email: 'mariana@acme.com' });
    const contract = await contractsRepository.create({
      tenantId: TENANT_ID,
      templateId: new UniqueEntityID(),
      employeeId: employee.id,
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

  it('sets expiresAt 14 days in the future by default', async () => {
    const employee = await createTestEmployee({ email: 'mariana@acme.com' });
    const contract = await createTestContract(employee.id);

    const before = Date.now();
    const { envelope } = await sut.execute({
      tenantId: TENANT_ID,
      contractId: contract.id.toString(),
      userId: USER_ID,
    });
    const after = Date.now();

    expect(envelope.expiresAt).toBeDefined();
    const expiresAtMs = envelope.expiresAt!.getTime();
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
    expect(expiresAtMs).toBeGreaterThanOrEqual(before + fourteenDaysMs - 1000);
    expect(expiresAtMs).toBeLessThanOrEqual(after + fourteenDaysMs + 1000);
  });

  it('honours expiresInDays override', async () => {
    const employee = await createTestEmployee({ email: 'mariana@acme.com' });
    const contract = await createTestContract(employee.id);

    const before = Date.now();
    const { envelope } = await sut.execute({
      tenantId: TENANT_ID,
      contractId: contract.id.toString(),
      userId: USER_ID,
      expiresInDays: 30,
    });
    const after = Date.now();

    const expiresAtMs = envelope.expiresAt!.getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    expect(expiresAtMs).toBeGreaterThanOrEqual(before + thirtyDaysMs - 1000);
    expect(expiresAtMs).toBeLessThanOrEqual(after + thirtyDaysMs + 1000);
  });
});
