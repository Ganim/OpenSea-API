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

export interface S5013InfoTrabFGTS {
  /** Matrícula do trabalhador */
  matricula: string | null;
  /** CPF do trabalhador */
  cpfTrab: string;
  /** Valor do FGTS do trabalhador */
  vrFGTS: number;
  /** Valor do FGTS 13o do trabalhador */
  vrFGTS13: number;
}

export interface S5013InfoTotEstab {
  /** Tipo de inscrição do estabelecimento */
  tpInsc: number;
  /** Número de inscrição do estabelecimento (CNPJ) */
  cnpjEstab: string;
  /** Valor total do FGTS do estabelecimento */
  vrFGTSEstab: number;
  /** Informações por trabalhador */
  infoTrabFGTS: S5013InfoTrabFGTS[];
}

export interface S5013InfoDpsFGTS {
  /** Indicativo de per/ref */
  perApur: string;
  /** Informações por estabelecimento */
  infoTotEstab: S5013InfoTotEstab[];
}

export interface S5013Output {
  /** Período de apuração (YYYY-MM) */
  perApur: string;
  /** Informações de depósitos do FGTS */
  infoDpsFGTS: S5013InfoDpsFGTS | null;
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * Parser for eSocial event S-5013 — FGTS Consolidado.
 *
 * Totalizador event that consolidates FGTS (severance fund) data for the
 * employer across all workers in a given competency period.
 */
export class S5013Parser implements EsocialEventParser<S5013Output> {
  readonly eventType = 'S-5013';

  parse(xml: string): S5013Output {
    const perApur = extractTag(xml, 'perApur') ?? '';
    const infoDpsFGTS = this.parseInfoDpsFGTS(xml);

    return { perApur, infoDpsFGTS };
  }

  private parseInfoDpsFGTS(xml: string): S5013InfoDpsFGTS | null {
    const group = extractGroup(xml, 'infoDpsFGTS');
    if (!group) return null;

    return {
      perApur: extractTag(group, 'perApur') ?? '',
      infoTotEstab: this.parseInfoTotEstabList(group),
    };
  }

  private parseInfoTotEstabList(xml: string): S5013InfoTotEstab[] {
    const groups = extractAllGroups(xml, 'infoTotEstab');
    return groups.map((groupXml) => this.parseInfoTotEstab(groupXml));
  }

  private parseInfoTotEstab(groupXml: string): S5013InfoTotEstab {
    return {
      tpInsc: extractTagAsNumber(groupXml, 'tpInsc') ?? 1,
      cnpjEstab: extractTag(groupXml, 'cnpjEstab') ?? '',
      vrFGTSEstab: extractTagAsNumber(groupXml, 'vrFGTSEstab') ?? 0,
      infoTrabFGTS: this.parseInfoTrabFGTSList(groupXml),
    };
  }

  private parseInfoTrabFGTSList(xml: string): S5013InfoTrabFGTS[] {
    const groups = extractAllGroups(xml, 'infoTrabFGTS');
    return groups.map((groupXml) => ({
      matricula: extractTag(groupXml, 'matricula'),
      cpfTrab: extractTag(groupXml, 'cpfTrab') ?? '',
      vrFGTS: extractTagAsNumber(groupXml, 'vrFGTS') ?? 0,
      vrFGTS13: extractTagAsNumber(groupXml, 'vrFGTS13') ?? 0,
    }));
  }
}
