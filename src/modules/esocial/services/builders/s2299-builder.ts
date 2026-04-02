import { EsocialXmlBuilder } from './base-builder';
import { TerminationType } from '@/entities/hr/termination';

/**
 * Maps OpenSea TerminationType to eSocial Tabela 19 — Motivo de Desligamento.
 */
export const TERMINATION_TYPE_TO_ESOCIAL_MOTIVO: Record<
  TerminationType,
  string
> = {
  [TerminationType.JUSTA_CAUSA]: '01',
  [TerminationType.SEM_JUSTA_CAUSA]: '02',
  [TerminationType.PEDIDO_DEMISSAO]: '03',
  [TerminationType.CONTRATO_TEMPORARIO]: '04',
  [TerminationType.RESCISAO_INDIRETA]: '07',
  [TerminationType.FALECIMENTO]: '10',
  [TerminationType.ACORDO_MUTUO]: '33',
};

/**
 * A single line item in the termination pay breakdown (verba rescisoria).
 * Each item maps to an eSocial rubrica.
 */
export interface S2299Rubrica {
  /** Rubrica code (employer-defined) */
  codRubr: string;
  /** Rubrica table ID (default "1") */
  ideTabRubr?: string;
  /** 1 = Provento, 2 = Desconto, 3 = Informativa */
  tpRubr: number;
  /** Rubrica nature code (Tabela 3) */
  natRubr: string;
  /** Quantity (for hour-based rubricas) */
  qtdRubr?: number;
  /** Factor (multiplier) */
  fatorRubr?: number;
  /** Value */
  vrRubr: number;
}

/**
 * Input data for the S-2299 event (Desligamento).
 */
export interface S2299Input {
  indRetif?: 1 | 2;
  tpAmb?: 1 | 2;
  nrRecibo?: string;

  // ideEmpregador
  tpInsc: number;
  nrInsc: string;

  // ideVinculo
  cpfTrab: string;
  matricula: string;

  // infoDeslig
  /** eSocial Tabela 19 — Motivo de Desligamento */
  mtvDeslig: string;
  dtDeslig: Date | string;
  /** 1 = Trabalhado, 2 = Indenizado, 3 = Dispensado */
  indPagtoAPI?: number;
  /** Last day of notice period, if applicable */
  dtProjFimAPI?: Date | string;
  /** Whether FGTS penalty applies — S or N */
  pensAlim?: string;
  /** Percentage of FGTS penalty (40% or 20% for acordo) */
  percAliment?: number;

  // Verbas rescisorias (optional — may be empty if not yet calculated)
  rubricas?: S2299Rubrica[];
}

/**
 * Builder for eSocial event S-2299 — Desligamento.
 *
 * Reported when an employee's employment bond ends (termination, resignation,
 * mutual agreement, death, etc.). Includes termination pay (verbas rescisorias).
 */
export class S2299Builder extends EsocialXmlBuilder<S2299Input> {
  protected eventType = 'S-2299';
  protected version = 'vS_01_02_00';

  build(input: S2299Input): string {
    const indRetif = input.indRetif ?? 1;
    const tpAmb = input.tpAmb ?? 2;
    const eventId = this.generateEventId(input.tpInsc, input.nrInsc);

    const ideEvento = this.buildIdeEvento(indRetif, tpAmb, input.nrRecibo);
    const ideEmpregador = this.buildIdeEmpregador(input.tpInsc, input.nrInsc);
    const ideVinculo = this.buildIdeVinculo(input);
    const infoDeslig = this.buildInfoDeslig(input);

    const evtContent = ideEvento + ideEmpregador + ideVinculo + infoDeslig;
    const evtDeslig = `<evtDeslig Id="${eventId}">${evtContent}</evtDeslig>`;

    const xmlns = `http://www.esocial.gov.br/schema/evt/evtDeslig/${this.version}`;
    return `${this.xmlHeader()}<eSocial xmlns="${xmlns}">${evtDeslig}</eSocial>`;
  }

  private buildIdeVinculo(input: S2299Input): string {
    let content = '';
    content += this.tag('cpfTrab', this.formatCPF(input.cpfTrab));
    content += this.tag('matricula', input.matricula);
    return this.tagGroup('ideVinculo', content);
  }

  private buildInfoDeslig(input: S2299Input): string {
    let content = '';

    content += this.tag('mtvDeslig', input.mtvDeslig);
    content += this.tag('dtDeslig', this.formatDate(input.dtDeslig));

    if (input.indPagtoAPI !== undefined)
      content += this.tag('indPagtoAPI', input.indPagtoAPI);
    if (input.dtProjFimAPI)
      content += this.tag('dtProjFimAPI', this.formatDate(input.dtProjFimAPI));
    if (input.pensAlim) content += this.tag('pensAlim', input.pensAlim);
    if (input.percAliment !== undefined)
      content += this.tag('percAliment', this.formatMoney(input.percAliment));

    // verbasResc > dmDev > infoPerApur > ideEstabLot > detVerbas
    if (input.rubricas && input.rubricas.length > 0) {
      content += this.buildVerbasResc(input.rubricas, input.nrInsc);
    }

    return this.tagGroup('infoDeslig', content);
  }

  private buildVerbasResc(rubricas: S2299Rubrica[], nrInsc: string): string {
    // Build individual rubrica tags
    let detVerbasContent = '';
    for (const r of rubricas) {
      let rContent = '';
      rContent += this.tag('codRubr', r.codRubr);
      rContent += this.tag('ideTabRubr', r.ideTabRubr ?? '1');
      if (r.qtdRubr !== undefined)
        rContent += this.tag('qtdRubr', this.formatMoney(r.qtdRubr));
      if (r.fatorRubr !== undefined)
        rContent += this.tag('fatorRubr', this.formatMoney(r.fatorRubr));
      rContent += this.tag('vrRubr', this.formatMoney(r.vrRubr));
      detVerbasContent += this.tagGroup('detVerbas', rContent);
    }

    // Wrap in the required hierarchy
    let ideEstabLotContent = '';
    ideEstabLotContent += this.tag('tpInsc', 1);
    ideEstabLotContent += this.tag('nrInsc', this.formatCNPJ(nrInsc));
    ideEstabLotContent += detVerbasContent;
    const ideEstabLot = this.tagGroup('ideEstabLot', ideEstabLotContent);

    const infoPerApur = this.tagGroup('infoPerApur', ideEstabLot);
    const dmDev = this.tagGroup(
      'dmDev',
      this.tag('ideDmDev', '1') + infoPerApur,
    );
    return this.tagGroup('verbasResc', dmDev);
  }

  // ---------------------------------------------------------------------------
  // Static helpers
  // ---------------------------------------------------------------------------

  /**
   * Convert an OpenSea TerminationType to the eSocial motivo code.
   */
  static getEsocialMotivo(type: TerminationType): string {
    return TERMINATION_TYPE_TO_ESOCIAL_MOTIVO[type];
  }
}
