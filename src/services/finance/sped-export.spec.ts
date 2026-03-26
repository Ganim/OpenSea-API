import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryFinanceCategoriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-categories-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { SpedExportService } from './sped-export.service';

let entriesRepo: InMemoryFinanceEntriesRepository;
let categoriesRepo: InMemoryFinanceCategoriesRepository;
let sut: SpedExportService;

describe('SpedExportService', () => {
  beforeEach(() => {
    entriesRepo = new InMemoryFinanceEntriesRepository();
    categoriesRepo = new InMemoryFinanceCategoriesRepository();
    sut = new SpedExportService(entriesRepo, categoriesRepo);
  });

  it('should generate a valid SPED ECD file structure', async () => {
    const result = await sut.export({
      tenantId: 'tenant-1',
      year: 2026,
      startMonth: 1,
      endMonth: 12,
      format: 'ECD',
    });

    expect(result.fileName).toContain('SPED_ECD_2026');
    expect(result.mimeType).toBe('text/plain; charset=utf-8');

    const content = result.data.toString('utf-8');
    const lines = content.split('\r\n').filter(Boolean);

    // Must start with |0000| and end with |9999|
    expect(lines[0]).toMatch(/^\|0000\|/);
    expect(lines[lines.length - 1]).toMatch(/^\|9999\|/);

    // Must contain opening blocks
    expect(content).toContain('|0001|');
    expect(content).toContain('|I001|');
    expect(content).toContain('|I010|');
    expect(content).toContain('|9001|');
    expect(content).toContain('|9900|');
  });

  it('should throw error for unsupported format', async () => {
    await expect(
      sut.export({
        tenantId: 'tenant-1',
        year: 2026,
        startMonth: 1,
        endMonth: 12,
        format: 'ECF',
      }),
    ).rejects.toThrow('ainda não implementado');
  });
});
