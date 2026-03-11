import PDFDocument from 'pdfkit';

interface ExportPDFRequest {
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

export async function exportToPDF(request: ExportPDFRequest): Promise<Buffer> {
  const { title, startDate, endDate, headers, rows } = request;

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
    });

    const chunks: Uint8Array[] = [];
    doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text(title, { align: 'center' });
    doc.moveDown(0.3);
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Periodo: ${formatDateBR(startDate)} a ${formatDateBR(endDate)}`, {
        align: 'center',
      });
    doc.moveDown(1);

    // Table
    const pageWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colCount = headers.length;
    const colWidth = pageWidth / colCount;
    const rowHeight = 20;
    const startX = doc.page.margins.left;
    let y = doc.y;

    // Draw header row
    doc.fontSize(8).font('Helvetica-Bold');
    for (let i = 0; i < headers.length; i++) {
      doc.text(headers[i], startX + i * colWidth, y, {
        width: colWidth - 4,
        align: i === 0 ? 'left' : 'right',
      });
    }
    y += rowHeight;
    doc
      .moveTo(startX, y - 4)
      .lineTo(startX + pageWidth, y - 4)
      .stroke();

    // Draw data rows
    doc.font('Helvetica').fontSize(7);
    for (const row of rows) {
      // Check for page break
      if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.page.margins.top;
      }

      for (let i = 0; i < row.length; i++) {
        doc.text(row[i] ?? '', startX + i * colWidth, y, {
          width: colWidth - 4,
          align: i === 0 ? 'left' : 'right',
        });
      }
      y += rowHeight;
    }

    // Footer
    doc
      .fontSize(7)
      .font('Helvetica')
      .text(
        `Gerado em ${formatDateBR(new Date())}`,
        doc.page.margins.left,
        doc.page.height - 30,
        { align: 'right' },
      );

    doc.end();
  });
}
