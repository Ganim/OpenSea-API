import ExcelJS from 'exceljs';

interface ExportXLSXRequest {
  reportType: 'ENTRIES' | 'BALANCE' | 'DRE' | 'CASHFLOW';
  startDate: Date;
  endDate: Date;
  headers: string[];
  rows: string[][];
  title: string;
  sheetName?: string;
}

function formatDateBR(date: Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export async function exportToXLSX(
  request: ExportXLSXRequest,
): Promise<Buffer> {
  const { title, startDate, endDate, headers, rows, sheetName } = request;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'OpenSea Finance';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetName ?? title.slice(0, 31));

  // Title row
  const titleRow = sheet.addRow([title]);
  titleRow.font = { bold: true, size: 14 };
  sheet.mergeCells(1, 1, 1, headers.length);

  // Period row
  const periodRow = sheet.addRow([
    `Periodo: ${formatDateBR(startDate)} a ${formatDateBR(endDate)}`,
  ]);
  periodRow.font = { size: 10, italic: true };
  sheet.mergeCells(2, 1, 2, headers.length);

  // Empty row
  sheet.addRow([]);

  // Header row
  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true, size: 10 };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    };
    cell.alignment = { vertical: 'middle' };
  });

  // Data rows
  for (const row of rows) {
    const dataRow = sheet.addRow(row);
    dataRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { vertical: 'middle' };
    });
  }

  // Auto-width columns
  sheet.columns.forEach((column) => {
    let maxLength = 10;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const cellLength = cell.value ? String(cell.value).length : 0;
      if (cellLength > maxLength) {
        maxLength = Math.min(cellLength, 40);
      }
    });
    column.width = maxLength + 2;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
