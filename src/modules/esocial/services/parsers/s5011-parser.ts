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

export interface S5011InfoCRContrib {
  /** Código de receita da contribuição */
  tpCR: string;
  /** Valor da contribuição social */
  vrCR: number;
}

export interface S5011IdeEstab {
  /** Tipo de inscrição do estabelecimento */
  tpInsc: number;
  /** Número de inscrição do estabelecimento */
  nrInscEstab: string;
  /** Informações de contribuição por código de receita */
  infoCRContrib: S5011InfoCRContrib[];
}

export interface S5011InfoComplObra {
  /** Código de inscrição da obra */
  nrInscProp: string;
  /** Valor da contribuição da obra */
  vrCpObra: number;
}

export interface S5011InfoCS {
  /** Número do recibo do arquivo base (protocolo) */
  nrRecArqBase: string | null;
  /** Informações complementares de obra */
  infoComplObra: S5011InfoComplObra[];
  /** Informações por estabelecimento */
  ideEstab: S5011IdeEstab[];
}

export interface S5011Output {
  /** Período de apuração (YYYY-MM) */
  perApur: string;
  /** Informações das contribuições sociais consolidadas */
  infoCS: S5011InfoCS;
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * Parser for eSocial event S-5011 — Informações das Contribuições Sociais
 * Consolidadas.
 *
 * Totalizador event that consolidates ALL social security contributions
 * for the employer in a given competency period.
 */
export class S5011Parser implements EsocialEventParser<S5011Output> {
  readonly eventType = 'S-5011';

  parse(xml: string): S5011Output {
    const perApur = extractTag(xml, 'perApur') ?? '';
    const infoCS = this.parseInfoCS(xml);

    return { perApur, infoCS };
  }

  private parseInfoCS(xml: string): S5011InfoCS {
    const group = extractGroup(xml, 'infoCS') ?? xml;

    return {
      nrRecArqBase: extractTag(group, 'nrRecArqBase'),
      infoComplObra: this.parseInfoComplObraList(group),
      ideEstab: this.parseIdeEstabList(group),
    };
  }

  private parseInfoComplObraList(xml: string): S5011InfoComplObra[] {
    const groups = extractAllGroups(xml, 'infoComplObra');
    return groups.map((groupXml) => ({
      nrInscProp: extractTag(groupXml, 'nrInscProp') ?? '',
      vrCpObra: extractTagAsNumber(groupXml, 'vrCpObra') ?? 0,
    }));
  }

  private parseIdeEstabList(xml: string): S5011IdeEstab[] {
    const groups = extractAllGroups(xml, 'ideEstab');
    return groups.map((groupXml) => this.parseIdeEstab(groupXml));
  }

  private parseIdeEstab(groupXml: string): S5011IdeEstab {
    return {
      tpInsc: extractTagAsNumber(groupXml, 'tpInsc') ?? 1,
      nrInscEstab: extractTag(groupXml, 'nrInscEstab') ?? '',
      infoCRContrib: this.parseInfoCRContribList(groupXml),
    };
  }

  private parseInfoCRContribList(xml: string): S5011InfoCRContrib[] {
    const groups = extractAllGroups(xml, 'infoCRContrib');
    return groups.map((groupXml) => ({
      tpCR: extractTag(groupXml, 'tpCR') ?? '',
      vrCR: extractTagAsNumber(groupXml, 'vrCR') ?? 0,
    }));
  }
}
