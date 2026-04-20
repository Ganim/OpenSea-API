import type { ComplianceArtifactRepository } from '@/repositories/hr/compliance-artifact-repository';
import type { FileUploadService } from '@/services/storage/file-upload-service';

import { GenerateAfdUseCase } from './generate-afd';

/**
 * Phase 06 / Plan 06-02 — `GenerateAfdtUseCase`.
 *
 * AFDT é artefato proprietário OpenSea (D-05): mesmo layout do AFD oficial,
 * mas inclui também batidas com `adjustmentType=ADJUSTMENT_APPROVED` (linhas
 * de correção aprovadas pelo gestor via `ResolvePunchApprovalUseCase` +
 * `correctionPayload`). Cada correção carrega NSR sequencial próprio
 * (PUNCH-COMPLIANCE-07), e a rastreabilidade origin↔correction fica no DB
 * via `TimeEntry.originNsrNumber`.
 *
 * **NÃO é o leiaute oficial AEJ** que substituiu o AFDT na Portaria MTP
 * 671/2021. O artefato legal exigido em auditoria é o AFD; AFDT é
 * conferência trabalhista interna. Documentação visível ao usuário:
 * tooltip no dashboard `/hr/compliance` (Plan 06-06).
 *
 * Implementação: subclasse trivial de `GenerateAfdUseCase` com `kind='AFDT'`,
 * que troca o filtro de `ADJUSTMENT_APPROVED` (inclui em vez de excluir) e
 * grava `ComplianceArtifact.type='AFDT'`. Toda a lógica de validação de
 * período + storage key + audit fica reutilizada.
 */
export class GenerateAfdtUseCase extends GenerateAfdUseCase {
  constructor(
    complianceArtifactRepository: ComplianceArtifactRepository,
    fileUploadService: FileUploadService,
  ) {
    super(complianceArtifactRepository, fileUploadService, 'AFDT');
  }
}
