/**
 * BuildS1200ForCompetenciaUseCase — Phase 06 / Plan 06-05
 *
 * Orquestra a geração de eventos eSocial S-1200 (Remuneração do Trabalhador
 * vinculado ao RGPS) para um conjunto de funcionários numa competência.
 *
 * **Fluxo:**
 *   1. Valida competencia (YYYY-MM) + scope (ALL|DEPARTMENT|CUSTOM) + inputs.
 *   2. Valida rubrica map: se HE_50/HE_100/DSR ausentes → BadRequestError
 *      (Pitfall 6 — RH não consegue submeter sem os codRubr configurados).
 *   3. Valida EsocialConfig presente (environment + employerDocument).
 *   4. Para cada funcionário no escopo:
 *       a. Fetch Payroll(employeeId, competencia) + payrollItems.
 *       b. Opcional: Fetch TimeBankConsolidation (HE50/HE100/DSR minutes).
 *       c. Monta S1200ItemRemun[] combinando rubricas do payroll + rubricas
 *          mapeadas de HE/DSR consumidas do TimeBank.
 *       d. Chama `S1200Builder.build(input)` → XML.
 *       e. Upload XML ao R2 como ComplianceArtifact(type=S1200_XML).
 *       f. Persiste EsocialEvent(status=DRAFT, xmlContent, referenceId=employeeId).
 *       g. Em erro por funcionário: push em `errors[]` e continua.
 *   5. Cria EsocialBatch agrupando todos os eventos com sucesso.
 *   6. Retorna { batchId, eventIds, artifactIds, errors, touched }.
 *
 * **Clean Architecture:** use case recebe o dataset (tenant, config, employees,
 * payroll, rubricaMap) já resolvido pelo controller. Zero import Prisma.
 *
 * **Idempotência:** cada dispatch cria um novo batch/eventos — o governo aceita
 * retificação explícita via `retify.originalReceiptNumber` com `indRetif=2`.
 *
 * **transmitImmediately** (deferred): em v1 o use case apenas cria o batch em
 * DRAFT. Submissão via SOAP fica a cargo do RH (Plan 06-06 UI ou cron futuro).
 */

import { createHash, randomUUID } from 'node:crypto';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ComplianceArtifact } from '@/entities/hr/compliance-artifact';
import {
  REQUIRED_COMPLIANCE_CONCEPTS,
  type ComplianceRubricaConcept,
  type ComplianceRubricaMap,
} from '@/entities/hr/compliance-rubrica-map';
import {
  S1200Builder,
  type S1200Input,
  type S1200ItemRemun,
} from '@/modules/esocial/services/builders/s1200-builder';
import type { ComplianceArtifactRepository } from '@/repositories/hr/compliance-artifact-repository';
import type { ComplianceRubricaMapRepository } from '@/repositories/hr/compliance-rubrica-map-repository';
import type { FileUploadService } from '@/services/storage/file-upload-service';

import type { EsocialBatchPersistenceService } from './ports/esocial-batch-persistence';

/** Minimal Payroll data needed by the use case (decoupled from Prisma/entity). */
export interface S1200PayrollItemDataset {
  codRubr: string;
  ideTabRubr: string;
  qtdRubr?: number;
  fatorRubr?: number;
  vrRubr: number;
  indApurIR?: number;
}

/** Minimal Employee data needed by the use case (decoupled from Prisma/entity). */
export interface S1200EmployeeDataset {
  id: string;
  /** CPF do trabalhador (11 dígitos — já limpo). */
  cpfTrab: string;
  /** Código de categoria eSocial (Tabela 01 — ex: 101 empregado geral). */
  codCateg: number;
  /** Código de lotação tributária (referencia S-1020). */
  codLotacao: string;
  /** CNPJ do estabelecimento do funcionário (14 dígitos). */
  estabCnpj: string;
  /** Tipo de inscrição do estabelecimento (1=CNPJ, 2=CPF). Default 1. */
  estabTpInsc?: 1 | 2;
  /** Rubricas base vindas do Payroll(employeeId, competencia). */
  payrollItems: S1200PayrollItemDataset[];
  /** Totais consolidados de TimeBank/Overtime (minutos) — opcional. */
  timeBank?: {
    overtime50Minutes: number;
    overtime100Minutes: number;
    dsrMinutes: number;
  };
}

