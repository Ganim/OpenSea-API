import {
  type EsocialEventParser,
  extractTag,
  extractTagAsNumber,
  extractAllGroups,
  extractGroup,
} from './base-parser';

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export interface S5012InfoIRCR {
  /** Código de receita do IRRF */
  codCR: string;
  /** Valor da receita */
  vrCR: number;
}

export interface S5012InfoIR {
  /** Número de inscrição do estabelecimento */
  nrInscEstab: string;
  /** Valor da base de cálculo do IRRF */
  vrBcIRRF: number;
  /** Valor do IRRF */
  vrIRRF: number;
  /** Itens de código de receita */
  infoIRCR: S5012InfoIRCR[];
}

export interface S5012Output {
  /** Período de apuração (YYYY-MM) */
  perApur: string;
  /** Informações consolidadas de IRRF */
  infoIR: S5012InfoIR[];
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * Parser for eSocial event S-5012 — IRRF Consolidado.
 *
 * Totalizador event that consolidates income tax withholding for the
 * employer across all workers in a given competency period.
 */
export class S5012Parser implements EsocialEventParser<S5012Output> {
  readonly eventType = 'S-5012';

  parse(xml: string): S5012Output {
    const perApur = extractTag(xml, 'perApur') ?? '';
    const infoIR = this.parseInfoIRList(xml);

    return { perApur, infoIR };
  }

  private parseInfoIRList(xml: string): S5012InfoIR[] {
    const groups = extractAllGroups(xml, 'infoIR');
    return groups.map((groupXml) => this.parseInfoIR(groupXml));
  }

  private parseInfoIR(groupXml: string): S5012InfoIR {
    return {
      nrInscEstab: extractTag(groupXml, 'nrInscEstab') ?? '',
      vrBcIRRF: extractTagAsNumber(groupXml, 'vrBcIRRF') ?? 0,
      vrIRRF: extractTagAsNumber(groupXml, 'vrIRRF') ?? 0,
      infoIRCR: this.parseInfoIRCRList(groupXml),
    };
  }

  private parseInfoIRCRList(xml: string): S5012InfoIRCR[] {
    const groups = extractAllGroups(xml, 'infoIRCR');
    return groups.map((groupXml) => ({
      codCR: extractTag(groupXml, 'codCR') ?? '',
      vrCR: extractTagAsNumber(groupXml, 'vrCR') ?? 0,
    }));
  }
}
