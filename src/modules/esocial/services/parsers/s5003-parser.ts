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

export interface S5003InfoBasePerApur {
  /** Tipo de valor do FGTS */
  tpValor: number;
  /** Valor da base do FGTS */
  vrBcFGTS: number;
  /** Valor da base do FGTS 13o salário */
  vrBcFGTS13: number;
}

export interface S5003InfoFGTSEstab {
  /** Tipo de inscrição do estabelecimento */
  tpInsc: number;
  /** Número de inscrição do estabelecimento */
  nrInsc: string;
  /** Código da lotação tributária */
  codLotacao: string;
  /** Código da categoria do trabalhador */
  codCateg: number;
  /** Data de admissão */
  dtAdm: string | null;
  /** Bases FGTS do período de apuração */
  infoBasePerApur: S5003InfoBasePerApur[];
}

export interface S5003InfoFGTS {
  /** Data de vencimento */
  dtVenc: string | null;
  /** Informações do FGTS por estabelecimento */
  infoFGTSEstab: S5003InfoFGTSEstab[];
}

export interface S5003Output {
  /** CPF do trabalhador */
  cpfTrab: string;
  /** Informações do FGTS */
  infoFGTS: S5003InfoFGTS | null;
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * Parser for eSocial event S-5003 — Informações do FGTS por Trabalhador.
 *
 * Totalizador event that consolidates FGTS (severance fund) data per worker
 * after government processing of periodic events.
 */
export class S5003Parser implements EsocialEventParser<S5003Output> {
  readonly eventType = 'S-5003';

  parse(xml: string): S5003Output {
    const cpfTrab = extractTag(xml, 'cpfTrab') ?? '';
    const infoFGTS = this.parseInfoFGTS(xml);

    return { cpfTrab, infoFGTS };
  }

  private parseInfoFGTS(xml: string): S5003InfoFGTS | null {
    const group = extractGroup(xml, 'infoFGTS');
    if (!group) return null;

    return {
      dtVenc: extractTag(group, 'dtVenc'),
      infoFGTSEstab: this.parseInfoFGTSEstabList(group),
    };
  }

  private parseInfoFGTSEstabList(xml: string): S5003InfoFGTSEstab[] {
    const groups = extractAllGroups(xml, 'infoFGTSEstab');
    return groups.map((groupXml) => this.parseInfoFGTSEstab(groupXml));
  }

  private parseInfoFGTSEstab(groupXml: string): S5003InfoFGTSEstab {
    return {
      tpInsc: extractTagAsNumber(groupXml, 'tpInsc') ?? 1,
      nrInsc: extractTag(groupXml, 'nrInsc') ?? '',
      codLotacao: extractTag(groupXml, 'codLotacao') ?? '',
      codCateg: extractTagAsNumber(groupXml, 'codCateg') ?? 0,
      dtAdm: extractTag(groupXml, 'dtAdm'),
      infoBasePerApur: this.parseInfoBasePerApurList(groupXml),
    };
  }

  private parseInfoBasePerApurList(xml: string): S5003InfoBasePerApur[] {
    const groups = extractAllGroups(xml, 'infoBasePerApur');
    return groups.map((groupXml) => ({
      tpValor: extractTagAsNumber(groupXml, 'tpValor') ?? 0,
      vrBcFGTS: extractTagAsNumber(groupXml, 'vrBcFGTS') ?? 0,
      vrBcFGTS13: extractTagAsNumber(groupXml, 'vrBcFGTS13') ?? 0,
    }));
  }
}
