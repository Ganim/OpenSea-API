import { createHash } from 'node:crypto';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EsocialEvent } from '@/entities/esocial/esocial-event';
import { EsocialEventType } from '@/entities/esocial/value-objects/event-type';
import type { EsocialEventsRepository } from '@/repositories/esocial/esocial-events-repository';
import type { EsocialConfigRepository } from '@/repositories/esocial/esocial-config-repository';
import type { EsocialRubricasRepository } from '@/repositories/esocial/esocial-rubricas-repository';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { AbsencesRepository } from '@/repositories/hr/absences-repository';
import type { TerminationsRepository } from '@/repositories/hr/terminations-repository';
import type { DependantsRepository } from '@/repositories/hr/dependants-repository';
import type { MedicalExamsRepository } from '@/repositories/hr/medical-exams-repository';
import type { PayrollsRepository } from '@/repositories/hr/payrolls-repository';
import type { PayrollItemsRepository } from '@/repositories/hr/payroll-items-repository';

// Table builders
import { S1000Builder } from '@/modules/esocial/services/builders/s1000-builder';
import { S1005Builder } from '@/modules/esocial/services/builders/s1005-builder';
import { S1010Builder } from '@/modules/esocial/services/builders/s1010-builder';
import { S1020Builder } from '@/modules/esocial/services/builders/s1020-builder';
import { S1070Builder } from '@/modules/esocial/services/builders/s1070-builder';

// Periodic builders
import { S1200Builder } from '@/modules/esocial/services/builders/s1200-builder';
import { S1210Builder } from '@/modules/esocial/services/builders/s1210-builder';
import { S1298Builder } from '@/modules/esocial/services/builders/s1298-builder';
import { S1299Builder } from '@/modules/esocial/services/builders/s1299-builder';

// Non-periodic builders
import { S2190Builder } from '@/modules/esocial/services/builders/s2190-builder';
import { S2200Builder } from '@/modules/esocial/services/builders/s2200-builder';
import { S2205Builder } from '@/modules/esocial/services/builders/s2205-builder';
import { S2206Builder } from '@/modules/esocial/services/builders/s2206-builder';
import { S2210Builder } from '@/modules/esocial/services/builders/s2210-builder';
import { S2220Builder } from '@/modules/esocial/services/builders/s2220-builder';
import {
  S2230Builder,
  ABSENCE_TYPE_TO_ESOCIAL_MOTIVO,
} from '@/modules/esocial/services/builders/s2230-builder';
import { S2240Builder } from '@/modules/esocial/services/builders/s2240-builder';
import { S2298Builder } from '@/modules/esocial/services/builders/s2298-builder';
import {
  S2299Builder,
  TERMINATION_TYPE_TO_ESOCIAL_MOTIVO,
} from '@/modules/esocial/services/builders/s2299-builder';
import { S2300Builder } from '@/modules/esocial/services/builders/s2300-builder';
import { S2399Builder } from '@/modules/esocial/services/builders/s2399-builder';

// Exclusion builder
import { S3000Builder } from '@/modules/esocial/services/builders/s3000-builder';

// ---------------------------------------------------------------------------
// Medical exam type mapping to eSocial ASO type
// ---------------------------------------------------------------------------

const MEDICAL_EXAM_TYPE_TO_ASO: Record<string, number> = {
  ADMISSIONAL: 0,
  PERIODICO: 1,
  RETORNO: 2,
  MUDANCA_FUNCAO: 3,
  DEMISSIONAL: 4,
};

const MEDICAL_EXAM_RESULT_TO_ESOCIAL: Record<string, number> = {
  APTO: 1,
  INAPTO: 2,
  APTO_COM_RESTRICOES: 1, // eSocial only has Apto/Inapto
};

// ---------------------------------------------------------------------------
// Request / Response
// ---------------------------------------------------------------------------

export interface GenerateEventRequest {
  tenantId: string;
  eventType: string;
  referenceType: string;
  referenceId: string;

  // Additional input data for events that need extra context
  // (table events, periodic events, exclusion events)
  additionalData?: Record<string, unknown>;
}

export interface GenerateEventResponse {
  event: EsocialEvent;
}

// ---------------------------------------------------------------------------
// Supported event types
// ---------------------------------------------------------------------------

const SUPPORTED_EVENT_TYPES: EsocialEventType[] = [
  // Table events
  EsocialEventType.S_1000,
  EsocialEventType.S_1005,
  EsocialEventType.S_1010,
  EsocialEventType.S_1020,
  EsocialEventType.S_1070,

  // Periodic events
  EsocialEventType.S_1200,
  EsocialEventType.S_1210,
  EsocialEventType.S_1298,
  EsocialEventType.S_1299,

  // Non-periodic events
  EsocialEventType.S_2190,
  EsocialEventType.S_2200,
  EsocialEventType.S_2205,
  EsocialEventType.S_2206,
  EsocialEventType.S_2210,
  EsocialEventType.S_2220,
  EsocialEventType.S_2230,
  EsocialEventType.S_2240,
  EsocialEventType.S_2298,
  EsocialEventType.S_2299,
  EsocialEventType.S_2300,
  EsocialEventType.S_2399,

  // Exclusion event
  EsocialEventType.S_3000,
];

/**
 * Generates an eSocial XML event from a source HR entity.
 *
 * Looks up the referenced entity (Employee, Absence, Termination, MedicalExam,
 * Payroll, Rubrica, Config, or Event), selects the appropriate builder,
 * generates XML, computes its hash, and stores the event in DRAFT status.
 */
