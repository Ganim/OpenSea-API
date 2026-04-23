import type { PrismaClient } from '@prisma/generated/client.js';

import type {
  AfdBuildInput,
  AfdEmpregado,
  AfdEmpresa,
  AfdMarcacao,
} from '@/lib/compliance/afd-builder';

/**
 * Phase 06 / Plan 06-02 — helper de montagem do dataset AFD/AFDT a partir
 * do Prisma.
 *
 * O `GenerateAfdUseCase` recebe `AfdBuildInput` já resolvido (Clean Architecture:
 * use case não toca Prisma). Esta função é a **única camada de orquestração**
 * que traduz a query do tenant (Tenant + EsocialConfig + Employees + TimeEntries
 * + PunchDevices) no shape que o builder espera.
 *
 * Chamada pelos dois controllers (AFD e AFDT): a diferença de filtro
 * (`ORIGINAL` vs `ORIGINAL + ADJUSTMENT_APPROVED`) fica dentro do use case.
 * Aqui retornamos SEMPRE o conjunto completo (o use case decide o que
 * incluir com base em `kind`).
 *
 * **Invariantes**:
 *  - Filtra por `tenantId` em todas as queries (isolamento multi-tenant).
 *  - NSR para cabeçalho/empresas/empregados é sintético (alocado aqui),
 *    separado do NSR real das batidas. Para o arquivo final não importa
 *    (NSR da batida é o que matter para auditoria; NSRs de header/emp são
 *    convencionais). Usamos valores baixos (1, 2, 3..) para cabeçalho/empresa/
 *    empregados, depois os NSRs reais das batidas. Isso é consistente com o
 *    que validadores MTP aceitam (NSR é sequencial por arquivo, não global).
 *  - `inpi` do header: fallback `'99999999999999999'` quando `EsocialConfig`
 *    não tem o campo configurado (D-06 ratificado).
 *  - `coletor` campo 6 do registro tipo 7: mapeamento oficial (Pitfall §AFD
 *    Layout Tipo 7):
 *        PWA_PERSONAL     → 1 (mobile)
 *        KIOSK_PUBLIC     → 2 (browser)
 *        BIOMETRIC_READER → 3 (desktop)
 *        WEBAUTHN_PC      → 2 (browser)
 *        (sem device)     → 5 (outro)
 */

const INPI_FALLBACK = '99999999999999999';
const DEFAULT_TIMEZONE = '-0300';
// CPF sintético para o "responsável" do AFD. Portaria exige 11 dígitos; em
// uma operação real viria do dono da conta OpenSea no tenant. Usamos um
// placeholder bem conhecido para manter o formato válido (validador MTP
// aceita; testes golden mostram).
const DEFAULT_RESPONSAVEL_CPF = '00000000000';
// Fabricante/desenvolvedor do REP-P: OpenSea (CNPJ placeholder; trocar em prod).
const OPENSEA_DEV_CNPJ = '00000000000191';

export interface BuildAfdDatasetParams {
  prisma: PrismaClient;
  tenantId: string;
  startDate: Date;
  endDate: Date;
  cnpj?: string;
  departmentIds?: string[];
  employeeId?: string;
}

/**
 * Mapeia `TimeEntry.deviceType` (VarChar(8)) para `coletor` campo 6 tipo 7.
 *
 * `deviceType` é preenchido pelo `ExecutePunchUseCase` com valores:
 *   - 'REP_P'   — REP-P certificado (Portaria)
 *   - 'MOBILE'  → 1 (PWA pessoal)
 *   - 'BROWSER' → 2 (kiosk / webauthn)
 *   - 'DESKTOP' → 3 (leitor biométrico Tauri)
 *   - 'OTHER'   → 5
 *   - null/undefined (batidas legacy) → 5 (outro)
 *
 * Fallback conservador: qualquer valor desconhecido vira 5 (a Portaria aceita
 * "outro" sem rejeitar o arquivo).
 */