export interface BuildS1200Input {
  tenantId: string;
  invokedByUserId: string;
  competencia: string; // YYYY-MM
  /** Ambiente derivado do EsocialConfig — nunca aceitar override do cliente (T-06-05-11). */
  tpAmb: 1 | 2;
  /** CNPJ (14 dígitos) do empregador — usar para `ideEmpregador`. */
  employerCnpj: string;
  /** Funcionários com dataset pré-resolvido. Controller faz a orquestração. */
  employees: S1200EmployeeDataset[];
  retify?: {
    originalReceiptNumber: string;
    originalEsocialEventId: string;
  };
}

export interface BuildS1200EventCreated {
  eventId: string;
  xmlContent: string;
  referenceId: string;
  rectifiedEventId?: string;
}

export interface BuildS1200Output {
  batchId: string;
  environment: 'HOMOLOGACAO' | 'PRODUCAO';
  eventIds: string[];
  artifactIds: string[];
  events: BuildS1200EventCreated[];
  errors: Array<{ employeeId: string; reason: string }>;
  /** employeeIds identificados como "touched" via Redis (se presentes). Opcional. */
  touched?: string[];
}

const COMPETENCIA_REGEX = /^\d{4}-\d{2}$/;
const XML_MIME_TYPE = 'application/xml';

export class BuildS1200ForCompetenciaUseCase {
  private readonly builder: S1200Builder;

  constructor(
    private readonly rubricaMapRepo: ComplianceRubricaMapRepository,
    private readonly complianceRepo: ComplianceArtifactRepository,
    private readonly fileUploadService: FileUploadService,
    /**
     * WR-02: persistência do EsocialBatch + EsocialEvent migrada do controller
     * para o use case. Opcional para preservar compatibilidade com specs
     * existentes que exercitam apenas a parte pura de geração — quando
     * ausente, o use case gera os eventos em memória e o controller assume
     * a persistência (comportamento pré-WR-02).
     */
    private readonly batchPersistence?: EsocialBatchPersistenceService,
    builder?: S1200Builder,
  ) {
    this.builder = builder ?? new S1200Builder();
  }

