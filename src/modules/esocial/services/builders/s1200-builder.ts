import { EsocialXmlBuilder } from './base-builder';

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface S1200ItemRemun {
  /** Código da rubrica (referencia S-1010) */
  codRubr: string;
  /** Identificador da tabela de rubricas */
  ideTabRubr: string;
  /** Quantidade (horas, dias, etc.) */
  qtdRubr?: number;
  /** Fator/percentual */
  fatorRubr?: number;
  /** Valor da rubrica */
  vrRubr: number;
  /** Indicativo de apuração de imposto de renda (0=Normal, 1=13o) */
  indApurIR?: number;
}

export interface S1200RemunPerApur {
  /** Itens de remuneração (rubricas) */
  itensRemun: S1200ItemRemun[];
}

export interface S1200IdeEstabLot {
  /** Tipo de inscrição do estabelecimento (1=CNPJ, 2=CPF) */
  tpInsc: number;
  /** Número de inscrição do estabelecimento */
  nrInsc: string;
  /** Código da lotação tributária (referencia S-1020) */
  codLotacao: string;
  /** Remuneração do período de apuração */
  remunPerApur: S1200RemunPerApur[];
}

export interface S1200InfoPerApur {
  ideEstabLot: S1200IdeEstabLot[];
}

export interface S1200DmDev {
  /** Identificador do demonstrativo de valores devidos */
  ideDmDev: string;
  /** Código da categoria do trabalhador (Tabela 01) */
  codCateg: number;
  /** Informações do período de apuração */
  infoPerApur: S1200InfoPerApur;
}

export interface S1200Input {
  // --- ideEvento ---
  indRetif?: 1 | 2;
  tpAmb?: 1 | 2;
  nrRecibo?: string;

  /** Período de apuração (YYYY-MM) */
  perApur: string;

  // --- ideEmpregador ---
  tpInsc: number;
  nrInsc: string;

  // --- ideTrabalhador ---
  cpfTrab: string;

  // --- dmDev ---
  dmDev: S1200DmDev[];
}

/**
 * Builder for eSocial event S-1200 — Remuneração do Trabalhador vinculado ao RGPS.
 *
 * This is the most complex periodic event. It captures all payment components
 * (rubricas) grouped by demonstrativo, lotação tributária and estabelecimento.
 */
export class S1200Builder extends EsocialXmlBuilder<S1200Input> {
  protected eventType = 'S-1200';
  protected version = 'vS_01_02_00';

  build(input: S1200Input): string {
    const indRetif = input.indRetif ?? 1;
    const tpAmb = input.tpAmb ?? 2;
    const eventId = this.generateEventId(input.tpInsc, input.nrInsc);

    const ideEvento = this.buildIdeEventoPeriodico(
      indRetif,
      tpAmb,
      input.perApur,
      input.nrRecibo,
    );
    const ideEmpregador = this.buildIdeEmpregador(input.tpInsc, input.nrInsc);
    const ideTrabalhador = this.buildIdeTrabalhador(input.cpfTrab);
    const dmDevSection = this.buildDmDevList(input.dmDev);

    const evtContent =
      ideEvento + ideEmpregador + ideTrabalhador + dmDevSection;
    const evtRemun = `<evtRemun Id="${eventId}">${evtContent}</evtRemun>`;

    const xmlns = `http://www.esocial.gov.br/schema/evt/evtRemun/${this.version}`;
    return `${this.xmlHeader()}<eSocial xmlns="${xmlns}">${evtRemun}</eSocial>`;
  }

  // ---------------------------------------------------------------------------
  // ideEvento (periodic variant includes perApur)
  // ---------------------------------------------------------------------------

  private buildIdeEventoPeriodico(
    indRetif: 1 | 2,
    tpAmb: 1 | 2,
    perApur: string,
    nrRecibo?: string,
  ): string {
    let content = '';
    content += this.tag('indRetif', indRetif);
    if (indRetif === 2 && nrRecibo) {
      content += this.tag('nrRecibo', nrRecibo);
    }
    content += this.tag('indApuracao', 1); // 1 = Mensal
    content += this.tag('perApur', perApur);
    content += this.tag('tpAmb', tpAmb);
    content += this.tag('procEmi', 1);
    content += this.tag('verProc', 'OpenSea-1.0');
    return this.tagGroup('ideEvento', content);
  }

  // ---------------------------------------------------------------------------
  // ideTrabalhador
  // ---------------------------------------------------------------------------

  private buildIdeTrabalhador(cpfTrab: string): string {
    const content = this.tag('cpfTrab', this.formatCPF(cpfTrab));
    return this.tagGroup('ideTrabalhador', content);
  }

  // ---------------------------------------------------------------------------
  // dmDev (demonstrativo de valores devidos)
  // ---------------------------------------------------------------------------

  private buildDmDevList(dmDevList: S1200DmDev[]): string {
    let content = '';
    for (const dmDev of dmDevList) {
      content += this.buildDmDev(dmDev);
    }
    return content;
  }

  private buildDmDev(dmDev: S1200DmDev): string {
    let content = '';
    content += this.tag('ideDmDev', dmDev.ideDmDev);
    content += this.tag('codCateg', dmDev.codCateg);
    content += this.buildInfoPerApur(dmDev.infoPerApur);
    return this.tagGroup('dmDev', content);
  }

  private buildInfoPerApur(infoPerApur: S1200InfoPerApur): string {
    let content = '';
    for (const estabLot of infoPerApur.ideEstabLot) {
      content += this.buildIdeEstabLot(estabLot);
    }
    return this.tagGroup('infoPerApur', content);
  }

  private buildIdeEstabLot(estabLot: S1200IdeEstabLot): string {
    let content = '';
    content += this.tag('tpInsc', estabLot.tpInsc);
    content += this.tag(
      'nrInsc',
      estabLot.tpInsc === 1
        ? this.formatCNPJ(estabLot.nrInsc)
        : this.formatCPF(estabLot.nrInsc),
    );
    content += this.tag('codLotacao', estabLot.codLotacao);

    for (const remun of estabLot.remunPerApur) {
      content += this.buildRemunPerApur(remun);
    }

    return this.tagGroup('ideEstabLot', content);
  }

  private buildRemunPerApur(remun: S1200RemunPerApur): string {
    let content = '';
    for (const item of remun.itensRemun) {
      content += this.buildItemRemun(item);
    }
    return this.tagGroup('remunPerApur', content);
  }

  private buildItemRemun(item: S1200ItemRemun): string {
    let content = '';
    content += this.tag('codRubr', item.codRubr);
    content += this.tag('ideTabRubr', item.ideTabRubr);
    if (item.qtdRubr !== undefined)
      content += this.tag('qtdRubr', item.qtdRubr);
    if (item.fatorRubr !== undefined)
      content += this.tag('fatorRubr', item.fatorRubr);
    content += this.tag('vrRubr', this.formatMoney(item.vrRubr));
    if (item.indApurIR !== undefined)
      content += this.tag('indApurIR', item.indApurIR);
    return this.tagGroup('itensRemun', content);
  }
}