function mapDeviceTypeToColetor(
  deviceType: string | null | undefined,
): 1 | 2 | 3 | 4 | 5 {
  if (!deviceType) return 5;
  const normalized = deviceType.toUpperCase();
  switch (normalized) {
    case 'MOBILE':
    case 'PWA':
    case 'PWA_PERSONAL':
      return 1;
    case 'BROWSER':
    case 'KIOSK':
    case 'KIOSK_PUBLIC':
    case 'WEBAUTHN':
    case 'WEBAUTHN_PC':
      return 2;
    case 'DESKTOP':
    case 'BIOMETRIC':
    case 'BIOMETRIC_READER':
    case 'REP_P':
      return 3;
    case 'ELETRONIC':
    case 'ELETRONICO':
      return 4;
    default:
      return 5;
  }
}

function onlyDigits(s: string | null | undefined): string {
  return (s ?? '').replace(/\D/g, '');
}

export async function buildAfdDataset(
  params: BuildAfdDatasetParams,
): Promise<AfdBuildInput> {
  const {
    prisma,
    tenantId,
    startDate,
    endDate,
    cnpj,
    departmentIds,
    employeeId,
  } = params;

  // ── 1. Tenant + EsocialConfig para header (tipo 1) e empresa (tipo 2) ────────
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true, settings: true },
  });
  if (!tenant) {
    throw new Error(`Tenant ${tenantId} não encontrado`);
  }

  const esocialConfig = await prisma.esocialConfig.findUnique({
    where: { tenantId },
    select: { employerType: true, employerDocument: true },
  });

  const settings = (tenant.settings ?? {}) as Record<string, unknown>;
  const timezone =
    typeof settings.timezone === 'string'
      ? (settings.timezone as string)
      : DEFAULT_TIMEZONE;

  // CNPJ do header: prioriza o filtro do body, senão EsocialConfig,
  // senão tenant.settings.cnpj. Último recurso: zeros (validador vai rejeitar
  // — é sinal de que o tenant precisa configurar o eSocialConfig).
  const headerCnpj =
    cnpj ??
    onlyDigits(esocialConfig?.employerDocument) ??
    (typeof settings.cnpj === 'string' ? onlyDigits(settings.cnpj) : '') ??
    '00000000000000';
  const tpInsc =
    esocialConfig?.employerType === 'CPF' ||
    (cnpj && onlyDigits(cnpj).length === 11)
      ? (2 as const)
      : (1 as const);

  // ── 2. Employees filtrados ──────────────────────────────────────────────────
  const employeeWhere: Record<string, unknown> = {
    tenantId,
    deletedAt: null,
  };
  if (employeeId) {
    employeeWhere.id = employeeId;
  }
  if (departmentIds?.length) {
    employeeWhere.departmentId = { in: departmentIds };
  }

  const employees = await prisma.employee.findMany({
    where: employeeWhere,
    select: {
      id: true,
      fullName: true,
      cpf: true,
      hireDate: true,
    },
    orderBy: { fullName: 'asc' },
  });

  // ── 3. TimeEntries no período (inclui ORIGINAL + ADJUSTMENT_APPROVED; o use
  //       case filtra depois baseado em `kind`). Filtro por employeeId respeitado
  //       (o filtro de employees acima é orientativo — o AFD inclui todos os
  //       empregados que bateram no período, não apenas os que estão ativos hoje).
  // ───────────────────────────────────────────────────────────────────────────
  const entryWhere: Record<string, unknown> = {
    tenantId,
    timestamp: { gte: startDate, lte: endDate },
    nsrNumber: { not: null },
  };
  if (employeeId) {
    entryWhere.employeeId = employeeId;
  } else if (departmentIds?.length) {
    entryWhere.employee = { departmentId: { in: departmentIds } };
  }

  const timeEntries = await prisma.timeEntry.findMany({
    where: entryWhere,
    select: {
      id: true,
      employeeId: true,
      timestamp: true,
      createdAt: true,
      nsrNumber: true,
      deviceType: true,
      adjustmentType: true,
    },
    orderBy: { nsrNumber: 'asc' },
  });

  // Coletar employeeIds das batidas para carregar CPFs que não vieram no filtro
  // de Employees (cobertura completa).
  const uniqueBatidaEmployeeIds = Array.from(
    new Set(timeEntries.map((t) => t.employeeId)),
  );
  const missingIds = uniqueBatidaEmployeeIds.filter(
    (id) => !employees.some((e) => e.id === id),
  );
  if (missingIds.length > 0) {
    const extra = await prisma.employee.findMany({
      where: { id: { in: missingIds }, tenantId },
      select: { id: true, fullName: true, cpf: true, hireDate: true },
    });
    employees.push(...extra);
  }

  const employeeById = new Map(employees.map((e) => [e.id, e]));

  // ── 5. Montar empresas (tipo 2) — 1 entrada (tenant principal). Filiais
  //       entram em milestone futura. NSR sintético = 1.
  // ───────────────────────────────────────────────────────────────────────────
  const empresas: AfdEmpresa[] = [
    {
      nsr: 1,
      recordedAt: startDate,
      responsavelCpf: DEFAULT_RESPONSAVEL_CPF,
      tpInsc,
      nrInsc: headerCnpj,
      cno: '',
      razaoSocial: tenant.name,
      localPrestacao:
        typeof settings.address === 'string'
          ? (settings.address as string)
          : 'Endereço não informado',
    },
  ];

  // ── 6. Montar empregados (tipo 5). NSR sintético começa em 2.
  // ───────────────────────────────────────────────────────────────────────────
  const empregados: AfdEmpregado[] = employees.map((emp, idx) => ({
    nsr: 2 + idx,
    recordedAt: emp.hireDate ?? startDate,
    operacao: 'I',
    cpf: onlyDigits(emp.cpf) || '00000000000',
    nome: emp.fullName,
    responsavelCpf: DEFAULT_RESPONSAVEL_CPF,
  }));

  // ── 7. Montar marcações (tipo 7). NSR = nsrNumber real do TimeEntry. ──────
  //       Mapeamento `coletor` (campo 6 tipo 7) via `TimeEntry.deviceType`
  //       (VarChar(8)). PunchDevice.deviceKind não é linkado a TimeEntry por FK
  //       no schema atual — deviceType é a fonte primária. Em produção o
  //       campo é preenchido pelo ExecutePunchUseCase (Plan 04-04 + 05-07);
  //       batidas legacy sem deviceType caem em "outro" (5).
  const marcacoes: AfdMarcacao[] = timeEntries
    .filter((t) => t.nsrNumber != null)
    .map((t) => {
      const emp = employeeById.get(t.employeeId);
      const cpf = emp ? onlyDigits(emp.cpf) : '00000000000';
      return {
        nsr: t.nsrNumber!,
        punchAt: t.timestamp,
        cpf: cpf || '00000000000',
        recordedAt: t.createdAt,
        coletor: mapDeviceTypeToColetor(t.deviceType),
        online: 0,
        adjustmentType: t.adjustmentType as 'ORIGINAL' | 'ADJUSTMENT_APPROVED',
      };
    });

  return {
    header: {
      tpInsc,
      nrInsc: headerCnpj,
      cno: '',
      razaoSocial: tenant.name,
      inpi: INPI_FALLBACK, // D-06 — EsocialConfig.inpiNumber fica em Plan 06-06 (UI)
      startDate,
      endDate,
      generatedAt: new Date(),
      devTpInsc: 1,
      devInsc: OPENSEA_DEV_CNPJ,
      tz: timezone,
    },
    empresas,
    empregados,
    marcacoes,
  };
}
