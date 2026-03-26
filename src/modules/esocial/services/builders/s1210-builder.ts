import { EsocialXmlBuilder } from './base-builder';

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface S1210DetPgtoFl {
  /** Período de referência (YYYY-MM) */
  perRef: string;
  /** Identificador do demonstrativo de valores devidos */
  ideDmDev: string;
  /** Indicativo de pagamento na rescisão: S/N */
  indPgtoTt?: 'S' | 'N';
  /** Valor líquido do pagamento */
  vrLiq: number;
}

export interface S1210DetPgtoBenPr {
  /** Período de referência (YYYY-MM) */
  perRef: string;
  /** Identificador do demonstrativo de valores devidos */
  ideDmDev: string;
  /** Valor líquido do pagamento */
  vrLiq: number;
}

export interface S1210InfoPgto {
  /** Data do pagamento (YYYY-MM-DD) */
  dtPgto: Date | string;
  /**
   * Tipo de pagamento:
   * 1=Pagamento de remuneração, 13o, férias
   * 2=Pagamento de verbas rescisórias
   * 3=Pagamento de verbas PLR
   * 5=Pagamento de benefícios previdenciários
   */
  tpPgto: number;
  /** Indicativo de residente no Brasil: S/N */
  indResBr: 'S' | 'N';
  /** Detalhamento de pagamentos referentes a folha */
  detPgtoFl?: S1210DetPgtoFl[];
  /** Detalhamento de pagamentos referentes a benefícios */
  detPgtoBenPr?: S1210DetPgtoBenPr[];
}

export interface S1210IdeBenef {
  /** CPF do beneficiário */
  cpfBenef: string;
  /** Dependentes para dedução */
  deps?: {
    /** Valor da dedução por dependente */
    vrDedDep: number;
  };
}

export interface S1210Input {
  // --- ideEvento ---
  indRetif?: 1 | 2;
  tpAmb?: 1 | 2;
  nrRecibo?: string;

  /** Período de apuração (YYYY-MM) */
  perApur: string;

  // --- ideEmpregador ---
  tpInsc: number;
  nrInsc: string;

  // --- ideBenef ---
  ideBenef: S1210IdeBenef;

  // --- infoPgto ---
  infoPgto: S1210InfoPgto[];
}

/**
 * Builder for eSocial event S-1210 — Pagamentos de Rendimentos do Trabalho.
 *
 * Captures actual payment dates and amounts for workers, linking back to
 * the remuneration events (S-1200) through demonstrativo identifiers.
 */
export class S1210Builder extends EsocialXmlBuilder<S1210Input> {
  protected eventType = 'S-1210';
  protected version = 'vS_01_02_00';

  build(input: S1210Input): string {
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
    const ideBenef = this.buildIdeBenef(input.ideBenef);
    const infoPgtoSection = this.buildInfoPgtoList(input.infoPgto);

    const evtContent = ideEvento + ideEmpregador + ideBenef + infoPgtoSection;
    const evtPgtos = `<evtPgtos Id="${eventId}">${evtContent}</evtPgtos>`;

    const xmlns = `http://www.esocial.gov.br/schema/evt/evtPgtos/${this.version}`;
    return `${this.xmlHeader()}<eSocial xmlns="${xmlns}">${evtPgtos}</eSocial>`;
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
  // ideBenef
  // ---------------------------------------------------------------------------

  private buildIdeBenef(ideBenef: S1210IdeBenef): string {
    let content = '';
    content += this.tag('cpfBenef', this.formatCPF(ideBenef.cpfBenef));

    if (ideBenef.deps) {
      const depsContent = this.tag(
        'vrDedDep',
        this.formatMoney(ideBenef.deps.vrDedDep),
      );
      content += this.tagGroup('deps', depsContent);
    }

    return this.tagGroup('ideBenef', content);
  }

  // ---------------------------------------------------------------------------
  // infoPgto
  // ---------------------------------------------------------------------------

  private buildInfoPgtoList(infoPgtoList: S1210InfoPgto[]): string {
    let content = '';
    for (const infoPgto of infoPgtoList) {
      content += this.buildInfoPgto(infoPgto);
    }
    return content;
  }

  private buildInfoPgto(infoPgto: S1210InfoPgto): string {
    let content = '';
    content += this.tag('dtPgto', this.formatDate(infoPgto.dtPgto));
    content += this.tag('tpPgto', infoPgto.tpPgto);
    content += this.tag('indResBr', infoPgto.indResBr);

    if (infoPgto.detPgtoFl && infoPgto.detPgtoFl.length > 0) {
      for (const detalhamento of infoPgto.detPgtoFl) {
        content += this.buildDetPgtoFl(detalhamento);
      }
    }

    if (infoPgto.detPgtoBenPr && infoPgto.detPgtoBenPr.length > 0) {
      for (const detalhamento of infoPgto.detPgtoBenPr) {
        content += this.buildDetPgtoBenPr(detalhamento);
      }
    }

    return this.tagGroup('infoPgto', content);
  }

  private buildDetPgtoFl(det: S1210DetPgtoFl): string {
    let content = '';
    content += this.tag('perRef', det.perRef);
    content += this.tag('ideDmDev', det.ideDmDev);
    if (det.indPgtoTt) content += this.tag('indPgtoTt', det.indPgtoTt);
    content += this.tag('vrLiq', this.formatMoney(det.vrLiq));
    return this.tagGroup('detPgtoFl', content);
  }

  private buildDetPgtoBenPr(det: S1210DetPgtoBenPr): string {
    let content = '';
    content += this.tag('perRef', det.perRef);
    content += this.tag('ideDmDev', det.ideDmDev);
    content += this.tag('vrLiq', this.formatMoney(det.vrLiq));
    return this.tagGroup('detPgtoBenPr', content);
  }
}
