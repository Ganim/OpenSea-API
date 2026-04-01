import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the docx library — avoid actual file generation in unit tests
vi.mock('docx', () => {
  const Packer = {
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-docx-buffer')),
  };

  const makeClass = (name: string) =>
    class {
      constructor(public props: unknown) {}
      toString() {
        return name;
      }
    };

  return {
    Document: makeClass('Document'),
    Packer,
    Paragraph: makeClass('Paragraph'),
    Table: makeClass('Table'),
    TableRow: makeClass('TableRow'),
    TableCell: makeClass('TableCell'),
    TextRun: makeClass('TextRun'),
    WidthType: { DXA: 'DXA', PERCENTAGE: 'PERCENTAGE' },
    AlignmentType: { CENTER: 'CENTER', LEFT: 'LEFT', RIGHT: 'RIGHT' },
    BorderStyle: { SINGLE: 'SINGLE' },
    HeadingLevel: { HEADING_1: 'HEADING_1' },
  };
});

import { exportToDOCX } from './export-docx';

describe('exportToDOCX', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a Buffer for a valid ENTRIES report', async () => {
    const result = await exportToDOCX({
      reportType: 'ENTRIES',
      title: 'Relatório de Lançamentos',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-31'),
      headers: ['Descrição', 'Valor', 'Vencimento'],
      rows: [
        ['Aluguel', '1.500,00', '10/01/2025'],
        ['Energia', '200,00', '15/01/2025'],
      ],
    });

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should return a Buffer for a BALANCE report with empty rows', async () => {
    const result = await exportToDOCX({
      reportType: 'BALANCE',
      title: 'Balanço',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      headers: ['Conta', 'Saldo'],
      rows: [],
    });

    expect(result).toBeInstanceOf(Buffer);
  });

  it('should call Packer.toBuffer once per invocation', async () => {
    const { Packer } = await import('docx');

    await exportToDOCX({
      reportType: 'DRE',
      title: 'DRE',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      headers: ['Item', 'Valor'],
      rows: [['Receita Bruta', '100.000,00']],
    });

    expect(Packer.toBuffer).toHaveBeenCalledTimes(1);
  });

  it('should handle all report types without throwing', async () => {
    const reportTypes = ['ENTRIES', 'BALANCE', 'DRE', 'CASHFLOW'] as const;

    for (const reportType of reportTypes) {
      await expect(
        exportToDOCX({
          reportType,
          title: `Relatório ${reportType}`,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-03-31'),
          headers: ['Col1', 'Col2'],
          rows: [['val1', 'val2']],
        }),
      ).resolves.toBeInstanceOf(Buffer);
    }
  });
});
