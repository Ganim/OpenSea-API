import { EsocialXmlBuilder } from './base-builder';

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface S1298Input {
  // --- ideEvento ---
  indRetif?: 1 | 2;
  tpAmb?: 1 | 2;
  nrRecibo?: string;

  /** Período de apuração (YYYY-MM) */
  perApur: string;

  // --- ideEmpregador ---
  tpInsc: number;
  nrInsc: string;
}

/**
 * Builder for eSocial event S-1298 — Reabertura dos Eventos Periódicos.
 *
 * This event reopens a previously closed period (S-1299) to allow
 * corrections — sending new, retifying or deleting periodic events.
 * After corrections are done, S-1299 must be sent again to re-close.
 */
export class S1298Builder extends EsocialXmlBuilder<S1298Input> {
  protected eventType = 'S-1298';
  protected version = 'vS_01_02_00';

  build(input: S1298Input): string {
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

    const evtContent = ideEvento + ideEmpregador;
    const evtReabreEvPer = `<evtReabreEvPer Id="${eventId}">${evtContent}</evtReabreEvPer>`;

    const xmlns = `http://www.esocial.gov.br/schema/evt/evtReabreEvPer/${this.version}`;
    return `${this.xmlHeader()}<eSocial xmlns="${xmlns}">${evtReabreEvPer}</eSocial>`;
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
}