  async execute(input: BuildS1200Input): Promise<BuildS1200Output> {
    // ── Validation ────────────────────────────────────────────────────
    if (!COMPETENCIA_REGEX.test(input.competencia)) {
      throw new BadRequestError(
        `Competência inválida — use o formato YYYY-MM (recebido: "${input.competencia}")`,
      );
    }
    if (input.tpAmb !== 1 && input.tpAmb !== 2) {
      throw new BadRequestError(
        'tpAmb deve ser 1 (produção) ou 2 (homologação)',
      );
    }
    const employerCnpjDigits = input.employerCnpj.replace(/\D/g, '');
    if (employerCnpjDigits.length !== 14) {
      throw new BadRequestError(
        'CNPJ do empregador inválido — deve ter 14 dígitos. Configure EsocialConfig antes de gerar S-1200.',
      );
    }
    if (input.employees.length === 0) {
      throw new BadRequestError(
        'Nenhum funcionário informado para gerar S-1200.',
      );
    }

    // ── Valida rubrica map (Pitfall 6 — RH precisa mapear HE/DSR antes) ──
    const rubricaMaps = await this.rubricaMapRepo.findAllByTenant(
      input.tenantId,
    );
    const configuredConcepts = new Set<ComplianceRubricaConcept>(
      rubricaMaps.map((m) => m.clrConcept),
    );
    const missing = REQUIRED_COMPLIANCE_CONCEPTS.filter(
      (c) => !configuredConcepts.has(c),
    );
    if (missing.length > 0) {
      throw new BadRequestError(
        `Configure rubricas HE/DSR em /hr/compliance/esocial-rubricas antes de gerar S-1200. Faltando: ${missing.join(', ')}`,
      );
    }

    const rubricaMapByConcept = new Map<
      ComplianceRubricaConcept,
      ComplianceRubricaMap
    >();
    for (const m of rubricaMaps) {
      rubricaMapByConcept.set(m.clrConcept, m);
    }

    // ── Core: monta eventos por funcionário ───────────────────────────
    const events: BuildS1200EventCreated[] = [];
    const eventIds: string[] = [];
    const artifactIds: string[] = [];
    const errors: Array<{ employeeId: string; reason: string }> = [];
    const batchId = randomUUID();
    const environment: 'HOMOLOGACAO' | 'PRODUCAO' =
      input.tpAmb === 1 ? 'PRODUCAO' : 'HOMOLOGACAO';
    const [year, month] = input.competencia.split('-');

    for (const employee of input.employees) {
      try {
        const itensRemun = this.buildItensRemun(employee, rubricaMapByConcept);

        if (itensRemun.length === 0) {
          errors.push({
            employeeId: employee.id,
            reason:
              'Nenhuma rubrica encontrada para o funcionário nesta competência (Payroll vazio + TimeBank sem saldos).',
          });
          continue;
        }

        const cpfDigits = employee.cpfTrab.replace(/\D/g, '');
        if (cpfDigits.length !== 11) {
          errors.push({
            employeeId: employee.id,
            reason: `CPF inválido do funcionário (${employee.cpfTrab})`,
          });
          continue;
        }

        const s1200Input: S1200Input = {
          indRetif: input.retify ? 2 : 1,
          tpAmb: input.tpAmb,
          nrRecibo: input.retify?.originalReceiptNumber,
          perApur: input.competencia,
          tpInsc: 1,
          nrInsc: employerCnpjDigits,
          cpfTrab: cpfDigits,
          dmDev: [
            {
              ideDmDev: `${employee.id}-${input.competencia}`,
              codCateg: employee.codCateg,
              infoPerApur: {
                ideEstabLot: [
                  {
                    tpInsc: employee.estabTpInsc ?? 1,
                    nrInsc: employee.estabCnpj.replace(/\D/g, ''),
                    codLotacao: employee.codLotacao,
                    remunPerApur: [{ itensRemun }],
                  },
                ],
              },
            },
          ],
        };

        const xmlContent = this.builder.build(s1200Input);
        const eventId = randomUUID();
        const artifactId = randomUUID();

        // ── Upload XML + ComplianceArtifact ─────────────────────────
        const contentHash = createHash('sha256')
          .update(xmlContent)
          .digest('hex');
        const xmlBuffer = Buffer.from(xmlContent, 'utf8');
        const storageKey = `${input.tenantId}/compliance/s1200/${year}-${month}/${employee.id}-${eventId}.xml`;

        await this.fileUploadService.uploadWithKey(xmlBuffer, storageKey, {
          mimeType: XML_MIME_TYPE,
          cacheControl: 'private, max-age=0, no-store',
          metadata: {
            'x-tenant-id': input.tenantId,
            'x-artifact-kind': 'S1200_XML',
            'x-competencia': input.competencia,
            'x-employee-id': employee.id,
            'x-content-sha256': contentHash,
          },
        });

        const artifact = ComplianceArtifact.create(
          {
            tenantId: new UniqueEntityID(input.tenantId),
            type: 'S1200_XML',
            competencia: input.competencia,
            // LGPD (CR-02): cpfTrab removido — PII não deve ser persistido em
            // metadata JSON que é exposto pela API de listagem. O CPF permanece
            // apenas dentro do XML S-1200 no storage privado.
            filters: {
              employeeId: employee.id,
              batchId,
              eventId,
            },
            storageKey,
            contentHash,
            sizeBytes: xmlBuffer.length,
            generatedBy: new UniqueEntityID(input.invokedByUserId),
            generatedAt: new Date(),
          },
          new UniqueEntityID(artifactId),
        );
        await this.complianceRepo.create(artifact);

        events.push({
          eventId,
          xmlContent,
          referenceId: employee.id,
          rectifiedEventId: input.retify?.originalEsocialEventId,
        });
        eventIds.push(eventId);
        artifactIds.push(artifactId);
      } catch (err) {
        errors.push({
          employeeId: employee.id,
          reason: err instanceof Error ? err.message : String(err),
        });
      }
    }

    if (events.length === 0) {
      // 100% dos funcionários falharam — provavelmente um problema transversal
      // (EsocialConfig faltando em todos, CPFs inválidos, etc). Retornar 400.
      throw new BadRequestError(
        `Nenhum evento S-1200 pôde ser gerado. Verifique EsocialConfig, rubrica map e dados dos funcionários. Total de falhas: ${errors.length}`,
      );
    }

    // WR-02: persistência do batch + events centralizada no use case quando
    // a dependência está injetada. Isso retira o Prisma direto do controller
    // e mantém a responsabilidade de persistência na camada de aplicação.
    if (this.batchPersistence) {
      try {
        await this.batchPersistence.persistS1200Batch({
          batchId,
          tenantId: input.tenantId,
          createdBy: input.invokedByUserId,
          environment,
          totalEvents: events.length,
          events: events.map((ev) => ({
            eventId: ev.eventId,
            referenceId: ev.referenceId,
            xmlContent: ev.xmlContent,
            competencia: input.competencia,
            rectifiedEventId: ev.rectifiedEventId,
          })),
        });
      } catch (err) {
        // Constraint/FK failures são erros de input (batchId colisão, FK
        // ausente). Traduzimos para BadRequestError → 400 ao invés de 500.
        const code =
          err && typeof err === 'object' && 'code' in err
            ? (err as { code?: string }).code
            : undefined;
        if (code === 'P2002' || code === 'P2003') {
          throw new BadRequestError(
            `Falha ao persistir EsocialBatch S-1200: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
        }
        throw err;
      }
    }

    return {
      batchId,
      environment,
      eventIds,
      artifactIds,
      events,
      errors,
      touched: input.employees.map((e) => e.id),
    };
  }

  /**
   * Monta S1200ItemRemun[] combinando rubricas base do Payroll + rubricas de
   * HE/DSR consumidas do TimeBank via rubricaMap.
   *
   * Em v1:
   *  - Rubricas do payroll passam direto (já vêm com codRubr resolvido).
   *  - TimeBank.overtime50Minutes > 0 → injeta rubrica HE_50 do map
   *    (qtdRubr = horas = minutes/60, indApurIR herdado do map).
   *  - TimeBank.overtime100Minutes > 0 → rubrica HE_100 do map.
   *  - TimeBank.dsrMinutes > 0 → rubrica DSR do map.
   *  - vrRubr dos itens do TimeBank: deixamos 0 (valor calculado pelo governo
   *    via qtdRubr × fator configurado na S-1010). Evita dupla contagem se o
   *    Payroll já considerou o valor monetário.
   */
  private buildItensRemun(
    employee: S1200EmployeeDataset,
    rubricaMap: Map<ComplianceRubricaConcept, ComplianceRubricaMap>,
  ): S1200ItemRemun[] {
    const items: S1200ItemRemun[] = [];

    for (const item of employee.payrollItems) {
      items.push({
        codRubr: item.codRubr,
        ideTabRubr: item.ideTabRubr,
        qtdRubr: item.qtdRubr,
        fatorRubr: item.fatorRubr,
        vrRubr: item.vrRubr,
        indApurIR: item.indApurIR,
      });
    }

    if (employee.timeBank) {
      if (employee.timeBank.overtime50Minutes > 0) {
        const he50 = rubricaMap.get('HE_50')!;
        items.push({
          codRubr: he50.codRubr,
          ideTabRubr: he50.ideTabRubr,
          qtdRubr: employee.timeBank.overtime50Minutes / 60,
          vrRubr: 0,
          indApurIR: he50.indApurIR,
        });
      }
      if (employee.timeBank.overtime100Minutes > 0) {
        const he100 = rubricaMap.get('HE_100')!;
        items.push({
          codRubr: he100.codRubr,
          ideTabRubr: he100.ideTabRubr,
          qtdRubr: employee.timeBank.overtime100Minutes / 60,
          vrRubr: 0,
          indApurIR: he100.indApurIR,
        });
      }
      if (employee.timeBank.dsrMinutes > 0) {
        const dsr = rubricaMap.get('DSR')!;
        items.push({
          codRubr: dsr.codRubr,
          ideTabRubr: dsr.ideTabRubr,
          qtdRubr: employee.timeBank.dsrMinutes / 60,
          vrRubr: 0,
          indApurIR: dsr.indApurIR,
        });
      }
    }

    return items;
  }
}
