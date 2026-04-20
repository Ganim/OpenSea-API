import { createHash } from 'node:crypto';
import { crc16KermitHex } from './crc16-kermit';

/**
 * AFD Builder — Portaria MTP 671/2021 Anexo I (REP-P).
 *
 * Gera Buffer ISO-8859-1 (Latin-1) com CRLF separator + linhas posicionais
 * dos registros tipo 1 (cabeçalho), 2 (empresa), 5 (empregado), 7 (marcação
 * REP-P), 9 (trailer) + linha de assinatura literal `ASSINATURA_DIGITAL_EM_ARQUIVO_P7S`.
 *
 * **AFD vs AFDT (D-01 / D-05):** o AFD bruto não inclui registros tipo 7 com
 * `adjustmentType=ADJUSTMENT_APPROVED`. O AFDT (artefato proprietário gerado
 * por `buildAfdt`) inclui ambos os tipos de batidas. O builder aceita
 * `options.includeAdjustments=true` para abranger o caso AFDT.
 *
 * **Encoding crítico (Pitfall 1):** todo `Buffer.from(text, 'latin1')` no
 * finalize. Razão social com acentos ('JOÃO' = 4 bytes em ISO-8859-1, NÃO
 * 5 como UTF-8) é validada pelo golden test.
 *
 * **CRLF crítico (Pitfall 2):** `'\r\n'` explícito + `*.golden.txt binary -text`
 * em `__fixtures__/.gitattributes` impede normalização Git em Windows.
 *
 * **CRC-16/KERMIT (Pitfall 8):** golden oficial Portaria 0x2189 validado em
 * `crc16-kermit.spec.ts`. CRC aplicado nos registros tipo 1, 2, 5 (NÃO no
 * tipo 7 — chain SHA-256 substitui — NÃO no trailer tipo 9).
 *
 * **SHA-256 chain (Anexo I §9):** registros tipo 7 carregam hash de 64 chars
 * computado sobre `(campos 1-7 do registro atual) + (campo 8 do registro
 * anterior)`, em sequência crescente de NSR. Primeiro registro: hash anterior
 * = string vazia.
 */

// ─── Helpers posicionais ─────────────────────────────────────────────────────

/**
 * Pad numeric — zero-pad à esquerda; truncamento silencioso aplicado se overflow
 * **só para campos numéricos com tolerância** (ex: timestamps). Para NSR e
 * campos críticos use `padN` + validação prévia que lança RangeError.
 */
function padNumber(v: string | number, width: number): string {
  return String(v).replace(/\D/g, '').padStart(width, '0').slice(-width);
}

/**
 * Pad numeric com VALIDAÇÃO de overflow — lança RangeError se valor numérico
 * excede `width` dígitos. Use para NSR, contagens de trailer, etc.
 */
function padN(v: string | number, width: number): string {
  const digits = String(v).replace(/\D/g, '');
  if (digits.length > width) {
    throw new RangeError(
      `Numeric overflow: value "${v}" has ${digits.length} digits, max ${width} allowed.`,
    );
  }
  return digits.padStart(width, '0');
}

/**
 * Pad alphanumeric — espaço à direita; truncamento silencioso à direita
 * permitido (Portaria aceita truncar campos alfa quando o conteúdo não cabe).
 */
function padA(v: string, width: number): string {
  return v.padEnd(width, ' ').slice(0, width);
}

/**
 * Format Date as "AAAA-MM-dd" (10 chars). Sempre UTC slice — para AFD use a
 * data sem fuso (a janela do AFD é definida por dia, não por instante).
 */
function formatD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Format Date as "AAAA-MM-ddThh:mm:00ZZZZZ" (24 chars).
 *
 * Pitfall 7: a Portaria exige timezone EXPLÍCITO (`-0300`), não o "Z" do
 * `Date.toISOString()`. O timezone passa por argumento (default `-0300`,
 * Brasília); produção deve passar `tenant.settings.timezone`.
 *
 * @param d Date object
 * @param tz Timezone string sem ":", formato `±HHMM` (ex: "-0300", "+0200")
 */