export class GenerateEventUseCase {
  constructor(
    private eventsRepository: EsocialEventsRepository,
    private configRepository: EsocialConfigRepository,
    private rubricasRepository: EsocialRubricasRepository,
    private employeesRepository: EmployeesRepository,
    private absencesRepository: AbsencesRepository,
    private terminationsRepository: TerminationsRepository,
    private dependantsRepository: DependantsRepository,
    private medicalExamsRepository: MedicalExamsRepository,
    private payrollsRepository: PayrollsRepository,
    private payrollItemsRepository: PayrollItemsRepository,
  ) {}

  async execute(request: GenerateEventRequest): Promise<GenerateEventResponse> {
    const { tenantId, eventType, referenceType, referenceId, additionalData } =
      request;

    // Validate event type
    if (!SUPPORTED_EVENT_TYPES.includes(eventType as EsocialEventType)) {
      throw new BadRequestError(
        `Tipo de evento não suportado para geração automática: ${eventType}`,
      );
    }

    // Load tenant eSocial config
    const config = await this.configRepository.findByTenantId(tenantId);
    if (!config) {
      throw new BadRequestError(
        'Configuração eSocial não encontrada para este tenant. Configure antes de gerar eventos.',
      );
    }

    if (!config.nrInsc) {
      throw new BadRequestError(
        'CNPJ/CPF do empregador não configurado. Atualize a configuração eSocial.',
      );
    }

    const tpAmb: 1 | 2 = config.environment === 'PRODUCAO' ? 1 : 2;
    const tpInsc = config.tpInsc;
    const nrInsc = config.nrInsc;

    const xml = await this.dispatchBuilder(
      eventType as EsocialEventType,
      tenantId,
      referenceId,
      tpInsc,
      nrInsc,
      tpAmb,
      additionalData,
    );

    const xmlHash = createHash('sha256').update(xml).digest('hex');

    const event = await this.eventsRepository.create({
      tenantId,
      eventType,
      referenceId,
      referenceType,
      xmlContent: xml,
      xmlHash,
      status: 'DRAFT',
    });

    return { event };
  }

  // ---------------------------------------------------------------------------
  // Builder dispatcher
  // ---------------------------------------------------------------------------

  private async dispatchBuilder(
    eventType: EsocialEventType,
    tenantId: string,
    referenceId: string,
    tpInsc: number,
    nrInsc: string,
    tpAmb: 1 | 2,
    additionalData?: Record<string, unknown>,
  ): Promise<string> {
    switch (eventType) {
      // Table events
      case EsocialEventType.S_1000:
        return this.buildS1000(tenantId, tpInsc, nrInsc, tpAmb, additionalData);
      case EsocialEventType.S_1005:
        return this.buildS1005(tpInsc, nrInsc, tpAmb, additionalData);
      case EsocialEventType.S_1010:
        return this.buildS1010(tenantId, referenceId, tpInsc, nrInsc, tpAmb);
      case EsocialEventType.S_1020:
        return this.buildS1020(tpInsc, nrInsc, tpAmb, additionalData);
      case EsocialEventType.S_1070:
        return this.buildS1070(tpInsc, nrInsc, tpAmb, additionalData);

      // Periodic events
      case EsocialEventType.S_1200:
        return this.buildS1200(
          tenantId,
          referenceId,
          tpInsc,
          nrInsc,
          tpAmb,
          additionalData,
        );
      case EsocialEventType.S_1210:
        return this.buildS1210(tpInsc, nrInsc, tpAmb, additionalData);
      case EsocialEventType.S_1298:
        return this.buildS1298(tpInsc, nrInsc, tpAmb, additionalData);
      case EsocialEventType.S_1299:
        return this.buildS1299(tpInsc, nrInsc, tpAmb, additionalData);

      // Non-periodic events
      case EsocialEventType.S_2190:
        return this.buildS2190(tenantId, referenceId, tpInsc, nrInsc, tpAmb);
      case EsocialEventType.S_2200:
        return this.buildS2200(tenantId, referenceId, tpInsc, nrInsc, tpAmb);
      case EsocialEventType.S_2205:
        return this.buildS2205(tenantId, referenceId, tpInsc, nrInsc, tpAmb);
      case EsocialEventType.S_2206:
        return this.buildS2206(tenantId, referenceId, tpInsc, nrInsc, tpAmb);
      case EsocialEventType.S_2210:
        return this.buildS2210(
          tenantId,
          referenceId,
          tpInsc,
          nrInsc,
          tpAmb,
          additionalData,
        );
      case EsocialEventType.S_2220:
        return this.buildS2220(tenantId, referenceId, tpInsc, nrInsc, tpAmb);
      case EsocialEventType.S_2230:
        return this.buildS2230(tenantId, referenceId, tpInsc, nrInsc, tpAmb);
      case EsocialEventType.S_2240:
        return this.buildS2240(
          tenantId,
          referenceId,
          tpInsc,
          nrInsc,
          tpAmb,
          additionalData,
        );
      case EsocialEventType.S_2298:
        return this.buildS2298(
          tenantId,
          referenceId,
          tpInsc,
          nrInsc,
          tpAmb,
          additionalData,
        );
      case EsocialEventType.S_2299:
        return this.buildS2299(tenantId, referenceId, tpInsc, nrInsc, tpAmb);
      case EsocialEventType.S_2300:
        return this.buildS2300(
          tenantId,
          referenceId,
          tpInsc,
          nrInsc,
          tpAmb,
          additionalData,
        );
      case EsocialEventType.S_2399:
        return this.buildS2399(
          tenantId,
          referenceId,
          tpInsc,
          nrInsc,
          tpAmb,
          additionalData,
        );

      // Exclusion event
      case EsocialEventType.S_3000:
        return this.buildS3000(
          tenantId,
          referenceId,
          tpInsc,
          nrInsc,
          tpAmb,
          additionalData,
        );

      default:
        throw new BadRequestError(`Tipo de evento não suportado: ${eventType}`);
    }
  }

