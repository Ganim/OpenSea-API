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

export interface S5001InfoCpCalc {
  /** Valor da contribuição previdenciária do segurado */
  vrCpSeg: number;
  /** Valor da contribuição descontada do segurado destinada ao SEST */
  vrDescSest: number;
  /** Valor da contribuição descontada do segurado destinada ao SENAT */
  vrDescSenat: number;
  /** Valor do salário-família */
  vrSalFam: number;
}

export interface S5001InfoBaseCS {
  /** Indicativo de tipo de valor (1=Base, 2=Valor) */
  ind13: number | null;
  /** Tipo de valor (código da tabela de incidência) */
  tpValor: number;
  /** Valor da base de cálculo da contribuição social */
  valor: number;
}

export interface S5001InfoCategInc {
  /** Matrícula do empregado */
  matricula: string | null;
  /** Código da categoria do trabalhador */
  codCateg: number;
  /** Indicativo de múltiplos vínculos (S/N) */
  indSimples: string | null;
  /** Bases de cálculo de contribuição social */
  infoBaseCS: S5001InfoBaseCS[];
}

export interface S5001IdeEstabLot {
  /** Tipo de inscrição do estabelecimento */
  tpInsc: number;
  /** Número de inscrição do estabelecimento */
  nrInsc: string;
  /** Código da lotação tributária */
  codLotacao: string;
  /** Informações por categoria e incidência */
  infoCategInc: S5001InfoCategInc[];
}

export interface S5001Output {
  /** CPF do trabalhador */
  cpfTrab: string;
  /** Informações do cálculo das contribuições */
  infoCpCalc: S5001InfoCpCalc;
  /** Informações das contribuições por estabelecimento/lotação */
  ideEstabLot: S5001IdeEstabLot[];
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * Parser for eSocial event S-5001 — Informações das Contribuições Sociais
 * Consolidadas por Trabalhador.
 *
 * This is a totalizador event returned by the government after processing
 * periodic events (S-1200, S-1210, etc.). It consolidates social security
 * contributions per worker.
 */
export class S5001Parser implements EsocialEventParser<S5001Output> {
  readonly eventType = 'S-5001';

  parse(xml: string): S5001Output {
    const cpfTrab = extractTag(xml, 'cpfTrab') ?? '';
    const infoCpCalc = this.parseInfoCpCalc(xml);
    const ideEstabLot = this.parseIdeEstabLotList(xml);

    return { cpfTrab, infoCpCalc, ideEstabLot };
  }

  private parseInfoCpCalc(xml: string): S5001InfoCpCalc {
    const group = extractGroup(xml, 'infoCpCalc') ?? '';

    return {
      vrCpSeg: extractTagAsNumber(group, 'vrCpSeg') ?? 0,
      vrDescSest: extractTagAsNumber(group, 'vrDescSest') ?? 0,
      vrDescSenat: extractTagAsNumber(group, 'vrDescSenat') ?? 0,
      vrSalFam: extractTagAsNumber(group, 'vrSalFam') ?? 0,
    };
  }

  private parseIdeEstabLotList(xml: string): S5001IdeEstabLot[] {
    const groups = extractAllGroups(xml, 'ideEstabLot');
    return groups.map((groupXml) => this.parseIdeEstabLot(groupXml));
  }

  private parseIdeEstabLot(groupXml: string): S5001IdeEstabLot {
    return {
      tpInsc: extractTagAsNumber(groupXml, 'tpInsc') ?? 1,
      nrInsc: extractTag(groupXml, 'nrInsc') ?? '',
      codLotacao: extractTag(groupXml, 'codLotacao') ?? '',
      infoCategInc: this.parseInfoCategIncList(groupXml),
    };
  }

  private parseInfoCategIncList(xml: string): S5001InfoCategInc[] {
    const groups = extractAllGroups(xml, 'infoCategInc');
    return groups.map((groupXml) => this.parseInfoCategInc(groupXml));
  }

  private parseInfoCategInc(groupXml: string): S5001InfoCategInc {
    return {
      matricula: extractTag(groupXml, 'matricula'),
      codCateg: extractTagAsNumber(groupXml, 'codCateg') ?? 0,
      indSimples: extractTag(groupXml, 'indSimples'),
      infoBaseCS: this.parseInfoBaseCSList(groupXml),
    };
  }

  private parseInfoBaseCSList(xml: string): S5001InfoBaseCS[] {
    const groups = extractAllGroups(xml, 'infoBaseCS');
    return groups.map((groupXml) => ({
      ind13: extractTagAsNumber(groupXml, 'ind13'),
      tpValor: extractTagAsNumber(groupXml, 'tpValor') ?? 0,
      valor: extractTagAsNumber(groupXml, 'valor') ?? 0,
    }));
  }
}
