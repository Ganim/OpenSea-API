import { EsocialXmlBuilder } from './base-builder';

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface S1299Input {
  // --- ideEvento ---
  indRetif?: 1 | 2;
  tpAmb?: 1 | 2;
  nrRecibo?: string;

  /** Período de apuração (YYYY-MM) */
  perApur: string;

  // --- ideEmpregador ---
  tpInsc: number;
  nrInsc: string;

  // --- ideRespInf ---
  /** Nome do responsável pelas informações */
  nmResp: string;
  /** CPF do responsável */
  cpfResp: string;
  /** Telefone do responsável */
  telefone: string;
  /** Email do responsável */
  email: string;

  // --- infoFech ---
  /** Possui eventos S-1200 (Remuneração) no período? S/N */
  evtRemun: 'S' | 'N';
  /** Possui eventos S-1210 (Pagamentos) no período? S/N */
  evtPgtos: 'S' | 'N';
  /** Possui eventos S-1260 (Aquisição Produção Rural)? S/N */
  evtAqProd: 'S' | 'N';
  /** Possui eventos S-1270 (Comercialização Produção)? S/N */
  evtComProd: 'S' | 'N';
  /** Possui eventos de contratação de avulsos não portuários? S/N */
  evtContratAvNP: 'S' | 'N';
  /** Possui eventos S-1280 (Informações Complementares)? S/N */
  evtInfoComplPer: 'S' | 'N';

  /** Primeira competência sem movimento (YYYY-MM), se aplicável */
  compSemMovto?: string;
}

/**
 * Builder for eSocial event S-1299 — Fechamento dos Eventos Periódicos.
 *
 * This event closes the periodic events for a given competence (month).
 * It must be sent after all S-1200, S-1210, and other periodic events
 * for the period have been transmitted. It triggers government calculations
 * of contributions (INSS, FGTS, IR, etc.).
 */
export class S1299Builder extends EsocialXmlBuilder<S1299Input> {
  protected eventType = 'S-1299';
  protected version = 'vS_01_02_00';

  build(input: S1299Input): string {
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
    const ideRespInf = this.buildIdeRespInf(input);
    const infoFech = this.buildInfoFech(input);

    const evtContent = ideEvento + ideEmpregador + ideRespInf + infoFech;
    const evtFechaEvPer = `<evtFechaEvPer Id="${eventId}">${evtContent}</evtFechaEvPer>`;

    const xmlns = `http://www.esocial.gov.br/schema/evt/evtFechaEvPer/${this.version}`;
    return `${this.xmlHeader()}<eSocial xmlns="${xmlns}">${evtFechaEvPer}</eSocial>`;
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
    content += this.tag('perApur', perApur);
    content += this.tag('tpAmb', tpAmb);
    content += this.tag('procEmi', 1);
    content += this.tag('verProc', 'OpenSea-1.0');
    return this.tagGroup('ideEvento', content);
  }

  // ---------------------------------------------------------------------------
  // ideRespInf
  // ---------------------------------------------------------------------------

  private buildIdeRespInf(input: S1299Input): string {
    let content = '';
    content += this.tag('nmResp', input.nmResp);
    content += this.tag('cpfResp', this.formatCPF(input.cpfResp));
    content += this.tag('telefone', input.telefone);
    content += this.tag('email', input.email);
    return this.tagGroup('ideRespInf', content);
  }

  // ---------------------------------------------------------------------------
  // infoFech
  // ---------------------------------------------------------------------------

  private buildInfoFech(input: S1299Input): string {
    let content = '';
    content += this.tag('evtRemun', input.evtRemun);
    content += this.tag('evtPgtos', input.evtPgtos);
    content += this.tag('evtAqProd', input.evtAqProd);
    content += this.tag('evtComProd', input.evtComProd);
    content += this.tag('evtContratAvNP', input.evtContratAvNP);
    content += this.tag('evtInfoComplPer', input.evtInfoComplPer);
    if (input.compSemMovto) {
      content += this.tag('compSemMovto', input.compSemMovto);
    }
    return this.tagGroup('infoFech', content);
  }
}