  // ===========================================================================
  // TABLE EVENTS (S-1000 series)
  // ===========================================================================

  /**
   * S-1000 — Informações do Empregador.
   * Sources data from tenant eSocial config + additionalData.
   */
  private buildS1000(
    _tenantId: string,
    tpInsc: number,
    nrInsc: string,
    tpAmb: 1 | 2,
    additionalData?: Record<string, unknown>,
  ): string {
    return new S1000Builder().build({
      tpInsc,
      nrInsc,
      tpAmb,
      iniValid: (additionalData?.iniValid as string) ?? this.getCurrentPeriod(),
      fimValid: additionalData?.fimValid as string | undefined,
      nmRazao: (additionalData?.nmRazao as string) ?? 'Empregador',
      classTrib: (additionalData?.classTrib as string) ?? '01',
      natJurid: additionalData?.natJurid as string | undefined,
      indCoop: additionalData?.indCoop as number | undefined,
      indConstr: additionalData?.indConstr as number | undefined,
      indDesFolha: additionalData?.indDesFolha as number | undefined,
      indOptRegEletron: additionalData?.indOptRegEletron as number | undefined,
      cnaePrep: additionalData?.cnaePrep as string | undefined,
      contato: additionalData?.contato as
        | { fonePrinc: string; foneAlternat?: string; emailPrinc?: string }
        | undefined,
      softwareHouse: additionalData?.softwareHouse as
        | {
            cnpjSoftHouse: string;
            nmCont?: string;
            telefone?: string;
            email?: string;
          }
        | undefined,
    });
  }

  /**
   * S-1005 — Tabela de Estabelecimentos.
   * Sources data from additionalData (establishment info).
   */
  private buildS1005(
    tpInsc: number,
    nrInsc: string,
    tpAmb: 1 | 2,
    additionalData?: Record<string, unknown>,
  ): string {
    if (!additionalData?.nrInscEstab) {
      throw new BadRequestError(
        'Número de inscrição do estabelecimento é obrigatório para S-1005',
      );
    }
    if (!additionalData?.cnaePrep) {
      throw new BadRequestError('CNAE preponderante é obrigatório para S-1005');
    }
    if (!additionalData?.endereco) {
      throw new BadRequestError(
        'Endereço do estabelecimento é obrigatório para S-1005',
      );
    }

    return new S1005Builder().build({
      tpInsc,
      nrInsc,
      tpAmb,
      tpInscEstab: (additionalData.tpInscEstab as number) ?? 1,
      nrInscEstab: additionalData.nrInscEstab as string,
      iniValid: (additionalData.iniValid as string) ?? this.getCurrentPeriod(),
      fimValid: additionalData.fimValid as string | undefined,
      cnaePrep: additionalData.cnaePrep as string,
      endereco: additionalData.endereco as {
        dscLograd: string;
        nrLograd: string;
        cep: string;
        codMunic: string;
        uf: string;
        tpLograd?: string;
        complemento?: string;
        bairro?: string;
      },
      contato: additionalData.contato as
        | { fonePrinc?: string; emailPrinc?: string }
        | undefined,
      fap: additionalData.fap as number | undefined,
      aliqRat: additionalData.aliqRat as number | undefined,
    });
  }

  /**
   * S-1010 — Tabela de Rubricas.
   * Sources data from eSocial rubrica entity by referenceId.
   */
  private async buildS1010(
    tenantId: string,
    rubricaId: string,
    tpInsc: number,
    nrInsc: string,
    tpAmb: 1 | 2,
  ): Promise<string> {
    const rubrica = await this.rubricasRepository.findById(
      new UniqueEntityID(rubricaId),
      tenantId,
    );
    if (!rubrica) {
      throw new ResourceNotFoundError('Rubrica eSocial não encontrada');
    }

    return new S1010Builder().build({
      tpInsc,
      nrInsc,
      tpAmb,
      codRubr: rubrica.code,
      iniValid: this.getCurrentPeriod(),
      dscRubr: rubrica.description,
      natRubr: '1000', // Default nature — would come from rubrica mapping
      tpRubr: rubrica.type as 1 | 2 | 3,
      codIncCP: rubrica.incidInss ?? '00',
      codIncIRRF: rubrica.incidIrrf ?? '00',
      codIncFGTS: rubrica.incidFgts ?? '00',
    });
  }

  /**
   * S-1020 — Tabela de Lotações Tributárias.
   * Sources data from additionalData (tax allocation group info).
   */
  private buildS1020(
    tpInsc: number,
    nrInsc: string,
    tpAmb: 1 | 2,
    additionalData?: Record<string, unknown>,
  ): string {
    if (!additionalData?.codLotacao) {
      throw new BadRequestError(
        'Código da lotação tributária é obrigatório para S-1020',
      );
    }
    if (!additionalData?.fpas) {
      throw new BadRequestError('Código FPAS é obrigatório para S-1020');
    }

    return new S1020Builder().build({
      tpInsc,
      nrInsc,
      tpAmb,
      codLotacao: additionalData.codLotacao as string,
      iniValid: (additionalData.iniValid as string) ?? this.getCurrentPeriod(),
      fimValid: additionalData.fimValid as string | undefined,
      tpLotacao: (additionalData.tpLotacao as string) ?? '01',
      tpInscLot: additionalData.tpInscLot as number | undefined,
      nrInscLot: additionalData.nrInscLot as string | undefined,
      fpas: additionalData.fpas as string,
      codTercs: (additionalData.codTercs as string) ?? '0000',
      codTercsSusp: additionalData.codTercsSusp as string | undefined,
      nrProcJud: additionalData.nrProcJud as string | undefined,
      codTerc: additionalData.codTerc as string | undefined,
    });
  }

