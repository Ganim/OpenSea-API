import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryGeneratedEmploymentContractsRepository } from '@/repositories/hr/in-memory/in-memory-generated-employment-contracts-repository';
import type {
  FileUploadService,
  MultipartCompletePart,
  MultipartPartUrl,
  MultipartUploadInit,
  UploadOptions,
  UploadResult,
} from '@/services/storage/file-upload-service';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetContractDownloadUrlUseCase } from './get-contract-download-url';

class StubFileUploadService implements FileUploadService {
  presigned = vi.fn(async (key: string, expiresIn?: number) => {
    return `https://files.example.com/signed/${key}?expiresIn=${expiresIn ?? 0}`;
  });

  async upload(
    _fileBuffer: Buffer,
    _fileName: string,
    _mimeType: string,
    _options: UploadOptions,
  ): Promise<UploadResult> {
    return { key: '', url: '', size: 0, mimeType: '' };
  }

  getPresignedUrl(key: string, expiresIn?: number) {
    return this.presigned(key, expiresIn);
  }

  async getObject(): Promise<Buffer> {
    return Buffer.alloc(0);
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

let generatedContractsRepository: InMemoryGeneratedEmploymentContractsRepository;
let fileUploadService: StubFileUploadService;
let sut: GetContractDownloadUrlUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Get Contract Download URL Use Case', () => {
  beforeEach(() => {
    generatedContractsRepository =
      new InMemoryGeneratedEmploymentContractsRepository();
    fileUploadService = new StubFileUploadService();
    sut = new GetContractDownloadUrlUseCase(
      generatedContractsRepository,
      fileUploadService,
    );
  });

  it('returns a presigned download URL using the stored pdfKey', async () => {
    const contract = await generatedContractsRepository.create({
      tenantId,
      employeeId: new UniqueEntityID(),
      templateId: new UniqueEntityID(),
      generatedBy: new UniqueEntityID(),
      variables: {},
      pdfKey: 'hr/contracts/tenant-1/file.pdf',
      pdfUrl: 'https://example.com/file.pdf',
    });

    const result = await sut.execute({
      tenantId,
      contractId: contract.id.toString(),
      expiresInSeconds: 600,
    });

    expect(result.downloadUrl).toContain('hr/contracts/tenant-1/file.pdf');
    expect(result.expiresInSeconds).toBe(600);
    expect(fileUploadService.presigned).toHaveBeenCalledWith(
      'hr/contracts/tenant-1/file.pdf',
      600,
    );
  });

  it('throws ResourceNotFoundError when the contract is missing', async () => {
    await expect(
      sut.execute({
        tenantId,
        contractId: new UniqueEntityID().toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('throws BadRequestError when the contract has no pdf attached', async () => {
    const contract = await generatedContractsRepository.create({
      tenantId,
      employeeId: new UniqueEntityID(),
      templateId: new UniqueEntityID(),
      generatedBy: new UniqueEntityID(),
      variables: {},
    });

    await expect(
      sut.execute({
        tenantId,
        contractId: contract.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
