vi.mock('@/services/banking/convert-pfx', () => ({
  convertPfxToPem: vi.fn(),
}));

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { convertPfxToPem } from '@/services/banking/convert-pfx';
import type { FileUploadService } from '@/services/storage/file-upload-service';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConvertPfxCertificateUseCase } from './convert-pfx-certificate';

const mockConvertPfxToPem = vi.mocked(convertPfxToPem);

function makeFileUploadService(): FileUploadService {
  return {
    upload: vi.fn().mockResolvedValue({
      key: 'uploaded-key',
      url: 'https://s3/file',
      size: 100,
      mimeType: 'application/x-pem-file',
    }),
    getPresignedUrl: vi.fn(),
    getObject: vi.fn(),
    delete: vi.fn(),
    initiateMultipartUpload: vi.fn(),
    getPresignedPartUrls: vi.fn(),
    completeMultipartUpload: vi.fn(),
    abortMultipartUpload: vi.fn(),
  } as unknown as FileUploadService;
}

let fileUploadService: FileUploadService;
let sut: ConvertPfxCertificateUseCase;

describe('ConvertPfxCertificateUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fileUploadService = makeFileUploadService();
    sut = new ConvertPfxCertificateUseCase(fileUploadService);
  });

  it('should convert PFX and upload cert + key PEM files', async () => {
    const certBuffer = Buffer.from('cert-pem');
    const keyBuffer = Buffer.from('key-pem');

    mockConvertPfxToPem.mockReturnValue({ cert: certBuffer, key: keyBuffer });

    const uploadMock = vi.mocked(fileUploadService.upload);
    uploadMock
      .mockResolvedValueOnce({
        key: 'cert-file-id',
        url: '',
        size: 100,
        mimeType: 'application/x-pem-file',
      })
      .mockResolvedValueOnce({
        key: 'key-file-id',
        url: '',
        size: 100,
        mimeType: 'application/x-pem-file',
      });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      pfxBuffer: Buffer.from('pfx-content'),
      pfxPassword: 'secret',
    });

    expect(result.certFileId).toBe('cert-file-id');
    expect(result.keyFileId).toBe('key-file-id');
    expect(mockConvertPfxToPem).toHaveBeenCalledWith(
      Buffer.from('pfx-content'),
      'secret',
    );
    expect(uploadMock).toHaveBeenCalledTimes(2);
    expect(uploadMock).toHaveBeenCalledWith(
      certBuffer,
      'bank-1-cert.pem',
      'application/x-pem-file',
      { prefix: 'tenants/tenant-1/bank-certificates' },
    );
    expect(uploadMock).toHaveBeenCalledWith(
      keyBuffer,
      'bank-1-key.pem',
      'application/x-pem-file',
      { prefix: 'tenants/tenant-1/bank-certificates' },
    );
  });

  it('should throw BadRequestError when PFX conversion fails with Error', async () => {
    mockConvertPfxToPem.mockImplementation(() => {
      throw new Error('Invalid password');
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        bankAccountId: 'bank-1',
        pfxBuffer: Buffer.from('bad-pfx'),
        pfxPassword: 'wrong',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError with generic message when non-Error is thrown', async () => {
    mockConvertPfxToPem.mockImplementation(() => {
      throw 'unexpected';
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        bankAccountId: 'bank-1',
        pfxBuffer: Buffer.from('bad-pfx'),
        pfxPassword: 'wrong',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
