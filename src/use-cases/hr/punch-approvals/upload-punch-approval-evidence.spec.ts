import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';

import { UploadPunchApprovalEvidenceUseCase } from './upload-punch-approval-evidence';

let uploadWithKey: ReturnType<typeof vi.fn>;
let sut: UploadPunchApprovalEvidenceUseCase;

describe('UploadPunchApprovalEvidenceUseCase', () => {
  beforeEach(() => {
    uploadWithKey = vi.fn().mockResolvedValue({
      key: 'stub',
      bucket: 'stub',
      size: 0,
    });
    sut = new UploadPunchApprovalEvidenceUseCase({ uploadWithKey });
  });

  it('rejeita mimeType não-PDF com BadRequestError', async () => {
    await expect(
      sut.execute({
        tenantId: 't1',
        approvalId: 'a1',
        uploadedBy: 'u1',
        buffer: Buffer.from('fake'),
        filename: 'x.jpg',
        mimeType: 'image/jpeg',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
    expect(uploadWithKey).not.toHaveBeenCalled();
  });

  it('rejeita arquivo > 10MB com BadRequestError', async () => {
    await expect(
      sut.execute({
        tenantId: 't1',
        approvalId: 'a1',
        uploadedBy: 'u1',
        buffer: Buffer.alloc(10 * 1024 * 1024 + 1), // 10MB + 1 byte
        filename: 'huge.pdf',
        mimeType: 'application/pdf',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
    expect(uploadWithKey).not.toHaveBeenCalled();
  });

  it('rejeita buffer vazio', async () => {
    await expect(
      sut.execute({
        tenantId: 't1',
        approvalId: 'a1',
        uploadedBy: 'u1',
        buffer: Buffer.alloc(0),
        filename: 'empty.pdf',
        mimeType: 'application/pdf',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('upload válido retorna storageKey + size + uploadedAt ISO', async () => {
    const buffer = Buffer.from('%PDF-1.4 simulated');
    const result = await sut.execute({
      tenantId: 'tenant-xyz',
      approvalId: 'approval-abc',
      uploadedBy: 'user-123',
      buffer,
      filename: 'atestado.pdf',
      mimeType: 'application/pdf',
    });

    expect(result.storageKey).toMatch(
      /^tenant-xyz\/punch-approvals\/approval-abc\/evidence\/[0-9a-f-]{36}\.pdf$/,
    );
    expect(result.size).toBe(buffer.byteLength);
    expect(result.uploadedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result.filename).toBe('atestado.pdf');

    expect(uploadWithKey).toHaveBeenCalledTimes(1);
    const [bufArg, keyArg, opts] = uploadWithKey.mock.calls[0];
    expect(bufArg).toBe(buffer);
    expect(keyArg).toBe(result.storageKey);
    expect(opts.mimeType).toBe('application/pdf');
    expect(opts.cacheControl).toBe('private, max-age=0, no-store');
    expect(opts.metadata).toEqual({
      'x-tenant-id': 'tenant-xyz',
      'x-approval-id': 'approval-abc',
      'x-uploaded-by': 'user-123',
    });
  });
});
