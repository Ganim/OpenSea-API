import { createHash } from 'node:crypto';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { prisma } from '@/lib/prisma';
import {
  formatDateDDMMYYYYInBRT,
  formatDateYYYYMMDDInBRT,
  formatTimeHHMMInBRT,
} from '@/utils/hr/brt-timezone';

/**
 * Geração de AFD — Arquivo Fonte de Dados (Portaria 671/2021 MTP, Anexo III).
 *
 * Layout oficial do REP-P (texto fixo, separador de linha LF):
 *
 * Tipo 1 — Cabeçalho (226 bytes):
 *   Pos 1        (1):  "1"                               — tipo do registro
 *   Pos 2        (1):  "1"                               — identificador REP-P
 *   Pos 3-16    (14): CNPJ (zeros à esquerda)
 *   Pos 17-30   (14): CEI/CAEPF (zeros se não aplicável)
 *   Pos 31-180 (150): Razão Social (espaços à direita, ASCII sem diacríticos)
 *   Pos 181-189  (9): NSR inicial do arquivo (zeros à esquerda)
 *   Pos 190-198  (9): NSR final do arquivo
 *   Pos 199-206  (8): Data inicial do período (ddmmaaaa, BRT)
 *   Pos 207-214  (8): Data final do período (ddmmaaaa, BRT)
 *   Pos 215-222  (8): Data de geração do arquivo (ddmmaaaa, BRT)
 *   Pos 223-226  (4): Hora de geração do arquivo (hhmm, BRT)
 *
 * Tipo 2 — Identificação do empregador (eventos de inclusão/alteração):
 *   Não emitido nesta versão: o modelo ainda não persiste o histórico de
 *   alteração cadastral exigido pelo Tipo 2. Contador zerado no trailer.
 *   TODO(hr): modelar `EmployerIdentityEvent` e emitir aqui.
 *
 * Tipo 3 — Marcação de ponto (33 bytes):
 *   Pos 1       (1):  "3"
 *   Pos 2-10    (9):  NSR (zeros à esquerda)
 *   Pos 11-18   (8):  Data (ddmmaaaa, BRT)
 *   Pos 19-22   (4):  Hora (hhmm, BRT)
 *   Pos 23-33  (11):  PIS do empregado
 *
 * Tipo 4 — Ajuste do relógio:
 *   Não emitido nesta versão (ainda não rastreamos ajustes de relógio do REP).
 *   Contador zerado no trailer. TODO(hr): modelar `ClockAdjustmentEvent`.
 *
 * Tipo 5 — Inclusão/alteração/exclusão de empregado:
 *   Não emitido nesta versão (ainda não rastreamos histórico de cadastro de
 *   empregado em formato auditável). Contador zerado no trailer.
 *   TODO(hr): modelar `EmployeeRegistryEvent`.
 *
 * Tipo 6 — Eventos do REP (ligação/desligamento/falha de energia):
 *   Não emitido nesta versão (não há coleta de eventos do REP no SaaS).
 *   Contador zerado no trailer. TODO(hr): modelar `REPDeviceEvent`.
 *
 * Tipo 7 — Hash do arquivo (obrigatório, último registro, 257 bytes):
 *   Pos 1       (1):  "7"
 *   Pos 2-257 (256):  SHA-256 em hexadecimal maiúsculo do conteúdo completo
 *                     do arquivo (cabeçalho, tipos 3 e trailer tipo 9,
 *                     incluindo o LF após o trailer) SEM o próprio Tipo 7.
 *
 * Tipo 9 — Trailer (46 bytes):
 *   Pos 1       (1):  "9"
 *   Pos 2-10    (9):  Quantidade de registros Tipo 2
 *   Pos 11-19   (9):  Quantidade de registros Tipo 3
 *   Pos 20-28   (9):  Quantidade de registros Tipo 4
 *   Pos 29-37   (9):  Quantidade de registros Tipo 5
 *   Pos 38-46   (9):  Quantidade de registros Tipo 6
 *
 * Observações:
 *  - Separador de linha: LF (\n). CRLF é rejeitado pelo validador da MTP.
 *  - Todas as datas/horas são expressas em BRT (UTC-3, sem horário de verão),
 *    independentemente do timezone do servidor. Helpers em `@/utils/hr/brt-timezone`.
 *  - A Razão Social é normalizada para ASCII (diacríticos removidos) porque o
 *    layout é ISO-8859-1 puro e o validador rejeita caracteres multibyte.
 */

const RECORD_SEPARATOR = '\n';

