import { describe, expect, it, vi } from 'vitest';

// Mock ExcelJS to avoid actual file generation
vi.mock('exceljs', () => {
  const mockCell = {
    fill: null as unknown,
    font: null as unknown,
    border: null as unknown,
    alignment: null as unknown,
    value: '' as unknown,
  };

  const mockColumn = {
    width: 10,
    eachCell: vi.fn((options: unknown, cb: (cell: typeof mockCell) => void) => {
      cb(mockCell);
    }),
  };

  const mockRow = {
    font: null as unknown,
    eachCell: vi.fn((cb: (cell: typeof mockCell) => void) => {
      cb(mockCell);
    }),
  };

  const mockSheet = {
    addRow: vi.fn().mockReturnValue(mockRow),
    mergeCells: vi.fn(),
    columns: [mockColumn, mockColumn],
  };

  const mockWorkbook = {
    creator: '',
    created: null as unknown,
    addWorksheet: vi.fn().mockReturnValue(mockSheet),
    xlsx: {
      writeBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-xlsx-buffer')),
    },
  };

  return {
    default: {
      Workbook: vi.fn().mockImplementation(() => mockWorkbook),
    },
  };
});

import { exportToXLSX } from './export-xlsx';

describe('exportToXLSX', () => {
  it('should return a Buffer for a valid ENTRIES report', async () => {
    const result = await exportToXLSX({
      reportType: 'ENTRIES',
      title: 'Lançamentos Financeiros',
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
    const result = await exportToXLSX({
      reportType: 'BALANCE',
      title: 'Balanço Patrimonial',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      headers: ['Conta', 'Saldo Devedor', 'Saldo Credor'],
      rows: [],
    });

    expect(result).toBeInstanceOf(Buffer);
  });

  it('should use the provided sheetName when given', async () => {
    const ExcelJS = (await import('exceljs')).default;
    const mockInstance = new ExcelJS.Workbook();

    await exportToXLSX({
      reportType: 'DRE',
      title: 'Demonstrativo de Resultados',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      headers: ['Item', 'Valor'],
      rows: [['Receita Bruta', '50.000,00']],
      sheetName: 'DRE 2025',
    });

    expect(mockInstance.addWorksheet).toHaveBeenCalledWith('DRE 2025');
  });

  it('should truncate the sheet name from title when no sheetName provided', async () => {
    const ExcelJS = (await import('exceljs')).default;
    const mockInstance = new ExcelJS.Workbook();

    const longTitle = 'A'.repeat(40); // longer than 31 chars
    await exportToXLSX({
      reportType: 'CASHFLOW',
      title: longTitle,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-03-31'),
      headers: ['Data', 'Entrada', 'Saída'],
      rows: [],
    });

    expect(mockInstance.addWorksheet).toHaveBeenCalledWith(
      longTitle.slice(0, 31),
    );
  });

  it('should handle all report types without throwing', async () => {
    const reportTypes = ['ENTRIES', 'BALANCE', 'DRE', 'CASHFLOW'] as const;

    for (const reportType of reportTypes) {
      await expect(
        exportToXLSX({
          reportType,
          title: `Report ${reportType}`,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-03-31'),
          headers: ['Col1', 'Col2'],
          rows: [['val1', 'val2']],
        }),
      ).resolves.toBeInstanceOf(Buffer);
    }
  });
});
