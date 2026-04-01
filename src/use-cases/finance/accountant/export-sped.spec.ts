import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExportSpedUseCase } from './export-sped';
import { InMemoryAccountantAccessesRepository } from '@/repositories/finance/in-memory/in-memory-accountant-accesses-repository';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import type { SpedExportResult } from '@/services/finance/sped-export.service';

function makeSpedExportServiceMock() {
  return {
    export: vi.fn<[], Promise<SpedExportResult>>().mockResolvedValue({
      fileName: 'SPED_ECD_2024_01_12.txt',
      data: Buffer.from('|0000|LECD|...|\r\n'),
      mimeType: 'text/plain; charset=utf-8',
    }),
  };
}

describe('ExportSpedUseCase', () => {
  let accessesRepo: InMemoryAccountantAccessesRepository;
  let spedService: ReturnType<typeof makeSpedExportServiceMock>;
  let sut: ExportSpedUseCase;

  beforeEach(() => {
    accessesRepo = new InMemoryAccountantAccessesRepository();
    spedService = makeSpedExportServiceMock();
    sut = new ExportSpedUseCase(accessesRepo, spedService as never);
  });

  it('should export SPED file when token is valid and active', async () => {
    // Create an active access token
    await accessesRepo.create({
      tenantId: 'tenant-1',
      email: 'contador@empresa.com',
      name: 'Contador',
      accessToken: 'valid-token-123',
    });

    const result = await sut.execute({
      accessToken: 'valid-token-123',
      year: 2024,
      startMonth: 1,
      endMonth: 12,
      format: 'ECD',
    });

    expect(result.fileName).toBe('SPED_ECD_2024_01_12.txt');
    expect(result.data).toBeInstanceOf(Buffer);
    expect(result.mimeType).toBe('text/plain; charset=utf-8');
    expect(spedService.export).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      year: 2024,
      startMonth: 1,
      endMonth: 12,
      format: 'ECD',
    });
  });

  it('should use default startMonth=1 and endMonth=12 when not provided', async () => {
    await accessesRepo.create({
      tenantId: 'tenant-1',
      email: 'contador@empresa.com',
      name: 'Contador',
      accessToken: 'token-defaults',
    });

    await sut.execute({
      accessToken: 'token-defaults',
      year: 2024,
      format: 'ECD',
    });

    expect(spedService.export).toHaveBeenCalledWith(
      expect.objectContaining({ startMonth: 1, endMonth: 12 }),
    );
  });

  it('should throw UnauthorizedError when token is not found', async () => {
    await expect(
      sut.execute({
        accessToken: 'non-existent-token',
        year: 2024,
        format: 'ECD',
      }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should throw UnauthorizedError when access is inactive', async () => {
    const record = await accessesRepo.create({
      tenantId: 'tenant-1',
      email: 'contador@empresa.com',
      name: 'Contador',
      accessToken: 'inactive-token',
    });

    // Deactivate the access
    await accessesRepo.deactivate(record.id, 'tenant-1');

    await expect(
      sut.execute({
        accessToken: 'inactive-token',
        year: 2024,
        format: 'ECD',
      }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should throw UnauthorizedError when token is expired', async () => {
    const pastDate = new Date('2020-01-01');

    await accessesRepo.create({
      tenantId: 'tenant-1',
      email: 'contador@empresa.com',
      name: 'Contador',
      accessToken: 'expired-token',
      expiresAt: pastDate,
    });

    await expect(
      sut.execute({
        accessToken: 'expired-token',
        year: 2024,
        format: 'ECD',
      }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should update lastAccessAt after successful export', async () => {
    const record = await accessesRepo.create({
      tenantId: 'tenant-1',
      email: 'contador@empresa.com',
      name: 'Contador',
      accessToken: 'update-token',
    });

    expect(record.lastAccessAt).toBeNull();

    await sut.execute({
      accessToken: 'update-token',
      year: 2024,
      format: 'ECD',
    });

    const updated = await accessesRepo.findByToken('update-token');
    expect(updated?.lastAccessAt).not.toBeNull();
  });

  it('should not expire a token with future expiresAt', async () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days

    await accessesRepo.create({
      tenantId: 'tenant-1',
      email: 'contador@empresa.com',
      name: 'Contador',
      accessToken: 'future-expiry-token',
      expiresAt: futureDate,
    });

    await expect(
      sut.execute({
        accessToken: 'future-expiry-token',
        year: 2024,
        format: 'ECD',
      }),
    ).resolves.not.toThrow();
  });
});
