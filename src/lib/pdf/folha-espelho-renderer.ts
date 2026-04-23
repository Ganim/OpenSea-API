/**
 * folha-espelho-renderer.ts — Phase 06 / Plan 06-04
 *
 * Renderiza a folha espelho de ponto mensal conforme CLT Art. 74 §2º (layout
 * padrão do mercado RH brasileiro — referência Sólides/Convenia/Tangerino).
 *
 * **Layout (A4 retrato, pdfkit):**
 *  - Cabeçalho da empresa: razão social + CNPJ + endereço + logo opcional
 *  - Título: "FOLHA ESPELHO DE PONTO — Competência MM/YYYY"
 *  - Dados do funcionário (2 colunas): nome, matrícula, CPF, admissão, cargo,
 *    departamento, jornada semanal
 *  - Tabela diária (14 colunas): Dia | Sem | Jorn.Prev | Ent.1 | Sai.1 | Ent.2 |
 *    Sai.2 | Trab. | HE50 | HE100 | DSR | Falta | Abono | Obs
 *  - Totais do mês (horas trabalhadas, HE 50/100, DSR, faltas, banco de horas)
 *  - Observações (warnings do dataQuality)
 *  - Área de assinatura (2 linhas em branco: funcionário + gestor/RH)
 *  - Rodapé legal: "Folha gerada pelo sistema OpenSea em DD/MM/YYYY — CLT Art. 74 §2º"
 *
 * **Decisões de layout:**
 *  - FontSize 7 para a tabela, 8 para textos, 11 para títulos → cabe 31 dias +
 *    headers em 1 página A4 (testado).
 *  - Bordas desenhadas com `doc.moveTo/lineTo` (pdfkit não tem `table()` nativo).
 *  - Assinaturas ficam em branco — funcionário assina fisicamente.
 *  - PDF é privado (vai para RH/funcionário), exibe CNPJ sem máscara de
 *    asteriscos.
 *
 * **Determinismo:** timestamp de geração (`generatedAt`) é o ÚNICO campo que
 * varia entre runs; o spec aceita isso e valida apenas shape + tamanho mínimo.
 */

import PDFDocument from 'pdfkit';

import type { MonthlyConsolidation } from '@/use-cases/hr/compliance/time-bank-consolidation-adapter';

export interface FolhaEspelhoPdfData {
  tenant: {
    razaoSocial: string;
    /** 14 dígitos sem máscara (documento privado, exibe CNPJ completo). */
    cnpj: string;
    endereco?: string;
    inscricaoMunicipal?: string;
    logoBuffer?: Buffer;
  };
  employee: {
    fullName: string;
    registrationNumber: string;
    /** 11 dígitos. Máscara aplicada pelo renderer. */
    cpf: string;
    position: string;
    department: string;
    hireDate: Date;
    weeklyHoursContracted: number;
  };
  /** Competência formatada para exibição (ex: '03/2026'). */
  competencia: string;
  consolidation: MonthlyConsolidation;
  generatedAt: Date;
}

// ──────────────────────────────── Formatadores ────────────────────────────────

function formatCnpj(cnpj: string): string {
  const c = cnpj.replace(/\D/g, '').padStart(14, '0');
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12, 14)}`;
}

function formatCpf(cpf: string): string {
  const c = cpf.replace(/\D/g, '').padStart(11, '0');
  return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9, 11)}`;
}

function formatDateBR(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;
}