function formatDH(d: Date, tz: string = '-0300'): string {
  // Aplicar offset manualmente para que a parte "AAAA-MM-ddThh:mm:00" represente
  // o horário LOCAL do tenant, não UTC. Isso é o que o auditor espera ver no AFD.
  const sign = tz.startsWith('-') ? -1 : 1;
  const tzHours = parseInt(tz.slice(1, 3), 10);
  const tzMinutes = parseInt(tz.slice(3, 5), 10);
  const offsetMinutes = sign * (tzHours * 60 + tzMinutes);

  // Adiciona o offset (em minutos) ao timestamp UTC para obter o local time
  const localMs = d.getTime() + offsetMinutes * 60_000;
  const local = new Date(localMs);

  const yyyy = local.getUTCFullYear().toString().padStart(4, '0');
  const mm = (local.getUTCMonth() + 1).toString().padStart(2, '0');
  const dd = local.getUTCDate().toString().padStart(2, '0');
  const hh = local.getUTCHours().toString().padStart(2, '0');
  const mi = local.getUTCMinutes().toString().padStart(2, '0');

  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:00${tz}`;
}

// ─── Tipos de domínio do builder ─────────────────────────────────────────────

export interface AfdHeader {
  /** Identif. empregador: 1=CNPJ, 2=CPF */
  tpInsc: 1 | 2;
  /** CNPJ (14 dígitos) ou CPF (11 dígitos) do empregador */
  nrInsc: string;
  /** CNO ou CAEPF (14 dígitos); zeros se não houver */
  cno?: string;
  /** Razão social ou nome do empregador (até 150 chars; truncamento silencioso) */
  razaoSocial: string;
  /**
   * Número INPI (17 dígitos). Para empresas sem registro INPI use o
   * placeholder convencional "99999999999999999" (D-06).
   */
  inpi: string;
  /** Data inicial dos registros (componente data apenas) */
  startDate: Date;
  /** Data final dos registros */
  endDate: Date;
  /** Data/hora de geração do arquivo */
  generatedAt: Date;
  /** Identif. fabricante/desenvolvedor: 1=CNPJ, 2=CPF */
  devTpInsc: 1 | 2;
  /** CNPJ/CPF do fabricante (14 dígitos) */
  devInsc: string;
  /** Timezone explícito (default `-0300`). Pitfall 7. */
  tz?: string;
}

export interface AfdEmpresa {
  /** NSR alocado pra esta linha */
  nsr: number;
  /** Data/hora da gravação */
  recordedAt: Date;
  /** CPF responsável (11 dígitos — será zero-pad à esquerda para 14) */
  responsavelCpf: string;
  /** Identif. empregador: 1=CNPJ, 2=CPF */
  tpInsc: 1 | 2;
  /** CNPJ/CPF empregador (14 dígitos) */
  nrInsc: string;
  /** CNO/CAEPF (14 dígitos); zeros se não houver */
  cno?: string;
  /** Razão social/nome */
  razaoSocial: string;
  /** Local prestação de serviços (até 100 chars; espaços à direita) */
  localPrestacao: string;
}

export interface AfdEmpregado {
  /** NSR */
  nsr: number;
  /** Data/hora gravação */
  recordedAt: Date;
  /** Operação: "I"=inclusão, "A"=alteração, "E"=exclusão. Default "I". */
  operacao?: 'I' | 'A' | 'E';
  /** CPF empregado (11 dígitos — zero-pad para 12) */
  cpf: string;
  /** Nome empregado (truncar 52 chars) */
  nome: string;
  /** Demais dados (até 4 chars; default espaços) */
  demaisDados?: string;
  /** CPF responsável (11 dígitos) */
  responsavelCpf: string;
}

export interface AfdMarcacao {
  /** NSR */
  nsr: number;
  /** Data/hora da batida (momento real do clock) */
  punchAt: Date;
  /** CPF empregado (11 dígitos — zero-pad para 12) */
  cpf: string;
  /** Data/hora gravação server-side */
  recordedAt: Date;
  /**
   * Identificador coletor:
   *   1 = mobile
   *   2 = browser
   *   3 = desktop
   *   4 = dispositivo eletrônico
   *   5 = outro
   *
   * Mapeamento PunchDeviceKind:
   * - PWA_PERSONAL → 1 (mobile)
   * - KIOSK_PUBLIC → 2 (browser)
   * - BIOMETRIC_READER → 3 (desktop)
   * - WEBAUTHN_PC → 2 (browser)
   * - JWT direto sem device → 5 (outro)
   */
  coletor: 1 | 2 | 3 | 4 | 5;
  /** "0" = online, "1" = offline */
  online: 0 | 1;
  /**
   * Tipo de ajuste — quando `ADJUSTMENT_APPROVED`, esta marcação só é incluída
   * no buffer se `options.includeAdjustments === true` (caso AFDT). No AFD
   * bruto, marcações com este flag são FILTRADAS do output.
   */
  adjustmentType?: 'ORIGINAL' | 'ADJUSTMENT_APPROVED';
}

export interface AfdBuildInput {
  header: AfdHeader;
  empresas: AfdEmpresa[];
  empregados: AfdEmpregado[];
  /** Marcações em qualquer ordem; o builder ordena por NSR antes de emitir. */
  marcacoes: AfdMarcacao[];
}

export interface AfdBuildOptions {
  /**
   * Default `false` (AFD bruto — só ORIGINAL).
   * `true` para AFDT — inclui também ADJUSTMENT_APPROVED.
   */
  includeAdjustments?: boolean;
}

// ─── Linha-builders ──────────────────────────────────────────────────────────

const SIGNATURE_LITERAL = 'ASSINATURA_DIGITAL_EM_ARQUIVO_P7S';

/**
 * Tipo 1 — Cabeçalho (302 chars).
 * Posições conforme tabela em `06-RESEARCH.md §AFD Layout`.
 */
function buildTipo1(h: AfdHeader): string {
  if (h.razaoSocial.length === 0) {
    throw new Error('Razão social não pode ser vazia.');
  }
  if (h.inpi.replace(/\D/g, '').length !== 17) {
    throw new RangeError(
      `INPI deve ter 17 dígitos; recebido "${h.inpi}" (${h.inpi.length} chars).`,
    );
  }
  // Validação de período no cabeçalho
  if (h.endDate.getTime() < h.startDate.getTime()) {
    throw new Error(
      `endDate (${formatD(h.endDate)}) anterior a startDate (${formatD(h.startDate)}).`,
    );
  }
  const tz = h.tz ?? '-0300';

  const parts = [
    '000000000', // 1 — 9N literal
    '1', // 2 — tipo
    String(h.tpInsc), // 3 — 1N
    padN(h.nrInsc, 14), // 4 — CNPJ/CPF empregador
    padN(h.cno ?? '', 14), // 5 — CNO/CAEPF
    padA(h.razaoSocial, 150), // 6 — razão social
    padN(h.inpi, 17), // 7 — INPI
    formatD(h.startDate), // 8 — 10D
    formatD(h.endDate), // 9 — 10D
    formatDH(h.generatedAt, tz), // 10 — 24DH
    '003', // 11 — versão leiaute
    String(h.devTpInsc), // 12 — 1N
    padN(h.devInsc, 14), // 13 — CNPJ/CPF fabricante
    padA('', 30), // 14 — modelo (REP-P: 30 espaços)
  ];
  const preCrc = parts.join('');
  if (preCrc.length !== 298) {
    throw new Error(
      `Tipo 1 pre-CRC com tamanho inválido: ${preCrc.length} (esperado 298).`,
    );
  }
  const crc = crc16KermitHex(Buffer.from(preCrc, 'latin1'));
  return preCrc + crc; // 302 chars
}

/**
 * Tipo 2 — Empresa (331 chars).
 */
function buildTipo2(e: AfdEmpresa, tz: string): string {
  // CPF responsável é 11 dígitos — Portaria pede 14 chars no campo (zero-pad).
  const parts = [
    padN(e.nsr, 9), // 1
    '2', // 2
    formatDH(e.recordedAt, tz), // 3 — 24DH
    padN(e.responsavelCpf, 14), // 4 — 14N (zero-pad de 11→14)
    String(e.tpInsc), // 5 — 1N
    padN(e.nrInsc, 14), // 6 — CNPJ/CPF
    padN(e.cno ?? '', 14), // 7 — CNO/CAEPF
    padA(e.razaoSocial, 150), // 8 — razão social
    padA(e.localPrestacao, 100), // 9 — local prestação
  ];
  const preCrc = parts.join('');
  if (preCrc.length !== 327) {
    throw new Error(
      `Tipo 2 pre-CRC com tamanho inválido: ${preCrc.length} (esperado 327).`,
    );
  }
  const crc = crc16KermitHex(Buffer.from(preCrc, 'latin1'));
  return preCrc + crc; // 331 chars
}

/**
 * Tipo 5 — Empregado (118 chars).
 *
 * CPF é 12 dígitos no campo posicional (Pitfall 4): zero-pad à esquerda
 * de 11 dígitos reais → 12 chars (`'0' + cpf`).
 */
function buildTipo5(emp: AfdEmpregado, tz: string): string {
  const parts = [
    padN(emp.nsr, 9), // 1
    '5', // 2
    formatDH(emp.recordedAt, tz), // 3 — 24DH
    emp.operacao ?? 'I', // 4 — 1A
    padN('0' + emp.cpf.replace(/\D/g, ''), 12), // 5 — CPF 12N (zero-pad)
    padA(emp.nome, 52), // 6 — nome
    padA(emp.demaisDados ?? '', 4), // 7 — demais dados
    padN(emp.responsavelCpf, 11), // 8 — CPF responsável 11N
  ];
  const preCrc = parts.join('');
  if (preCrc.length !== 114) {
    throw new Error(
      `Tipo 5 pre-CRC com tamanho inválido: ${preCrc.length} (esperado 114).`,
    );
  }
  const crc = crc16KermitHex(Buffer.from(preCrc, 'latin1'));
  return preCrc + crc; // 118 chars
}

/**
 * Tipo 7 — Marcação REP-P (137 chars).
 *
 * **NÃO tem CRC-16** — usa SHA-256 chain (campo 8) em vez disso.
 * Recebe `prevHash` da batida anterior (string vazia para a primeira).
 * Retorna `{ line, hash }` para alimentar a próxima iteração.
 */
function buildTipo7(
  m: AfdMarcacao,
  prevHash: string,
  tz: string,
): { line: string; hash: string } {
  const preHashParts = [
    padN(m.nsr, 9), // 1 — NSR
    '7', // 2 — tipo
    formatDH(m.punchAt, tz), // 3 — DH batida
    padN('0' + m.cpf.replace(/\D/g, ''), 12), // 4 — CPF 12N (zero-pad)
    formatDH(m.recordedAt, tz), // 5 — DH gravação
    padN(m.coletor, 2), // 6 — coletor 2N
    String(m.online), // 7 — online 1N
  ];
  const preHash = preHashParts.join('');
  if (preHash.length !== 73) {
    throw new Error(
      `Tipo 7 pre-hash com tamanho inválido: ${preHash.length} (esperado 73).`,
    );
  }
  // SHA-256 chain (Anexo I §9): hash do registro = sha256(campos 1-7 || hash anterior)
  const hash = createHash('sha256')
    .update(preHash + prevHash, 'latin1')
    .digest('hex'); // 64 chars hex
  return { line: preHash + hash, hash };
}

/**
 * Tipo 9 — Trailer (64 chars). NÃO tem CRC-16.
 */
function buildTipo9(counts: {
  t2: number;
  t3: number;
  t4: number;
  t5: number;
  t6: number;
  t7: number;
}): string {
  const parts = [
    '999999999', // 1 — literal
    padN(counts.t2, 9),
    padN(counts.t3, 9),
    padN(counts.t4, 9),
    padN(counts.t5, 9),
    padN(counts.t6, 9),
    padN(counts.t7, 9),
    '9', // 8 — terminador
  ];
  const line = parts.join('');
  if (line.length !== 64) {
    throw new Error(
      `Tipo 9 com tamanho inválido: ${line.length} (esperado 64).`,
    );
  }
  return line;
}

/**
 * Linha de assinatura (100 chars). REP-P: literal + espaços.
 * Assinatura digital P7S real fica em arquivo separado (deferred).
 */
function buildSignatureLine(): string {
  return padA(SIGNATURE_LITERAL, 100);
}

// ─── Composer ────────────────────────────────────────────────────────────────

/**
 * Build AFD (Portaria MTP 671/2021 Anexo I, REP-P).
 *
 * @param input estrutura com header + arrays de empresas, empregados, marcações
 * @param options se `includeAdjustments=true`, inclui marcações com
 *                `adjustmentType='ADJUSTMENT_APPROVED'` (caso AFDT)
 * @returns Buffer ISO-8859-1 com CRLF; pronto para upload S3 ou validação MTP.
 *
 * @throws RangeError em overflow numérico (NSR > 999_999_999, INPI ≠ 17 dígitos)
 * @throws Error em validações de domínio (endDate < startDate, razão vazia)
 */
export function buildAfd(
  input: AfdBuildInput,
  options: AfdBuildOptions = {},
): Buffer {
  const includeAdjustments = options.includeAdjustments ?? false;
  const tz = input.header.tz ?? '-0300';
  const lines: string[] = [];

  // 1 — Cabeçalho
  lines.push(buildTipo1(input.header));

  // 2 — Empresa(s) ordenadas por NSR
  const empresasOrdenadas = [...input.empresas].sort((a, b) => a.nsr - b.nsr);
  for (const emp of empresasOrdenadas) {
    lines.push(buildTipo2(emp, tz));
  }

  // 5 — Empregado(s) ordenados por NSR
  const empregadosOrdenados = [...input.empregados].sort(
    (a, b) => a.nsr - b.nsr,
  );
  for (const emp of empregadosOrdenados) {
    lines.push(buildTipo5(emp, tz));
  }

  // 7 — Marcações ordenadas por NSR. Filtrar adjustments se for AFD bruto.
  const marcacoesFiltradas = input.marcacoes.filter((m) => {
    if (m.adjustmentType === 'ADJUSTMENT_APPROVED' && !includeAdjustments) {
      return false;
    }
    return true;
  });
  const marcacoesOrdenadas = [...marcacoesFiltradas].sort(
    (a, b) => a.nsr - b.nsr,
  );
  let prevHash = '';
  for (const m of marcacoesOrdenadas) {
    const { line, hash } = buildTipo7(m, prevHash, tz);
    lines.push(line);
    prevHash = hash;
  }

  // 9 — Trailer (contagens REAIS de linhas emitidas)
  lines.push(
    buildTipo9({
      t2: empresasOrdenadas.length,
      t3: 0, // REP-P não emite tipo 3
      t4: 0, // não emitimos ajuste de relógio
      t5: empregadosOrdenados.length,
      t6: 0, // não emitimos eventos sensíveis (deferred Phase 9)
      t7: marcacoesOrdenadas.length,
    }),
  );

  // Linha de assinatura literal
  lines.push(buildSignatureLine());

  // Join CRLF + CRLF final + ISO-8859-1
  const text = lines.join('\r\n') + '\r\n';
  return Buffer.from(text, 'latin1');
}

// Exporta helpers somente para testes (sem prefixo `_` para clareza).
export const __internals = {
  padN,
  padA,
  padNumber,
  formatD,
  formatDH,
  buildTipo1,
  buildTipo2,
  buildTipo5,
  buildTipo7,
  buildTipo9,
  buildSignatureLine,
  SIGNATURE_LITERAL,
};
