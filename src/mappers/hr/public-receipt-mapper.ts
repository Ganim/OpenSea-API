/**
 * ════════════════════════════════════════════════════════════════════════════
 *  LGPD WHITELIST — Public Receipt Mapper (Phase 06 / Plan 06-03)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * ⚠️  NÃO ADICIONE CAMPOS NOVOS A ESTE MAPPER SEM ASSINATURA LGPD.  ⚠️
 *
 * Esta função é o único ponto de saída de dados para a rota PÚBLICA
 * `GET /v1/public/punch/verify/:nsrHash`. A rota é sem autenticação e
 * rate-limited a 30 req/min por IP. Qualquer campo adicionado aqui vaza
 * para a internet.
 *
 * Whitelist permitida (definida em conjunto com o time jurídico — D-11
 * CONTEXT e Plan 06-03 §whitelist):
 *   - Nome completo / social do funcionário
 *   - Razão social do tenant
 *   - CNPJ mascarado (apenas sufixo/DV visível)
 *   - Data/hora da batida
 *   - NSR (número sequencial Portaria 671)
 *   - Tipo de batida (label em português)
 *   - Status visível: APPROVED ou PENDING_APPROVAL
 *
 * Campos PROIBIDOS (não expor, não logar, não adicionar):
 *   - CPF, RG, PIS, matrícula, qualquer documento
 *   - Endereço, telefone, e-mail
 *   - Departamento, cargo, foto
 *   - Latitude, longitude, IP, device info
 *   - Face embeddings, liveness metadata, photo URL
 *   - IDs internos (userId, employeeId, tenantId)
 *   - Detalhes do motivo de PENDING (manager decision context)
 *
 * Qualquer PR que adicione um campo a `PublicReceiptDto` ou ao retorno de
 * `toPublicReceiptDto` DEVE ser bloqueado pelo revisor até ter aprovação
 * explícita do DPO/time jurídico registrada na descrição do PR.
 *
 * Tests:
 *   - find-time-entry-by-receipt-hash.spec.ts tem sentinela LGPD:
 *     `JSON.stringify(result)` não pode conter CPF/matrícula/e-mail.
 *   - v1-punch-verify-public.e2e.spec.ts tem sentinelas do response body
 *     literal (CPF, e-mail, registration string, etc).
 * ════════════════════════════════════════════════════════════════════════════
 */

export type PublicEntryType =
  | 'CLOCK_IN'
  | 'CLOCK_OUT'
  | 'BREAK_START'
  | 'BREAK_END';

export interface PublicReceiptDto {
  employeeName: string;
  tenantRazaoSocial: string;
  /**
   * Formato ``**.***.***\/NNNN-NN``, radical mascarado, sufixo/DV visível.
   */
  tenantCnpjMasked: string;
  nsrNumber: number;
  /** ISO 8601 em UTC. */
  timestamp: string;
  entryType: PublicEntryType;
  entryTypeLabel: string;
  status: 'APPROVED' | 'PENDING_APPROVAL';
}

/**
 * Mascara CNPJ: radical (8 dígitos) é substituído por asteriscos; sufixo (4
 * dígitos da filial) + 2 DV permanecem visíveis.
 *
 * Input:  12345678000190  ou  12.345.678/0001-90
 * Output: asteriscos no radical + /NNNN-NN visível.
 *
 * Retorna /0000-00 quando input não tem 14 dígitos — nunca vazamos string
 * original para o público, sempre forçamos o formato mascarado.
 */
export function maskCnpj(cnpj: string): string {
  const cleaned = (cnpj ?? '').replace(/\D/g, '');
  if (cleaned.length !== 14) {
    return '**.***.***/0000-00';
  }
  return `**.***.***/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`;
}

/**
 * Traduz `TimeEntryType` para label PT-BR amigável ao público.
 * Mantém os 4 tipos aceitos pela rota (OVERTIME fica fora — não gera recibo
 * público nesta fase).
 */
export function entryTypeLabel(t: PublicEntryType): string {
  switch (t) {
    case 'CLOCK_IN':
      return 'Entrada';
    case 'CLOCK_OUT':
      return 'Saída';
    case 'BREAK_START':
      return 'Início do intervalo';
    case 'BREAK_END':
      return 'Retorno do intervalo';
  }
}

export interface ToPublicReceiptDtoInput {
  employee: {
    /** Preferir socialName; fallback fullName. Nunca misturar com cpf/registration. */
    socialName?: string | null;
    fullName: string;
  };
  tenant: {
    /** Razão social exibida ao público. */
    name: string;
  };
  /** CNPJ RAW (14 dígitos) — mascarado pelo mapper, nunca usado direto. */
  tenantCnpj: string;
  timeEntry: {
    nsrNumber: number;
    timestamp: Date;
    entryType: PublicEntryType;
    /**
     * Status da `PunchApproval` vinculada, ou null se não existe (ACCEPT direto).
     * - PENDING      → público vê "Aguardando aprovação do gestor"
     * - APPROVED/null → público vê "Ponto registrado ✓"
     * - REJECTED     → retorno semântico = PENDING (gestor decidiu não aprovar;
     *                  não expomos o motivo ao público — confidencial gestor/RH)
     */
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  };
}

/**
 * Monta o DTO de resposta pública. **Ponto único de validação LGPD.**
 *
 * Ver comentário header do arquivo — qualquer adição de campo exige
 * assinatura LGPD explícita no PR.
 */
export function toPublicReceiptDto(
  input: ToPublicReceiptDtoInput,
): PublicReceiptDto {
  const { employee, tenant, tenantCnpj, timeEntry } = input;

  const displayName =
    (employee.socialName && employee.socialName.trim()) || employee.fullName;

  const status: PublicReceiptDto['status'] =
    timeEntry.approvalStatus === 'PENDING' ||
    timeEntry.approvalStatus === 'REJECTED'
      ? 'PENDING_APPROVAL'
      : 'APPROVED';

  return {
    employeeName: displayName,
    tenantRazaoSocial: tenant.name,
    tenantCnpjMasked: maskCnpj(tenantCnpj),
    nsrNumber: timeEntry.nsrNumber,
    timestamp: timeEntry.timestamp.toISOString(),
    entryType: timeEntry.entryType,
    entryTypeLabel: entryTypeLabel(timeEntry.entryType),
    status,
  };
}
