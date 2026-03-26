import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { prisma } from '@/lib/prisma';

/**
 * Geração de AFD — Arquivo Fonte de Dados (Portaria 671 Anexo III)
 *
 * Layout de registros (texto fixo):
 *
 * Tipo 1 (Header):
 *   Pos 1     : "1" (tipo do registro)
 *   Pos 2     : "1" (REP-P)
 *   Pos 3-16  : CNPJ (14 dígitos, zeros à esquerda)
 *   Pos 17-30 : CEI/CAEPF (14 dígitos, zeros se vazio)
 *   Pos 31-42 : Razão Social (12 chars, espaços à direita)
 *   Pos 43-48 : NSR inicial (6 dígitos)
 *   Pos 49-54 : NSR final (6 dígitos)
 *   Pos 55-62 : Data geração (ddmmaaaa)
 *   Pos 63-68 : Hora geração (hhmmss)
 *
 * Tipo 3 (Detalhe — cada batida):
 *   Pos 1     : "3" (tipo do registro)
 *   Pos 2-11  : NSR (10 dígitos, zeros à esquerda)
 *   Pos 12-19 : Data (ddmmaaaa)
 *   Pos 20-23 : Hora (hhmm)
 *   Pos 24-34 : PIS do empregado (11 dígitos)
 *
 * Tipo 9 (Trailer):
 *   Pos 1     : "9" (tipo do registro)
 *   Pos 2-11  : Quantidade total de registros tipo 3 (10 dígitos)
 */

export interface GenerateAFDRequest {
  tenantId: string;
  startDate: Date;
  endDate: Date;
}

export interface GenerateAFDResponse {
  content: string;
  filename: string;
}

export class GenerateAFDUseCase {
  async execute(request: GenerateAFDRequest): Promise<GenerateAFDResponse> {
    const { tenantId, startDate, endDate } = request;

    if (startDate >= endDate) {
      throw new BadRequestError(
        'A data de início deve ser anterior à data de fim',
      );
    }

    // Busca a empresa do tenant para CNPJ / Razão Social
    const company = await prisma.company.findFirst({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    const cnpj = company?.cnpj
      ? company.cnpj.replace(/\D/g, '').padStart(14, '0')
      : '0'.repeat(14);
    const razaoSocial = (company?.legalName ?? 'EMPRESA')
      .substring(0, 12)
      .padEnd(12, ' ');

    // Busca todos os registros de ponto no período, ordenados por NSR
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        tenantId,
        timestamp: { gte: startDate, lte: endDate },
      },
      include: {
        employee: { select: { pis: true, cpf: true } },
      },
      orderBy: [{ nsrNumber: 'asc' }, { timestamp: 'asc' }],
    });

    if (timeEntries.length === 0) {
      throw new BadRequestError(
        'Nenhum registro de ponto encontrado no período informado',
      );
    }

    // Calcula NSR min/max
    const nsrNumbers = timeEntries
      .map((e) => e.nsrNumber ?? 0)
      .filter((n) => n > 0);
    const nsrMin = nsrNumbers.length > 0 ? Math.min(...nsrNumbers) : 0;
    const nsrMax = nsrNumbers.length > 0 ? Math.max(...nsrNumbers) : 0;

    const now = new Date();
    const lines: string[] = [];

    // Header (Tipo 1)
    const header =
      '1' + // Pos 1: tipo
      '1' + // Pos 2: REP-P
      cnpj + // Pos 3-16: CNPJ
      '0'.repeat(14) + // Pos 17-30: CEI/CAEPF
      razaoSocial + // Pos 31-42: Razão Social
      String(nsrMin).padStart(6, '0') + // Pos 43-48: NSR inicial
      String(nsrMax).padStart(6, '0') + // Pos 49-54: NSR final
      formatDate(now) + // Pos 55-62: Data geração
      formatTime(now); // Pos 63-68: Hora geração

    lines.push(header);

    // Detail records (Tipo 3)
    for (const entry of timeEntries) {
      const nsr = String(entry.nsrNumber ?? 0).padStart(10, '0');
      const date = formatDate(entry.timestamp);
      const time = formatHourMinute(entry.timestamp);
      const pis = (entry.employee.pis ?? '')
        .replace(/\D/g, '')
        .padStart(11, '0');

      const detail =
        '3' + // Pos 1: tipo
        nsr + // Pos 2-11: NSR
        date + // Pos 12-19: Data
        time + // Pos 20-23: Hora
        pis; // Pos 24-34: PIS

      lines.push(detail);
    }

    // Trailer (Tipo 9)
    const trailer =
      '9' + // Pos 1: tipo
      String(timeEntries.length).padStart(10, '0'); // Pos 2-11: total registros

    lines.push(trailer);

    const content = lines.join('\r\n');

    const startStr = formatDateISO(startDate);
    const endStr = formatDateISO(endDate);
    const filename = `AFD_${cnpj}_${startStr}_${endStr}.txt`;

    return { content, filename };
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** ddmmaaaa */
function formatDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  return `${dd}${mm}${yyyy}`;
}

/** hhmmss */
function formatTime(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}${mm}${ss}`;
}

/** hhmm */
function formatHourMinute(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}${mm}`;
}

/** yyyymmdd */
function formatDateISO(d: Date): string {
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}