  /**
   * S-1070 — Tabela de Processos Administrativos/Judiciais.
   * Sources data from additionalData (process info).
   */
  private buildS1070(
    tpInsc: number,
    nrInsc: string,
    tpAmb: 1 | 2,
    additionalData?: Record<string, unknown>,
  ): string {
    if (!additionalData?.nrProc) {
      throw new BadRequestError('Número do processo é obrigatório para S-1070');
    }

    return new S1070Builder().build({
      tpInsc,
      nrInsc,
      tpAmb,
      tpProc: (additionalData.tpProc as 1 | 2) ?? 1,
      nrProc: additionalData.nrProc as string,
      iniValid: (additionalData.iniValid as string) ?? this.getCurrentPeriod(),
      fimValid: additionalData.fimValid as string | undefined,
      indAutoria: (additionalData.indAutoria as 1 | 2 | 3) ?? 1,
      indMatProc: (additionalData.indMatProc as string) ?? '01',
      observacao: additionalData.observacao as string | undefined,
      infoSusp: additionalData.infoSusp as
        | Array<{
            codSusp: string;
            indSusp: string;
            dtDecisao: Date | string;
            indDeposito?: 'S' | 'N';
          }>
        | undefined,
    });
  }

  // ===========================================================================
  // PERIODIC EVENTS (S-1200 series)
  // ===========================================================================

  /**
   * S-1200 — Remuneração do Trabalhador.
   * Sources data from payroll + payroll items + employee.
   * referenceId = payroll ID
   */
  private async buildS1200(
    tenantId: string,
    payrollId: string,
    tpInsc: number,
    nrInsc: string,
    tpAmb: 1 | 2,
    additionalData?: Record<string, unknown>,
  ): Promise<string> {
    const payroll = await this.payrollsRepository.findById(
      new UniqueEntityID(payrollId),
      tenantId,
    );
    if (!payroll) {
      throw new ResourceNotFoundError('Folha de pagamento não encontrada');
    }

    const employeeId = additionalData?.employeeId as string | undefined;
    if (!employeeId) {
      throw new BadRequestError(
        'ID do funcionário é obrigatório para geração de S-1200',
      );
    }

    const employee = await this.findEmployee(tenantId, employeeId);
    const payrollItems =
      await this.payrollItemsRepository.findManyByPayrollAndEmployee(
        new UniqueEntityID(payrollId),
        new UniqueEntityID(employeeId),
      );

    if (payrollItems.length === 0) {
      throw new BadRequestError(
        'Nenhum item de folha encontrado para este funcionário neste período',
      );
    }

    const perApur = payroll.referencePeriod;

    const itensRemun = payrollItems.map((payrollItem) => ({
      codRubr: payrollItem.type.value,
      ideTabRubr: '1',
      vrRubr: payrollItem.amount,
    }));

    return new S1200Builder().build({
      tpInsc,
      nrInsc,
      tpAmb,
      perApur,
      cpfTrab: employee.cpf.value,
      dmDev: [
        {
          ideDmDev: `DMV-${perApur}`,
          codCateg: 101, // Empregado Geral (CLT)
          infoPerApur: {
            ideEstabLot: [
              {
                tpInsc: tpInsc,
                nrInsc: nrInsc,
                codLotacao: (additionalData?.codLotacao as string) ?? '001',
                remunPerApur: [{ itensRemun }],
              },
            ],
          },
        },
      ],
    });
  }

  /**
   * S-1210 — Pagamentos de Rendimentos do Trabalho.
   * Sources data from additionalData (payment details).
   */
  private buildS1210(
    tpInsc: number,
    nrInsc: string,
    tpAmb: 1 | 2,
    additionalData?: Record<string, unknown>,
  ): string {
    if (!additionalData?.cpfBenef) {
      throw new BadRequestError(
        'CPF do beneficiário é obrigatório para S-1210',
      );
    }
    if (!additionalData?.perApur) {
      throw new BadRequestError(
        'Período de apuração é obrigatório para S-1210',
      );
    }
    if (!additionalData?.infoPgto) {
      throw new BadRequestError(
        'Informações de pagamento são obrigatórias para S-1210',
      );
    }

    return new S1210Builder().build({
      tpInsc,
      nrInsc,
      tpAmb,
      perApur: additionalData.perApur as string,
      ideBenef: {
        cpfBenef: additionalData.cpfBenef as string,
        deps: additionalData.deps as { vrDedDep: number } | undefined,
      },
      infoPgto: additionalData.infoPgto as Array<{
        dtPgto: Date | string;
        tpPgto: number;
        indResBr: 'S' | 'N';
        detPgtoFl?: Array<{
          perRef: string;
          ideDmDev: string;
          indPgtoTt?: 'S' | 'N';
          vrLiq: number;
        }>;
        detPgtoBenPr?: Array<{
          perRef: string;
          ideDmDev: string;
          vrLiq: number;
        }>;
      }>,
    });
  }

  /**
   * S-1298 — Reabertura dos Eventos Periódicos.
   * Only needs employer info and period.
   */
  private buildS1298(
    tpInsc: number,
    nrInsc: string,
    tpAmb: 1 | 2,
    additionalData?: Record<string, unknown>,
  ): string {
    if (!additionalData?.perApur) {
      throw new BadRequestError(
        'Período de apuração é obrigatório para S-1298',
      );
    }

    return new S1298Builder().build({
      tpInsc,
      nrInsc,
      tpAmb,
      perApur: additionalData.perApur as string,
    });
  }