const RAZAO_SOCIAL_LENGTH = 150;
const NSR_LENGTH = 9;
const COUNTER_LENGTH = 9;
const HASH_HEX_LENGTH = 64; // SHA-256 in hex = 64 chars, doubled field is 256
const HASH_FIELD_LENGTH = 256;

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

    const positiveNsrNumbers = timeEntries
      .map((entry) => entry.nsrNumber ?? 0)
      .filter((nsrNumber) => nsrNumber > 0);
    const nsrInitial =
      positiveNsrNumbers.length > 0 ? Math.min(...positiveNsrNumbers) : 0;
    const nsrFinal =
      positiveNsrNumbers.length > 0 ? Math.max(...positiveNsrNumbers) : 0;

    const generatedAt = new Date();

    const headerRecord = buildHeaderRecord({
      cnpj,
      razaoSocial,
      nsrInitial,
      nsrFinal,
      periodStart: startDate,
      periodEnd: endDate,
      generatedAt,
    });

    const punchRecords = timeEntries.map((entry) =>
      buildPunchRecord({
        nsrNumber: entry.nsrNumber ?? 0,
        timestamp: entry.timestamp,
        employeePis: entry.employee.pis ?? '',
      }),
    );

    const trailerRecord = buildTrailerRecord({
      employerIdentityCount: 0,
      punchCount: punchRecords.length,
      clockAdjustmentCount: 0,
      employeeRegistryCount: 0,
      repDeviceEventCount: 0,
    });

    // SHA-256 must be computed over EVERY byte of the final file EXCEPT the
    // Tipo 7 record itself. Tipo 7 is always the last record (no LF after).
    const contentBeforeHash =
      [headerRecord, ...punchRecords, trailerRecord].join(RECORD_SEPARATOR) +
      RECORD_SEPARATOR;

    const hashRecord = buildHashRecord(contentBeforeHash);

    const content = contentBeforeHash + hashRecord;

    const startIso = formatDateYYYYMMDDInBRT(startDate);
    const endIso = formatDateYYYYMMDDInBRT(endDate);
    const filename = `AFD_${cnpj}_${startIso}_${endIso}.txt`;

    return { content, filename };
  }
}

// ─── Record builders ──────────────────────────────────────────────────────────

function buildHeaderRecord(params: {
  cnpj: string;
  razaoSocial: string;
  nsrInitial: number;
  nsrFinal: number;
  periodStart: Date;
  periodEnd: Date;
  generatedAt: Date;
}): string {
  const {
    cnpj,
    razaoSocial,
    nsrInitial,
    nsrFinal,
    periodStart,
    periodEnd,
    generatedAt,
  } = params;

  const record =
    '1' + // Pos 1
    '1' + // Pos 2 (REP-P)
    cnpj + // Pos 3-16
    '0'.repeat(14) + // Pos 17-30 (CEI/CAEPF)
    razaoSocial + // Pos 31-180
    padNsr(nsrInitial) + // Pos 181-189
    padNsr(nsrFinal) + // Pos 190-198
    formatDateDDMMYYYYInBRT(periodStart) + // Pos 199-206
    formatDateDDMMYYYYInBRT(periodEnd) + // Pos 207-214
    formatDateDDMMYYYYInBRT(generatedAt) + // Pos 215-222
    formatTimeHHMMInBRT(generatedAt); // Pos 223-226

  return record;
}

function buildPunchRecord(params: {
  nsrNumber: number;
  timestamp: Date;
  employeePis: string;
}): string {
  const { nsrNumber, timestamp, employeePis } = params;

  const pis = employeePis.replace(/\D/g, '').padStart(11, '0').slice(-11);

  const record =
    '3' + // Pos 1
    padNsr(nsrNumber) + // Pos 2-10
    formatDateDDMMYYYYInBRT(timestamp) + // Pos 11-18
    formatTimeHHMMInBRT(timestamp) + // Pos 19-22
    pis; // Pos 23-33

  return record;
}

function buildTrailerRecord(params: {
  employerIdentityCount: number;
  punchCount: number;
  clockAdjustmentCount: number;
  employeeRegistryCount: number;
  repDeviceEventCount: number;
}): string {
  return (
    '9' +
    padCounter(params.employerIdentityCount) +
    padCounter(params.punchCount) +
    padCounter(params.clockAdjustmentCount) +
    padCounter(params.employeeRegistryCount) +
    padCounter(params.repDeviceEventCount)
  );
}

function buildHashRecord(contentBeforeHash: string): string {
  const digest = createHash('sha256')
    .update(contentBeforeHash, 'utf8')
    .digest('hex')
    .toUpperCase();

  // A SHA-256 digest in hex is 64 chars, but Portaria 671 defines the field
  // as 256 bytes. We right-pad with spaces to honour the fixed width. The
  // first 64 chars carry the actual digest; parsers read up to the first
  // non-hex character.
  const paddedDigest = digest
    .padEnd(HASH_FIELD_LENGTH, ' ')
    .slice(0, HASH_FIELD_LENGTH);

  return '7' + paddedDigest;
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function padNsr(nsrNumber: number): string {
  return String(nsrNumber).padStart(NSR_LENGTH, '0');
}

function padCounter(counter: number): string {
  return String(counter).padStart(COUNTER_LENGTH, '0');
}

/**
 * Normalises the legal name to fit the 150-byte Pos 31-180 window of the
 * Portaria 671 header:
 *   1. Unicode NFD-decomposes diacritics, then strips the combining marks so
 *      "Empresa Ação LTDA" becomes "Empresa Acao LTDA" (the MTP validator
 *      is ISO-8859-1 only).
 *   2. Removes any remaining non-ASCII characters.
 *   3. Truncates or right-pads with spaces to 150 chars.
 */
function padRazaoSocial(legalName: string): string {
  const ascii = legalName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '');
  return ascii.slice(0, RAZAO_SOCIAL_LENGTH).padEnd(RAZAO_SOCIAL_LENGTH, ' ');
}

// Export hash length constants so tests can assert record widths without
// duplicating the magic numbers.
export const AFD_HASH_FIELD_LENGTH = HASH_FIELD_LENGTH;
export const AFD_HASH_HEX_LENGTH = HASH_HEX_LENGTH;
