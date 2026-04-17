import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { prisma } from '@/lib/prisma';
import {
  formatDateDDMMYYYYInBRT,
  formatDateYYYYMMDDInBRT,
  formatTimeHHMMInBRT,
  formatTimeHHMMSSInBRT,
} from '@/utils/hr/brt-timezone';

/**
 * Geração de AFDT — Arquivo Fonte de Dados Tratados (Portaria 671/2021, Anexo III).
 *
 * O AFDT carrega as marcações já tratadas (pré-aprovadas) pelo empregador,
 * incluindo timestamp original, timestamp ajustado, justificativa e flag de
 * ajuste. O layout complementa o AFD: mesmo separador (LF), mesmas regras de
 * BRT e normalização ASCII para a Razão Social, e campos NSR de 9 dígitos
 * alinhados com a versão vigente da Portaria.
 *
 * Tipo 1 — Cabeçalho (230 bytes):
 *   Pos 1         (1): "1"
 *   Pos 2         (1): "2"   (identificador AFDT)
 *   Pos 3-16     (14): CNPJ
 *   Pos 17-30    (14): CEI/CAEPF
 *   Pos 31-180  (150): Razão Social
 *   Pos 181-188   (8): Data inicial do período (ddmmaaaa, BRT)
 *   Pos 189-196   (8): Data final do período (ddmmaaaa, BRT)
 *   Pos 197-204   (8): Data de geração (ddmmaaaa, BRT)
 *   Pos 205-210   (6): Hora de geração (hhmmss, BRT)
 *
 * Tipo 4 — Marcação tratada (114 bytes):
 *   Pos 1         (1): "4"
 *   Pos 2-10      (9): NSR
 *   Pos 11-18     (8): Data original (ddmmaaaa, BRT)
 *   Pos 19-22     (4): Hora original (hhmm, BRT)
 *   Pos 23-26     (4): Hora tratada (hhmm, BRT)
 *   Pos 27        (1): Flag de ajuste ("S" ou "N")
 *   Pos 28-38    (11): PIS do empregado
 *   Pos 39-52    (14): CPF do empregado (espaços à direita se ausente)
 *   Pos 53-92    (40): Justificativa do ajuste (espaços à direita)
 *
 * Tipo 9 — Trailer (10 bytes):
 *   Pos 1         (1): "9"
 *   Pos 2-10      (9): Quantidade total de registros Tipo 4
 *
 * Observações:
 *  - Separador de linha: LF (\n).
 *  - Datas/horas em BRT (UTC-3), não no timezone do servidor.
 *  - Razão Social normalizada para ASCII sem diacríticos (ISO-8859-1).
 */

const RECORD_SEPARATOR = '\n';
const RAZAO_SOCIAL_LENGTH = 150;
const NSR_LENGTH = 9;
const COUNTER_LENGTH = 9;
const CPF_FIELD_LENGTH = 14;
const JUSTIFICATION_FIELD_LENGTH = 40;
const ADJUSTMENT_NOTE_PREFIX = '[AJUSTE]';

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

    const company = await prisma.company.findFirst({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    const cnpj = company?.cnpj
      ? company.cnpj.replace(/\D/g, '').padStart(14, '0')
      : '0'.repeat(14);
    const razaoSocial = padRazaoSocial(company?.legalName ?? 'EMPRESA');

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

    const generatedAt = new Date();

    const headerRecord = buildHeaderRecord({
      cnpj,
      razaoSocial,
      periodStart: startDate,
      periodEnd: endDate,
      generatedAt,
    });

    const treatedRecords = timeEntries.map((entry) =>
      buildTreatedPunchRecord({
        nsrNumber: entry.nsrNumber ?? 0,
        timestamp: entry.timestamp,
        employeePis: entry.employee.pis ?? '',
        employeeCpf: entry.employee.cpf ?? '',
        notes: entry.notes ?? null,
      }),
    );

    const trailerRecord =
      '9' + String(treatedRecords.length).padStart(COUNTER_LENGTH, '0');

    const content = [headerRecord, ...treatedRecords, trailerRecord].join(
      RECORD_SEPARATOR,
    );

    const startIso = formatDateYYYYMMDDInBRT(startDate);
    const endIso = formatDateYYYYMMDDInBRT(endDate);
    const filename = `AFDT_${cnpj}_${startIso}_${endIso}.txt`;

    return { content, filename };
  }
}

// ─── Record builders ──────────────────────────────────────────────────────────

function buildHeaderRecord(params: {
  cnpj: string;
  razaoSocial: string;
  periodStart: Date;
  periodEnd: Date;
  generatedAt: Date;
}): string {
  const { cnpj, razaoSocial, periodStart, periodEnd, generatedAt } = params;

  return (
    '1' + // Pos 1
    '2' + // Pos 2 (AFDT)
    cnpj + // Pos 3-16
    '0'.repeat(14) + // Pos 17-30 (CEI/CAEPF)
    razaoSocial + // Pos 31-180
    formatDateDDMMYYYYInBRT(periodStart) + // Pos 181-188
    formatDateDDMMYYYYInBRT(periodEnd) + // Pos 189-196
    formatDateDDMMYYYYInBRT(generatedAt) + // Pos 197-204
    formatTimeHHMMSSInBRT(generatedAt) // Pos 205-210
  );
}

function buildTreatedPunchRecord(params: {
  nsrNumber: number;
  timestamp: Date;
  employeePis: string;
  employeeCpf: string;
  notes: string | null;
}): string {
  const { nsrNumber, timestamp, employeePis, employeeCpf, notes } = params;

  const hasAdjustment = notes?.startsWith(ADJUSTMENT_NOTE_PREFIX) ?? false;
  const adjustFlag = hasAdjustment ? 'S' : 'N';

  const originalTime = formatTimeHHMMInBRT(timestamp);
  // Without a separate adjusted_timestamp column we mirror the original time.
  // TODO(hr): store adjusted_timestamp on TimeEntry and emit it here.
  const treatedTime = originalTime;

  const pis = employeePis.replace(/\D/g, '').padStart(11, '0').slice(-11);

  const cpfDigits = employeeCpf.replace(/\D/g, '');
  const cpfField = cpfDigits
    .padEnd(CPF_FIELD_LENGTH, ' ')
    .slice(0, CPF_FIELD_LENGTH);

  const justificationText = hasAdjustment
    ? (notes?.replace(ADJUSTMENT_NOTE_PREFIX, '').trim() ?? '')
    : '';
  const justificationField = sanitiseJustification(justificationText)
    .padEnd(JUSTIFICATION_FIELD_LENGTH, ' ')
    .slice(0, JUSTIFICATION_FIELD_LENGTH);

  return (
    '4' + // Pos 1
    String(nsrNumber).padStart(NSR_LENGTH, '0') + // Pos 2-10
    formatDateDDMMYYYYInBRT(timestamp) + // Pos 11-18
    originalTime + // Pos 19-22
    treatedTime + // Pos 23-26
    adjustFlag + // Pos 27
    pis + // Pos 28-38
    cpfField + // Pos 39-52
    justificationField // Pos 53-92
  );
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function padRazaoSocial(legalName: string): string {
  const ascii = legalName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '');
  return ascii.slice(0, RAZAO_SOCIAL_LENGTH).padEnd(RAZAO_SOCIAL_LENGTH, ' ');
}

function sanitiseJustification(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '');
}