  /**
   * S-1299 — Fechamento dos Eventos Periódicos.
   * Needs employer info, period, responsible person, and closure flags.
   */
  private buildS1299(
    tpInsc: number,
    nrInsc: string,
    tpAmb: 1 | 2,
    additionalData?: Record<string, unknown>,
  ): string {
    if (!additionalData?.perApur) {
      throw new BadRequestError(
        'Período de apuração é obrigatório para S-1299',
      );
    }
    if (!additionalData?.nmResp) {
      throw new BadRequestError(
        'Nome do responsável é obrigatório para S-1299',
      );
    }
    if (!additionalData?.cpfResp) {
      throw new BadRequestError('CPF do responsável é obrigatório para S-1299');
    }

    return new S1299Builder().build({
      tpInsc,
      nrInsc,
      tpAmb,
      perApur: additionalData.perApur as string,
      nmResp: additionalData.nmResp as string,
      cpfResp: additionalData.cpfResp as string,
      telefone: (additionalData.telefone as string) ?? '',
      email: (additionalData.email as string) ?? '',
      evtRemun: (additionalData.evtRemun as 'S' | 'N') ?? 'N',
      evtPgtos: (additionalData.evtPgtos as 'S' | 'N') ?? 'N',
      evtAqProd: (additionalData.evtAqProd as 'S' | 'N') ?? 'N',
      evtComProd: (additionalData.evtComProd as 'S' | 'N') ?? 'N',
      evtContratAvNP: (additionalData.evtContratAvNP as 'S' | 'N') ?? 'N',
      evtInfoComplPer: (additionalData.evtInfoComplPer as 'S' | 'N') ?? 'N',
      compSemMovto: additionalData.compSemMovto as string | undefined,
    });
  }

  // ===========================================================================
  // NON-PERIODIC EVENTS (S-2xxx series)
  // ===========================================================================

  private async buildS2190(
    tenantId: string,
    employeeId: string,
    tpInsc: number,
    nrInsc: string,
    tpAmb: 1 | 2,
  ): Promise<string> {
    const employee = await this.findEmployee(tenantId, employeeId);

    return new S2190Builder().build({
      tpInsc,
      nrInsc,
      tpAmb,
      cpfTrab: employee.cpf.value,
      dtNascto: employee.birthDate!,
      dtAdm: employee.hireDate,
    });
  }

  private async buildS2200(
    tenantId: string,
    employeeId: string,
    tpInsc: number,
    nrInsc: string,
    tpAmb: 1 | 2,
  ): Promise<string> {
    const employee = await this.findEmployee(tenantId, employeeId);
    const dependants = await this.dependantsRepository.findByEmployeeId(
      new UniqueEntityID(employeeId),
      tenantId,
    );

    const depMap: Record<string, string> = {
      SPOUSE: '01',
      CHILD: '03',
      STEPCHILD: '06',
      PARENT: '09',
      OTHER: '99',
    };

    const genderMap: Record<string, string> = {
      MALE: 'M',
      FEMALE: 'F',
      M: 'M',
      F: 'F',
    };

    const maritalMap: Record<string, number> = {
      SINGLE: 1,
      MARRIED: 2,
      DIVORCED: 3,
      SEPARATED: 4,
      WIDOWED: 5,
    };

    const contractMap: Record<string, number> = {
      CLT: 1,
      TEMPORARY: 2,
      INTERN: 2,
      APPRENTICE: 1,
      PJ: 1,
    };

    return new S2200Builder().build({
      tpInsc,
      nrInsc,
      tpAmb,
      cpfTrab: employee.cpf.value,
      nmTrab: employee.fullName,
      sexo: genderMap[employee.gender ?? 'M'] ?? 'M',
      racaCor: 1, // Default — would need employee.raceColor field
      estCiv: maritalMap[employee.maritalStatus ?? 'SINGLE'],
      nmSoc: employee.socialName,
      paisNac: 105,
      nascimento: {
        dtNascto: employee.birthDate!,
        paisNascto: 105,
        nmMunic: employee.city,
        uf: employee.state,
      },
      endereco: employee.address
        ? {
            dscLograd: employee.address,
            nrLograd: employee.addressNumber ?? 'S/N',
            complemento: employee.complement,
            bairro: employee.neighborhood,
            cep: employee.zipCode ?? '00000000',
            uf: employee.state ?? 'SP',
          }
        : undefined,
      dependentes: dependants.map((d) => ({
        tpDep: depMap[d.relationship] ?? '99',
        nmDep: d.name,
        dtNascDep: d.birthDate,
        cpfDep: d.cpf,
        depIRRF: d.isIrrfDependant ? ('S' as const) : ('N' as const),
        depSF: d.isSalarioFamilia ? ('S' as const) : ('N' as const),
      })),
      matricula: employee.registrationNumber,
      tpRegTrab: 1,
      tpRegPrev: 1,
      cadIni: 'S',
      celetista: {
        dtAdm: employee.hireDate,
        tpAdmissao: 1,
        indAdmissao: 1,
        natAtividade: 1,
      },
      contrato: {
        nmCargo: employee.fullName, // Simplified — would use position name
        CBOCargo: '000000', // Would come from position.cboCode
        vrSalFx: employee.baseSalary ?? 0,
        undSalFixo: 5,
        tpContr: contractMap[employee.contractType.value] ?? 1,
        qtdHrsSem: employee.weeklyHours,
        tpJornada: 7,
      },
    });
  }

