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

export interface S5002InfoDep {
  /** Valor da dedução por dependente */
  vrDedDep: number;
}

export interface S5002InfoIRItem {
  /** Código da receita (tabela de códigos de receita) */
  codCR: string;
  /** Valor da base de cálculo do IRRF */
  vrBcIRRF: number;
  /** Valor do IRRF */
  vrIRRF: number;
  /** Descrição complementar */
  descCR: string | null;
}

export interface S5002InfoIRComplem {
  /** Data do laudo (when applicable) */
  dtLaudo: string | null;
  /** Informações de dependentes */
  infoDep: S5002InfoDep | null;
}

export interface S5002IdeEstabLot {
  /** Tipo de inscrição do estabelecimento */
  tpInsc: number;
  /** Número de inscrição do estabelecimento */
  nrInsc: string;
  /** Código da lotação tributária */
  codLotacao: string;
  /** Código da categoria do trabalhador */
  codCateg: number;
  /** Itens de IRRF */
  infoIR: S5002InfoIRItem[];
}

export interface S5002Output {
  /** CPF do trabalhador */
  cpfTrab: string;
  /** Informações complementares de IR */
  infoIRComplem: S5002InfoIRComplem | null;
  /** Informações do IRRF por estabelecimento/lotação */
  ideEstabLot: S5002IdeEstabLot[];
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * Parser for eSocial event S-5002 — Imposto de Renda Retido na Fonte
 * por Trabalhador.
 *
 * Totalizador event that consolidates income tax withholding per worker
 * after government processing of periodic events.
 */
export class S5002Parser implements EsocialEventParser<S5002Output> {
  readonly eventType = 'S-5002';

  parse(xml: string): S5002Output {
    const cpfTrab = extractTag(xml, 'cpfTrab') ?? '';
    const infoIRComplem = this.parseInfoIRComplem(xml);
    const ideEstabLot = this.parseIdeEstabLotList(xml);

    return { cpfTrab, infoIRComplem, ideEstabLot };
  }

  private parseInfoIRComplem(xml: string): S5002InfoIRComplem | null {
    const group = extractGroup(xml, 'infoIRComplem');
    if (!group) return null;

    const depGroup = extractGroup(group, 'infoDep');
    const infoDep = depGroup
      ? { vrDedDep: extractTagAsNumber(depGroup, 'vrDedDep') ?? 0 }
      : null;

    return {
      dtLaudo: extractTag(group, 'dtLaudo'),
      infoDep,
    };
  }

  private parseIdeEstabLotList(xml: string): S5002IdeEstabLot[] {
    const groups = extractAllGroups(xml, 'ideEstabLot');
    return groups.map((groupXml) => this.parseIdeEstabLot(groupXml));
  }

  private parseIdeEstabLot(groupXml: string): S5002IdeEstabLot {
    return {
      tpInsc: extractTagAsNumber(groupXml, 'tpInsc') ?? 1,
      nrInsc: extractTag(groupXml, 'nrInsc') ?? '',
      codLotacao: extractTag(groupXml, 'codLotacao') ?? '',
      codCateg: extractTagAsNumber(groupXml, 'codCateg') ?? 0,
      infoIR: this.parseInfoIRList(groupXml),
    };
  }

  private parseInfoIRList(xml: string): S5002InfoIRItem[] {
    const groups = extractAllGroups(xml, 'infoIR');
    return groups.map((groupXml) => ({
      codCR: extractTag(groupXml, 'codCR') ?? '',
      vrBcIRRF: extractTagAsNumber(groupXml, 'vrBcIRRF') ?? 0,
      vrIRRF: extractTagAsNumber(groupXml, 'vrIRRF') ?? 0,
      descCR: extractTag(groupXml, 'descCR'),
    }));
  }
}
