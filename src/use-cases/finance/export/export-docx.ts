import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
} from 'docx';

interface ExportDOCXRequest {
  reportType: 'ENTRIES' | 'BALANCE' | 'DRE' | 'CASHFLOW';
  startDate: Date;
  endDate: Date;
  headers: string[];
  rows: string[][];
  title: string;
}

function formatDateBR(date: Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

const defaultBorder = {
  top: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
} as const;

export async function exportToDOCX(
  request: ExportDOCXRequest,
): Promise<Buffer> {
  const { title, startDate, endDate, headers, rows } = request;

  const colWidth = Math.floor(9000 / headers.length);

  // Header row
  const headerTableRow = new TableRow({
    tableHeader: true,
    children: headers.map(
      (h) =>
        new TableCell({
          borders: defaultBorder,
          width: { size: colWidth, type: WidthType.DXA },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: h, bold: true, size: 18, font: 'Arial' }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
          shading: { fill: '4472C4' },
        }),
    ),
  });

  // Data rows
  const dataRows = rows.map(
    (row) =>
      new TableRow({
        children: row.map(
          (cell, i) =>
            new TableCell({
              borders: defaultBorder,
              width: { size: colWidth, type: WidthType.DXA },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: cell ?? '', size: 16, font: 'Arial' }),
                  ],
                  alignment: i === 0 ? AlignmentType.LEFT : AlignmentType.RIGHT,
                }),
              ],
            }),
        ),
      }),
  );

  const table = new Table({
    rows: [headerTableRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Periodo: ${formatDateBR(startDate)} a ${formatDateBR(endDate)}`,
                italics: true,
                size: 20,
                font: 'Arial',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),
          table,
          new Paragraph({
            children: [
              new TextRun({
                text: `Gerado em ${formatDateBR(new Date())}`,
                size: 14,
                font: 'Arial',
                color: '999999',
              }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { before: 300 },
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
