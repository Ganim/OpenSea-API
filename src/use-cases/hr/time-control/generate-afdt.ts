import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { prisma } from '@/lib/prisma';

/**
 * Geração de AFDT — Arquivo Fonte de Dados Tratados (Portaria 671 Anexo III)
 *
 * Similar ao AFD, mas inclui dados tratados/ajustados:
 * - Timestamp original + timestamp ajustado (se corrigido manualmente)
 * - Justificativa para ajustes
 * - Quem aprovou o ajuste
 *
 * Layout de registros (texto fixo):
 *
 * Tipo 1 (Header):
 *   Pos 1     : "1" (tipo do registro)
 *   Pos 2     : "2" (identificador AFDT)
 *   Pos 3-16  : CNPJ (14 dígitos)
 *   Pos 17-30 : CEI/CAEPF (14 dígitos, zeros se vazio)
 *   Pos 31-42 : Razão Social (12 chars)
 *   Pos 43-50 : Data início período (ddmmaaaa)
 *   Pos 51-58 : Data fim período (ddmmaaaa)
 *   Pos 59-66 : Data geração (ddmmaaaa)
 *   Pos 67-72 : Hora geração (hhmmss)
 *
 * Tipo 4 (Detalhe tratado):
 *   Pos 1     : "4" (tipo do registro)
 *   Pos 2-11  : NSR (10 dígitos)
 *   Pos 12-19 : Data original (ddmmaaaa)
 *   Pos 20-23 : Hora original (hhmm)
 *   Pos 24-27 : Hora tratada (hhmm) — igual à original se sem ajuste
 *   Pos 28-28 : Flag de ajuste ("S" ou "N")
 *   Pos 29-39 : PIS do empregado (11 dígitos)
 *   Pos 40-53 : CPF do empregado (14 chars, espaço se vazio)
 *   Pos 54-93 : Justificativa (40 chars, espaço se vazio)
 *
 * Tipo 9 (Trailer):
 *   Pos 1     : "9" (tipo do registro)
 *   Pos 2-11  : Quantidade total de registros tipo 4 (10 dígitos)
 */

export interface GenerateAFDTRequest {
  tenantId: string;
  startDate: Date;
  endDate: Date;
}

export interface GenerateAFDTResponse {
  content: string;
  filename: string;
}

export class GenerateAFDTUseCase {
  async execute(request: GenerateAFDTRequest): Promise<GenerateAFDTResponse> {
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

    const now = new Date();
    const lines: string[] = [];

    // Header (Tipo 1)
    const header =
      '1' + // Pos 1: tipo
      '2' + // Pos 2: AFDT identifier
      cnpj + // Pos 3-16: CNPJ
      '0'.repeat(14) + // Pos 17-30: CEI/CAEPF
      razaoSocial + // Pos 31-42: Razão Social
      formatDate(startDate) + // Pos 43-50: Data início período
      formatDate(endDate) + // Pos 51-58: Data fim período
      formatDate(now) + // Pos 59-66: Data geração
      formatTime(now); // Pos 67-72: Hora geração

    lines.push(header);

    // Detail records (Tipo 4)
    for (const entry of timeEntries) {
      const nsr = String(entry.nsrNumber ?? 0).padStart(10, '0');
      const dateStr = formatDate(entry.timestamp);
      const originalTime = formatHourMinute(entry.timestamp);

      // Se houver notas indicando ajuste, considera como ajustado.
      // No modelo atual, não há campo separado de "hora ajustada",
      // então usamos a mesma hora. Futuras versões podem ter adjusted_timestamp.
      const hasAdjustment = entry.notes?.startsWith('[AJUSTE]') ?? false;
      const treatedTime = originalTime; // Mesmo valor por enquanto
      const adjustFlag = hasAdjustment ? 'S' : 'N';

      const pis = (entry.employee.pis ?? '')
        .replace(/\D/g, '')
        .padStart(11, '0');
      const cpf = (entry.employee.cpf ?? '')
        .replace(/\D/g, '')
        .padEnd(14, ' ')
        .substring(0, 14);
      const justification = (
        hasAdjustment ? (entry.notes?.replace('[AJUSTE]', '').trim() ?? '') : ''
      )
        .padEnd(40, ' ')
        .substring(0, 40);

      const detail =
        '4' + // Pos 1: tipo
        nsr + // Pos 2-11: NSR
        dateStr + // Pos 12-19: Data original
        originalTime + // Pos 20-23: Hora original
        treatedTime + // Pos 24-27: Hora tratada
        adjustFlag + // Pos 28: Flag de ajuste
        pis + // Pos 29-39: PIS
        cpf + // Pos 40-53: CPF
        justification; // Pos 54-93: Justificativa

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
    const filename = `AFDT_${cnpj}_${startStr}_${endStr}.txt`;

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