  /**
   * S-2205 — Alteração de Dados Cadastrais do Trabalhador.
   * Sources data from employee entity (referenceId = employeeId).
   */
  private async buildS2205(
    tenantId: string,
    employeeId: string,
    tpInsc: number,
    nrInsc: string,
    tpAmb: 1 | 2,
  ): Promise<string> {
    const employee = await this.findEmployee(tenantId, employeeId);

    const genderMap: Record<string, string> = {
      MALE: 'M',
      FEMALE: 'F',
      M: 'M',
      F: 'F',
    };

    const maritalMap: Record<string, number> = {
      SINGLE: 1,
      MARRIED: 2,
      DIVORCED: 3,
      SEPARATED: 4,
      WIDOWED: 5,
    };

    return new S2205Builder().build({
      tpInsc,
      nrInsc,
      tpAmb,
      cpfTrab: employee.cpf.value,
      dtAlteracao: new Date(),
      nmTrab: employee.fullName,
      sexo: genderMap[employee.gender ?? 'M'] ?? 'M',
      racaCor: 1,
      estCiv: maritalMap[employee.maritalStatus ?? 'SINGLE'],
      nmSoc: employee.socialName,
      dtNascto: employee.birthDate!,
      endereco: employee.address
        ? {
            dscLograd: employee.address,
            nrLograd: employee.addressNumber ?? 'S/N',
            complemento: employee.complement,
            bairro: employee.neighborhood,
            cep: employee.zipCode ?? '00000000',
            uf: employee.state ?? 'SP',
          }
        : undefined,
    });
  }

  private async buildS2206(
    tenantId: string,
    employeeId: string,
    tpInsc: number,
    nrInsc: string,
    tpAmb: 1 | 2,
  ): Promise<string> {
    const employee = await this.findEmployee(tenantId, employeeId);

    const contractMap: Record<string, number> = {
      CLT: 1,
      TEMPORARY: 2,
      INTERN: 2,
      APPRENTICE: 1,
      PJ: 1,
    };

    return new S2206Builder().build({
      tpInsc,
      nrInsc,
      tpAmb,
      cpfTrab: employee.cpf.value,
      matricula: employee.registrationNumber,
      dtAlteracao: new Date(),
      nmCargo: employee.fullName,
      CBOCargo: '000000',
      vrSalFx: employee.baseSalary ?? 0,
      undSalFixo: 5,
      tpContr: contractMap[employee.contractType.value] ?? 1,
      qtdHrsSem: employee.weeklyHours,
      tpJornada: 7,
    });
  }

  /**
   * S-2210 — Comunicação de Acidente de Trabalho (CAT).
   * Sources employee data from referenceId = employeeId.
   * Accident details come from additionalData.
   */
  private async buildS2210(
    tenantId: string,
    employeeId: string,
    tpInsc: number,
    nrInsc: string,
    tpAmb: 1 | 2,
    additionalData?: Record<string, unknown>,
  ): Promise<string> {
    const employee = await this.findEmployee(tenantId, employeeId);

    if (!additionalData?.dtAcid) {
      throw new BadRequestError('Data do acidente é obrigatória para S-2210');
    }
    if (!additionalData?.codSitGeradora) {
      throw new BadRequestError(
        'Código da situação geradora é obrigatório para S-2210',
      );
    }
    if (!additionalData?.codCID) {
      throw new BadRequestError('CID-10 é obrigatório para S-2210');
    }
    if (!additionalData?.parteAtingida) {
      throw new BadRequestError('Parte atingida é obrigatória para S-2210');
    }
    if (!additionalData?.agenteCausador) {
      throw new BadRequestError('Agente causador é obrigatório para S-2210');
    }

    return new S2210Builder().build({
      tpInsc,
      nrInsc,
      tpAmb,
      cpfTrab: employee.cpf.value,
      matricula: employee.registrationNumber,
      dtAcid: additionalData.dtAcid as Date | string,
      hrAcid: additionalData.hrAcid as string | undefined,
      tpAcid: (additionalData.tpAcid as number) ?? 1,
      tpCat: (additionalData.tpCat as number) ?? 1,
      codSitGeradora: additionalData.codSitGeradora as string,
      codCID: additionalData.codCID as string,
      parteAtingida: additionalData.parteAtingida as {
        codParteAting: string;
        lateralidade: number;
      },
      agenteCausador: additionalData.agenteCausador as {
        codAgntCausador: string;
      },
      ideLocalAcid: additionalData.ideLocalAcid as
        | {
            tpLocal: number;
            dscLocal?: string;
            dscLograd?: string;
            nrLograd?: string;
            bairro?: string;
            cep?: string;
            codMunic?: string;
            uf?: string;
            pais?: number;
            cnpjLocalAcid?: string;
          }
        | undefined,
      atestado: additionalData.atestado as
        | {
            dtAtend: Date | string;
            hrAtend?: string;
            indInternacao: 'S' | 'N';
            durTrat?: number;
            indAfast: 'S' | 'N';
            dscLesao?: string;
            codCID: string;
            nmMedico: string;
            nrCRM: string;
            ufCRM: string;
          }
        | undefined,
    });
  }

