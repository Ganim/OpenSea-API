import { describe, expect, it, vi } from 'vitest';

import { ExportPunchCsvUseCase } from './export-punch-csv';
import type { PunchExportDataset } from './build-punch-export-dataset';

function makeDataset(rowCount = 0): PunchExportDataset {
  return {
    rows: Array.from({ length: rowCount }, (_, i) => ({
      nsr: 1000 + i,
      employeeRegistration: `E${i}`,
      employeeName: `FUNC ${i}`,
      department: 'TI',
      date: new Date('2026-04-15T00:00:00.000Z'),
      time: '08:02:15',
      type: 'IN' as const,
      status: 'NORMAL',
      approvalNote: null,
      deviceKind: 'MOBILE',
      geoLat: null,
      geoLng: null,
      geofenceDistance: null,
      originNsr: null,
      adjustmentNsr: null,
    })),
    tenant: { id: 'tenant-1', name: 'Empresa Demo', cnpj: '12345678000190' },
    period: {
      startDate: new Date('2026-04-01T00:00:00Z'),
      endDate: new Date('2026-04-30T23:59:59Z'),
    },
  };
}

function makeS3Mock() {
  return {
    uploadWithKey: vi.fn().mockResolvedValue({
      key: 'ignored',
      bucket: 'opensea',
      etag: '"etag"',
      size: 0,
    }),
    getPresignedUrl: vi
      .fn()
      .mockResolvedValue(
        'https://s3.example/opensea/tenant-1/hr/exports/2026/04/job.csv?sig=abc',
      ),
  };
}

describe('ExportPunchCsvUseCase', () => {
  it('sobe o CSV no R2 com mime text/csv + cache-control no-store', async () => {
    const s3 = makeS3Mock();
    const useCase = new ExportPunchCsvUseCase(s3 as never);
    await useCase.execute({
      tenantId: 'tenant-1',
      generatedBy: 'user-1',
      jobId: '00000000-0000-0000-0000-000000000001',
      dataset: makeDataset(3),
    });

    expect(s3.uploadWithKey).toHaveBeenCalledTimes(1);
    const [buffer, key, opts] = s3.uploadWithKey.mock.calls[0];
    expect(buffer).toBeInstanceOf(Buffer);
    expect(key).toMatch(
      /^tenant-1\/hr\/exports\/\d{4}\/\d{2}\/00000000-0000-0000-0000-000000000001\.csv$/,
    );
    expect(opts.mimeType).toBe('text/csv; charset=utf-8');
    expect(opts.cacheControl).toContain('no-store');
  });

  it('computa contentHash SHA-256 hex sobre o buffer serializado', async () => {
    const s3 = makeS3Mock();
    const useCase = new ExportPunchCsvUseCase(s3 as never);
    const result = await useCase.execute({
      tenantId: 'tenant-1',
      generatedBy: 'user-1',
      dataset: makeDataset(1),
    });
    expect(result.contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(result.sizeBytes).toBeGreaterThan(0);
  });

  it('gera presigned URL 15 min (900 s) com content-disposition attachment', async () => {
    const s3 = makeS3Mock();
    const useCase = new ExportPunchCsvUseCase(s3 as never);
    await useCase.execute({
      tenantId: 'tenant-1',
      generatedBy: 'user-1',
      dataset: makeDataset(0),
    });

    expect(s3.getPresignedUrl).toHaveBeenCalledTimes(1);
    const [key, ttl, disposition] = s3.getPresignedUrl.mock.calls[0];
    expect(typeof key).toBe('string');
    expect(ttl).toBe(15 * 60);
    expect(disposition).toContain('attachment');
    expect(disposition).toContain('.csv');
  });

  it('usa jobId passado ou gera UUID se ausente', async () => {
    const s3 = makeS3Mock();
    const useCase = new ExportPunchCsvUseCase(s3 as never);
    const result = await useCase.execute({
      tenantId: 'tenant-1',
      generatedBy: 'user-1',
      dataset: makeDataset(0),
    });
    expect(result.jobId).toMatch(/^[0-9a-f-]{36}$/i);

    const r2 = await useCase.execute({
      tenantId: 'tenant-1',
      generatedBy: 'user-1',
      jobId: '11111111-1111-1111-1111-111111111111',
      dataset: makeDataset(0),
    });
    expect(r2.jobId).toBe('11111111-1111-1111-1111-111111111111');
  });
});
