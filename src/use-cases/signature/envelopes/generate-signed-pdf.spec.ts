import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemorySignatureEnvelopeSignersRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelope-signers-repository';
import { InMemorySignatureEnvelopesRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelopes-repository';
import { PDFDocument } from 'pdf-lib';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock env before importing anything that reads it
vi.mock('@/@env', () => ({
  env: {
    NODE_ENV: 'test',
    FRONTEND_URL: 'http://localhost:3000',
  },
}));

// Mock prisma client used by the use-case for StorageFile operations
const createdStorageFiles: unknown[] = [];
const createdFileVersions: unknown[] = [];

vi.mock('@/lib/prisma', () => ({
  prisma: {
    storageFile: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        return {
          id: where.id,
          fileKey: `storage/original-${where.id}`,
        };
      }),
      create: vi.fn(async ({ data }: { data: unknown }) => {
        createdStorageFiles.push(data);
        return data;
      }),
    },
    storageFileVersion: {
      create: vi.fn(async ({ data }: { data: unknown }) => {
        createdFileVersions.push(data);
        return data;
      }),
    },
  },
}));

import { GenerateSignedPDFUseCase } from './generate-signed-pdf';

const TENANT_ID = 'tenant-1';

class FakeFileUploadService {
  public uploadedBuffers: Buffer[] = [];

  async getObject(_key: string): Promise<Buffer> {
    const doc = await PDFDocument.create();
    doc.addPage([200, 200]);
    const bytes = await doc.save();
    return Buffer.from(bytes);
  }

  async upload(buffer: Buffer, fileName: string, mimeType: string) {
    this.uploadedBuffers.push(buffer);
    return {
      key: `signed/${fileName}`,
      url: `https://storage/signed/${fileName}`,
      size: buffer.length,
      mimeType,
    };
  }

  async getPresignedUrl() {
    return 'https://signed-url';
  }

  async delete() {}
  async initiateMultipartUpload(): Promise<never> {
    throw new Error('not used');
  }
  async getPresignedPartUrls(): Promise<never> {
    throw new Error('not used');
  }
  async completeMultipartUpload(): Promise<never> {
    throw new Error('not used');
  }
  async abortMultipartUpload(): Promise<never> {
    throw new Error('not used');
  }
}

let envelopesRepo: InMemorySignatureEnvelopesRepository;
let signersRepo: InMemorySignatureEnvelopeSignersRepository;
let uploadService: FakeFileUploadService;
let sut: GenerateSignedPDFUseCase;

describe('GenerateSignedPDFUseCase', () => {
  beforeEach(() => {
    envelopesRepo = new InMemorySignatureEnvelopesRepository();
    signersRepo = new InMemorySignatureEnvelopeSignersRepository();
    uploadService = new FakeFileUploadService();
    createdStorageFiles.length = 0;
    createdFileVersions.length = 0;
    sut = new GenerateSignedPDFUseCase(
      envelopesRepo,
      signersRepo,
      uploadService as never,
    );
  });

  it('should stamp the PDF, upload it, persist StorageFile, and set signedFileId', async () => {
    const envelope = await envelopesRepo.create({
      tenantId: TENANT_ID,
      title: 'Contract',
      signatureLevel: 'ADVANCED',
      verificationCode: 'VERIF123',
      documentFileId: 'file-1',
      documentHash: 'a'.repeat(64),
      sourceModule: 'sales',
      sourceEntityType: 'contract',
      sourceEntityId: 'c-1',
      routingType: 'PARALLEL',
      createdByUserId: 'user-1',
      status: 'COMPLETED',
    });

    await signersRepo.create({
      tenantId: TENANT_ID,
      envelopeId: envelope.id.toString(),
      signatureLevel: 'ADVANCED',
      externalName: 'João da Silva',
      externalEmail: 'joao@example.com',
      externalDocument: '12345678901',
      status: 'SIGNED',
    });
    signersRepo.items[0].props.signedAt = new Date('2026-04-17T12:00:00Z');
    signersRepo.items[0].props.ipAddress = '192.168.1.1';

    const response = await sut.execute({
      tenantId: TENANT_ID,
      envelopeId: envelope.id.toString(),
    });

    expect(response.signedFileId).not.toBeNull();
    expect(response.signedPdfUrl).not.toBeNull();
    expect(uploadService.uploadedBuffers).toHaveLength(1);
    expect(uploadService.uploadedBuffers[0].subarray(0, 4).toString()).toBe(
      '%PDF',
    );
    expect(createdStorageFiles).toHaveLength(1);
    expect(createdFileVersions).toHaveLength(1);
    expect(envelopesRepo.items[0].signedFileId).toBe(response.signedFileId);
  });

  it('should throw ResourceNotFoundError for missing envelope', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        envelopeId: 'missing-envelope',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('executeSafely should swallow errors and return null ids', async () => {
    const response = await sut.executeSafely({
      tenantId: TENANT_ID,
      envelopeId: 'missing',
    });

    expect(response.signedFileId).toBeNull();
    expect(response.signedPdfUrl).toBeNull();
  });
});