function formatMinutes(minutes: number): string {
  const sign = minutes < 0 ? '-' : '';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${h}:${String(m).padStart(2, '0')}`;
}

function formatDayNumber(ymd: string): string {
  return ymd.slice(8, 10);
}

// ──────────────────────────────── Renderer ────────────────────────────────────

export async function renderFolhaEspelhoPdf(
  data: FolhaEspelhoPdfData,
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 36,
    info: {
      Title: `Folha Espelho ${data.competencia} — ${data.employee.registrationNumber}`,
      Author: 'OpenSea ERP',
      Subject: 'Folha Espelho de Ponto — CLT Art. 74 §2º',
    },
  });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  // ── Cabeçalho empresa ──────────────────────────────────────────────────────
  if (data.tenant.logoBuffer) {
    try {
      doc.image(data.tenant.logoBuffer, 36, doc.y, { width: 50 });
      doc.moveUp(0);
    } catch {
      // logo inválido — ignora
    }
  }
  doc.font('Helvetica-Bold').fontSize(11).text(data.tenant.razaoSocial);
  doc
    .font('Helvetica')
    .fontSize(9)
    .text(`CNPJ: ${formatCnpj(data.tenant.cnpj)}`);
  if (data.tenant.endereco) {
    doc.text(data.tenant.endereco);
  }

  // ── Divider ────────────────────────────────────────────────────────────────
  doc.moveDown(0.5);
  doc
    .strokeColor('#888')
    .lineWidth(0.5)
    .moveTo(36, doc.y)
    .lineTo(559, doc.y)
    .stroke();
  doc.strokeColor('black').lineWidth(1);

  // ── Título ─────────────────────────────────────────────────────────────────
  doc.moveDown(0.4);
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .text(`FOLHA ESPELHO DE PONTO — Competência ${data.competencia}`, {
      align: 'center',
    });

  // ── Dados do funcionário (2 colunas) ───────────────────────────────────────
  doc.moveDown(0.6);
  doc.font('Helvetica').fontSize(8);
  const leftCol = 36;
  const rightCol = 300;
  let rowY = doc.y;
  const rowHeight = 12;

  const twoCol = (
    leftLabel: string,
    leftVal: string,
    rightLabel: string,
    rightVal: string,
  ) => {
    doc.text(`${leftLabel} ${leftVal}`, leftCol, rowY, { width: 260 });
    doc.text(`${rightLabel} ${rightVal}`, rightCol, rowY, { width: 260 });
    rowY += rowHeight;
  };

  twoCol(
    'Nome:',
    data.employee.fullName,
    'Matrícula:',
    data.employee.registrationNumber,
  );
  twoCol(
    'CPF:',
    formatCpf(data.employee.cpf),
    'Admissão:',
    formatDateBR(data.employee.hireDate),
  );
  twoCol(
    'Cargo:',
    data.employee.position,
    'Departamento:',
    data.employee.department,
  );
  doc.text(
    `Jornada contratual: ${data.employee.weeklyHoursContracted}h semanais`,
    leftCol,
    rowY,
  );
  rowY += rowHeight;
  doc.y = rowY;

  // ── Tabela diária ──────────────────────────────────────────────────────────
  doc.moveDown(0.3);
  const tableTop = doc.y;
  const tableLeft = 36;
  const tableRight = 559;
  const colWidths = [
    22, // Dia
    22, // Sem
    50, // Jorn.Prev
    30, // Ent1
    30, // Sai1
    30, // Ent2
    30, // Sai2
    40, // Trab
    30, // HE50
    30, // HE100
    25, // DSR
    30, // Falta
    30, // Abono
    105, // Obs
  ];
  const colHeaders = [
    'Dia',
    'Sem',
    'Jornada',
    'Ent.1',
    'Sai.1',
    'Ent.2',
    'Sai.2',
    'Trab.',
    'HE 50%',
    'HE 100%',
    'DSR',
    'Falta',
    'Abono',
    'Observações',
  ];

  const drawRow = (
    cells: string[],
    y: number,
    height: number,
    bold = false,
  ) => {
    let x = tableLeft;
    if (bold) {
      doc.font('Helvetica-Bold').fontSize(7);
    } else {
      doc.font('Helvetica').fontSize(7);
    }
    for (let i = 0; i < cells.length; i++) {
      doc.rect(x, y, colWidths[i], height).stroke();
      doc.text(cells[i], x + 1, y + 2, {
        width: colWidths[i] - 2,
        height: height - 2,
        align: i >= 3 && i <= 12 ? 'center' : 'left',
        lineBreak: false,
      });
      x += colWidths[i];
    }
  };

  // Header da tabela
  const rowH = 14;
  drawRow(colHeaders, tableTop, rowH, true);

  // Linhas da tabela (1 por dia do mês)
  let y = tableTop + rowH;
  for (const entry of data.consolidation.dailyEntries) {
    if (y + rowH > 780) {
      // Nova página se extrapolar A4 (conservador)
      doc.addPage();
      y = 36;
      drawRow(colHeaders, y, rowH, true);
      y += rowH;
    }
    const ent1 = entry.entries[0] ?? '';
    const sai1 = entry.entries[1] ?? '';
    const ent2 = entry.entries[2] ?? '';
    const sai2 = entry.entries[3] ?? '';
    const jornada =
      entry.scheduledStart && entry.scheduledEnd
        ? `${entry.scheduledStart}-${entry.scheduledEnd}`
        : '-';
    const trabalhado =
      entry.workedMinutes > 0 ? formatMinutes(entry.workedMinutes) : '';
    const he50 =
      entry.overtime50Minutes > 0 ? formatMinutes(entry.overtime50Minutes) : '';
    const he100 =
      entry.overtime100Minutes > 0
        ? formatMinutes(entry.overtime100Minutes)
        : '';
    const dsr = entry.dsr ? 'Sim' : '';
    const falta = entry.absenceType === 'UNJUSTIFIED' ? 'Sim' : '';
    const abono =
      entry.absenceType === 'JUSTIFIED' || entry.absenceType === 'VACATION'
        ? 'Sim'
        : '';

    drawRow(
      [
        formatDayNumber(entry.date),
        entry.dayOfWeek,
        jornada,
        ent1,
        sai1,
        ent2,
        sai2,
        trabalhado,
        he50,
        he100,
        dsr,
        falta,
        abono,
        entry.note,
      ],
      y,
      rowH,
    );
    y += rowH;
  }

  doc.y = y + 6;

  // ── Totais do mês ──────────────────────────────────────────────────────────
  doc.moveDown(0.3);
  doc.font('Helvetica-Bold').fontSize(9).text('TOTAIS DO MÊS:');
  doc.font('Helvetica').fontSize(8);
  const c = data.consolidation;
  doc.text(`Horas trabalhadas: ${formatMinutes(c.workedMinutes)}`);
  doc.text(`Horas previstas: ${formatMinutes(c.scheduledMinutes)}`);
  doc.text(`HE 50%: ${formatMinutes(c.overtime.at50Minutes)}`);
  doc.text(`HE 100%: ${formatMinutes(c.overtime.at100Minutes)}`);
  const dsrDias = c.dsrMinutes > 0 ? Math.round(c.dsrMinutes / 480) : 0;
  doc.text(`DSR: ${dsrDias > 0 ? `${dsrDias} dia(s)` : '—'}`);
  doc.text(`Faltas injustificadas: ${c.unjustifiedAbsenceDays}`);
  doc.text(`Abonos justificados: ${c.justifiedAbsenceDays}`);
  doc.text(`Férias: ${c.vacationDays}`);
  const sign = c.timeBankBalanceMinutes >= 0 ? '+' : '';
  doc.text(
    `Saldo banco de horas: ${sign}${formatMinutes(c.timeBankBalanceMinutes)}`,
  );

  // ── Observações (warnings do dataQuality) ──────────────────────────────────
  if (c.dataQuality.warnings.length > 0) {
    doc.moveDown(0.4);
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor('#666')
      .text('Observações:');
    doc.font('Helvetica').fontSize(7);
    for (const w of c.dataQuality.warnings) {
      doc.text(`• ${w}`);
    }
    doc.fillColor('black');
  }

  // ── Assinaturas ────────────────────────────────────────────────────────────
  doc.moveDown(1.5);
  const sigY = doc.y;
  const sigLineY = sigY + 30;
  doc
    .strokeColor('black')
    .lineWidth(0.5)
    .moveTo(70, sigLineY)
    .lineTo(260, sigLineY)
    .stroke();
  doc.moveTo(340, sigLineY).lineTo(530, sigLineY).stroke();

  doc.font('Helvetica').fontSize(8);
  doc.text('Assinatura do funcionário', 70, sigLineY + 3, {
    width: 190,
    align: 'center',
  });
  doc.text('Responsável RH/Gestor', 340, sigLineY + 3, {
    width: 190,
    align: 'center',
  });

  // ── Rodapé legal ───────────────────────────────────────────────────────────
  doc.moveDown(3);
  doc
    .font('Helvetica')
    .fontSize(7)
    .fillColor('#666')
    .text(
      `Folha gerada pelo sistema OpenSea em ${formatDateBR(data.generatedAt)} — CLT Art. 74 §2º`,
      { align: 'center' },
    );
  doc.fillColor('black');

  doc.end();

  return new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}