  /**
   * S-2220 — Monitoramento da Saúde do Trabalhador (ASO).
   * Sources data from medical exam entity (referenceId = medicalExamId).
   */
  private async buildS2220(
    tenantId: string,
    medicalExamId: string,
    tpInsc: number,
    nrInsc: string,
    tpAmb: 1 | 2,
  ): Promise<string> {
    const medicalExam = await this.medicalExamsRepository.findById(
      new UniqueEntityID(medicalExamId),
      tenantId,
    );
    if (!medicalExam) {
      throw new ResourceNotFoundError('Exame médico não encontrado');
    }

    const employee = await this.findEmployee(
      tenantId,
      medicalExam.employeeId.toString(),
    );

    const tpAso = MEDICAL_EXAM_TYPE_TO_ASO[medicalExam.type] ?? 1;
    const resAso = MEDICAL_EXAM_RESULT_TO_ESOCIAL[medicalExam.result] ?? 1;

    // Extract CRM UF (last 2 chars if CRM contains UF, else default SP)
    const crmParts = medicalExam.doctorCrm.split('/');
    const nrCRM = crmParts[0] ?? medicalExam.doctorCrm;
    const ufCRM = crmParts[1] ?? 'SP';

    return new S2220Builder().build({
      tpInsc,
      nrInsc,
      tpAmb,
      cpfTrab: employee.cpf.value,
      matricula: employee.registrationNumber,
      tpAso,
      dtAso: medicalExam.examDate,
      resAso,
      exames: [
        {
          dtExam: medicalExam.examDate,
          procRealizado: '0211060100', // Consulta médica em saúde do trabalhador
          ordExame: 1,
          indResult: resAso === 1 ? 1 : 2,
        },
      ],
      medico: {
        nmMedico: medicalExam.doctorName,
        nrCRM,
        ufCRM,
      },
    });
  }

  private async buildS2230(
    tenantId: string,
    absenceId: string,
    tpInsc: number,
    nrInsc: string,
    tpAmb: 1 | 2,
  ): Promise<string> {
    const absence = await this.absencesRepository.findById(
      new UniqueEntityID(absenceId),
      tenantId,
    );
    if (!absence) {
      throw new ResourceNotFoundError('Ausência não encontrada');
    }

    const employee = await this.findEmployee(
      tenantId,
      absence.employeeId.toString(),
    );

    const motivo = ABSENCE_TYPE_TO_ESOCIAL_MOTIVO[absence.type.value];
    if (!motivo) {
      throw new BadRequestError(
        `Tipo de ausência "${absence.type.value}" não gera evento S-2230`,
      );
    }

    return new S2230Builder().build({
      tpInsc,
      nrInsc,
      tpAmb,
      cpfTrab: employee.cpf.value,
      matricula: employee.registrationNumber,
      dtIniAfast: absence.startDate,
      codMotAfast: motivo,
      dtTermAfast: absence.endDate,
      codCID: absence.cid,
    });
  }

  /**
   * S-2240 — Condições Ambientais do Trabalho.
   * Sources employee data from referenceId = employeeId.
   * Environmental details come from additionalData.
   */
  private async buildS2240(
    tenantId: string,
    employeeId: string,
    tpInsc: number,
    nrInsc: string,
    tpAmb: 1 | 2,
    additionalData?: Record<string, unknown>,
  ): Promise<string> {
    const employee = await this.findEmployee(tenantId, employeeId);

    if (!additionalData?.infoAmb) {
      throw new BadRequestError(
        'Informações do ambiente são obrigatórias para S-2240',
      );
    }
    if (!additionalData?.fatRisco) {
      throw new BadRequestError(
        'Fatores de risco são obrigatórios para S-2240',
      );
    }

    return new S2240Builder().build({
      tpInsc,
      nrInsc,
      tpAmb,
      cpfTrab: employee.cpf.value,
      matricula: employee.registrationNumber,
      dtIniCondicao:
        (additionalData.dtIniCondicao as Date | string) ?? new Date(),
      infoAmb: additionalData.infoAmb as {
        codAmb: string;
        dscSetor?: string;
        tpInsc?: number;
        nrInsc?: string;
      },
      fatRisco: additionalData.fatRisco as Array<{
        codFatRis: string;
        dscFatRis?: string;
        tpAval?: number;
        intConc?: number;
        limTol?: number;
        unMed?: number;
        tecMedicao?: string;
        insalubridade?: string;
        periculosidade?: string;
        aposentEsp?: number;
      }>,
      epc: additionalData.epc as
        | { utilizEPC: string; dscEpc?: string; eficEpc?: string }
        | undefined,
      epi: additionalData.epi as
        | {
            utilizEPI: string;
            dscEpi?: string;
            eficEpi?: string;
            caEPI?: string;
          }
        | undefined,
      respReg: additionalData.respReg as
        | {
            nmResp: string;
            nrCRM?: string;
            ufCRM?: string;
            cpfResp?: string;
          }
        | undefined,
    });
  }

  /**
   * S-2298 — Reintegração / Outros Provimentos.
   * Sources employee data from referenceId = employeeId.
   * Reintegration details come from additionalData.
   */
  private async buildS2298(
    tenantId: string,
    employeeId: string,
    tpInsc: number,
    nrInsc: string,
    tpAmb: 1 | 2,
    additionalData?: Record<string, unknown>,
  ): Promise<string> {
    const employee = await this.findEmployee(tenantId, employeeId);

    if (!additionalData?.dtReint) {
      throw new BadRequestError(
        'Data da reintegração é obrigatória para S-2298',
      );
    }

    return new S2298Builder().build({
      tpInsc,
      nrInsc,
      tpAmb,
      cpfTrab: employee.cpf.value,
      matricula: employee.registrationNumber,
      tpReint: (additionalData.tpReint as number) ?? 1,
      nrProcJud: additionalData.nrProcJud as string | undefined,
      dtReint: additionalData.dtReint as Date | string,
      dtEfetRetorno: additionalData.dtEfetRetorno as Date | string | undefined,
    });
  }

  private async buildS2299(
    tenantId: string,
    terminationId: string,
    tpInsc: number,
    nrInsc: string,
    tpAmb: 1 | 2,
  ): Promise<string> {
    const termination = await this.terminationsRepository.findById(
      new UniqueEntityID(terminationId),
      tenantId,
    );
    if (!termination) {
      throw new ResourceNotFoundError('Rescisão não encontrada');
    }

    const employee = await this.findEmployee(
      tenantId,
      termination.employeeId.toString(),
    );

    const mtvDeslig =
      TERMINATION_TYPE_TO_ESOCIAL_MOTIVO[termination.type] ?? '99';

    return new S2299Builder().build({
      tpInsc,
      nrInsc,
      tpAmb,
      cpfTrab: employee.cpf.value,
      matricula: employee.registrationNumber,
      mtvDeslig,
      dtDeslig: termination.terminationDate,
    });
  }

