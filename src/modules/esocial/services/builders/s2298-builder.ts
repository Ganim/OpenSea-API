import { EsocialXmlBuilder } from './base-builder';

/**
 * Input data for the S-2298 event (Reintegração / Outros Provimentos).
 */
export interface S2298Input {
  indRetif?: 1 | 2;
  tpAmb?: 1 | 2;
  nrRecibo?: string;

  // ideEmpregador
  tpInsc: number;
  nrInsc: string;

  // ideVinculo
  cpfTrab: string;
  matricula: string;

  // infoReintegr
  /**
   * Tipo de reintegração:
   * 1 = Reintegração por determinação judicial
   * 2 = Reintegração por anistia legal
   * 3 = Reversão de servidor público
   * 4 = Recondução de servidor público
   * 5 = Reinclusão de militar
   * 9 = Outros
   */
  tpReint: number;
  /** Número do processo judicial (obrigatório quando tpReint=1) */
  nrProcJud?: string;
  /** Data da reintegração (data do ato) */
  dtReint: Date | string;
  /** Data do efetivo retorno ao trabalho */
  dtEfetRetorno?: Date | string;
}

/**
 * Builder for eSocial event S-2298 — Reintegração / Outros Provimentos.
 *
 * Reports the reinstatement of an employee whose employment bond had been
 * terminated, whether by judicial order, amnesty, or administrative decision.
 */
export class S2298Builder extends EsocialXmlBuilder<S2298Input> {
  protected eventType = 'S-2298';
  protected version = 'vS_01_02_00';

  build(input: S2298Input): string {
    const indRetif = input.indRetif ?? 1;
    const tpAmb = input.tpAmb ?? 2;
    const eventId = this.generateEventId(input.tpInsc, input.nrInsc);

    const ideEvento = this.buildIdeEvento(indRetif, tpAmb, input.nrRecibo);
    const ideEmpregador = this.buildIdeEmpregador(input.tpInsc, input.nrInsc);
    const ideVinculo = this.buildIdeVinculo(input);
    const infoReintegr = this.buildInfoReintegr(input);

    const evtContent = ideEvento + ideEmpregador + ideVinculo + infoReintegr;
    const evtReintegr = `<evtReintegr Id="${eventId}">${evtContent}</evtReintegr>`;

    const xmlns = `http://www.esocial.gov.br/schema/evt/evtReintegr/${this.version}`;
    return `${this.xmlHeader()}<eSocial xmlns="${xmlns}">${evtReintegr}</eSocial>`;
  }

  private buildIdeVinculo(input: S2298Input): string {
    let content = '';
    content += this.tag('cpfTrab', this.formatCPF(input.cpfTrab));
    content += this.tag('matricula', input.matricula);
    return this.tagGroup('ideVinculo', content);
  }

  private buildInfoReintegr(input: S2298Input): string {
    let content = '';
    content += this.tag('tpReint', input.tpReint);
    if (input.nrProcJud) content += this.tag('nrProcJud', input.nrProcJud);
    content += this.tag('dtReint', this.formatDate(input.dtReint));
    if (input.dtEfetRetorno)
      content += this.tag(
        'dtEfetRetorno',
        this.formatDate(input.dtEfetRetorno),
      );
    return this.tagGroup('infoReintegr', content);
  }
}
