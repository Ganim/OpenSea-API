import { describe, expect, it, vi } from 'vitest';

// Mock pdfkit — simulate stream events without actually rendering PDF
vi.mock('pdfkit', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const EventEmitter = require('node:events');

  class MockPDFDocument extends EventEmitter {
    page = {
      width: 841,
      height: 595,
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
    };

    fontSize() {
      return this;
    }
    font() {
      return this;
    }
    text() {
      return this;
    }
    moveDown() {
      return this;
    }
    moveTo() {
      return this;
    }
    lineTo() {
      return this;
    }
    stroke() {
      return this;
    }
    addPage() {
      return this;
    }

    // y position getter (simulate minimal value so no extra pages)
    get y() {
      return 100;
    }

    end() {
      // Emit a chunk then end event
      this.emit('data', Buffer.from('mock-pdf-chunk'));
      this.emit('end');
    }
  }

  return { default: MockPDFDocument };
});

import { exportToPDF } from './export-pdf';

describe('exportToPDF', () => {
  it('should return a Buffer for a valid ENTRIES report', async () => {
    const result = await exportToPDF({
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

  it('should return a Buffer for a DRE report with empty rows', async () => {
    const result = await exportToPDF({
      reportType: 'DRE',
      title: 'Demonstrativo de Resultados',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      headers: ['Item', 'Valor'],
      rows: [],
    });

    expect(result).toBeInstanceOf(Buffer);
  });

  it('should handle all report types without throwing', async () => {
    const reportTypes = ['ENTRIES', 'BALANCE', 'DRE', 'CASHFLOW'] as const;

    for (const reportType of reportTypes) {
      await expect(
        exportToPDF({
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

  it('should reject when PDFDocument emits an error', async () => {
    const { default: MockPDFDocument } = await import('pdfkit');

    // Override end() to emit an error before end
    const originalEnd = MockPDFDocument.prototype.end;
    MockPDFDocument.prototype.end = function () {
      this.emit('error', new Error('PDF render error'));
    };

    await expect(
      exportToPDF({
        reportType: 'CASHFLOW',
        title: 'Fluxo de Caixa',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        headers: ['Data', 'Valor'],
        rows: [],
      }),
    ).rejects.toThrow('PDF render error');

    // Restore
    MockPDFDocument.prototype.end = originalEnd;
  });
});