  /**
   * S-2300 — Trabalhador Sem Vínculo de Emprego (Início).
   * Sources employee data from referenceId = employeeId.
   * TSV-specific details come from additionalData.
   */
  private async buildS2300(
    tenantId: string,
    employeeId: string,
    tpInsc: number,
    nrInsc: string,
    tpAmb: 1 | 2,
    additionalData?: Record<string, unknown>,
  ): Promise<string> {
    const employee = await this.findEmployee(tenantId, employeeId);

    const genderMap: Record<string, string> = {
      MALE: 'M',
      FEMALE: 'F',
      M: 'M',
      F: 'F',
    };

    const maritalMap: Record<string, number> = {
      SINGLE: 1,
      MARRIED: 2,
      DIVORCED: 3,
      SEPARATED: 4,
      WIDOWED: 5,
    };

    const dependants = await this.dependantsRepository.findByEmployeeId(
      new UniqueEntityID(employeeId),
      tenantId,
    );

    const depMap: Record<string, string> = {
      SPOUSE: '01',
      CHILD: '03',
      STEPCHILD: '06',
      PARENT: '09',
      OTHER: '99',
    };

    return new S2300Builder().build({
      tpInsc,
      nrInsc,
      tpAmb,
      cpfTrab: employee.cpf.value,
      nmTrab: employee.fullName,
      sexo: genderMap[employee.gender ?? 'M'] ?? 'M',
      racaCor: 1,
      estCiv: maritalMap[employee.maritalStatus ?? 'SINGLE'],
      dtNascto: employee.birthDate!,
      endereco: employee.address
        ? {
            dscLograd: employee.address,
            nrLograd: employee.addressNumber ?? 'S/N',
            complemento: employee.complement,
            bairro: employee.neighborhood,
            cep: employee.zipCode ?? '00000000',
            uf: employee.state ?? 'SP',
          }
        : undefined,
      dependentes: dependants.map((d) => ({
        tpDep: depMap[d.relationship] ?? '99',
        nmDep: d.name,
        dtNascDep: d.birthDate,
        cpfDep: d.cpf,
        depIRRF: d.isIrrfDependant ? ('S' as const) : ('N' as const),
        depSF: d.isSalarioFamilia ? ('S' as const) : ('N' as const),
      })),
      codCateg: (additionalData?.codCateg as number) ?? 721,
      dtInicio:
        (additionalData?.dtInicio as Date | string) ?? employee.hireDate,
      natAtividade: additionalData?.natAtividade as number | undefined,
      nmCargo: additionalData?.nmCargo as string | undefined,
      CBOCargo: additionalData?.CBOCargo as string | undefined,
      vrSalFx: employee.baseSalary,
      undSalFixo: 5,
    });
  }

  /**
   * S-2399 — Trabalhador Sem Vínculo de Emprego (Término).
   * Sources employee data from referenceId = employeeId.
   * Termination details come from additionalData.
   */
  private async buildS2399(
    tenantId: string,
    employeeId: string,
    tpInsc: number,
    nrInsc: string,
    tpAmb: 1 | 2,
    additionalData?: Record<string, unknown>,
  ): Promise<string> {
    const employee = await this.findEmployee(tenantId, employeeId);

    if (!additionalData?.dtTerm) {
      throw new BadRequestError('Data de término é obrigatória para S-2399');
    }

    return new S2399Builder().build({
      tpInsc,
      nrInsc,
      tpAmb,
      cpfTrab: employee.cpf.value,
      matricula: employee.registrationNumber,
      codCateg: (additionalData.codCateg as number) ?? 721,
      dtTerm: additionalData.dtTerm as Date | string,
      mtvDesligTSV: additionalData.mtvDesligTSV as string | undefined,
    });
  }

  // ===========================================================================
  // EXCLUSION EVENT (S-3000)
  // ===========================================================================

  /**
   * S-3000 — Exclusão de Eventos.
   * Sources data from the event being excluded (referenceId = eventId).
   */
  private async buildS3000(
    tenantId: string,
    eventId: string,
    tpInsc: number,
    nrInsc: string,
    tpAmb: 1 | 2,
    additionalData?: Record<string, unknown>,
  ): Promise<string> {
    if (!additionalData?.nrRecEvt) {
      throw new BadRequestError(
        'Número do recibo do evento a excluir é obrigatório para S-3000',
      );
    }
    if (!additionalData?.tpEvento) {
      throw new BadRequestError(
        'Tipo do evento a excluir é obrigatório para S-3000',
      );
    }

    return new S3000Builder().build({
      tpInsc,
      nrInsc,
      tpAmb,
      tpEvento: additionalData.tpEvento as string,
      nrRecEvt: additionalData.nrRecEvt as string,
      cpfTrab: additionalData.cpfTrab as string | undefined,
      perApur: additionalData.perApur as string | undefined,
    });
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  private async findEmployee(tenantId: string, employeeId: string) {
    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );
    if (!employee) {
      throw new ResourceNotFoundError('Funcionário não encontrado');
    }
    if (!employee.cpf) {
      throw new BadRequestError(
        'CPF do funcionário é obrigatório para eventos eSocial',
      );
    }
    return employee;
  }

  /**
   * Returns current period in YYYY-MM format.
   */
  private getCurrentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}
