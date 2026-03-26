import { EsocialXmlBuilder } from './base-builder';

/**
 * Input data for the S-3000 event (Exclusão de Eventos).
 *
 * Used to exclude (delete) a previously transmitted eSocial event.
 * Only non-periodic and periodic events can be excluded; table events cannot.
 */
export interface S3000Input {
  indRetif?: 1 | 2;
  tpAmb?: 1 | 2;
  nrRecibo?: string;

  // ideEmpregador
  tpInsc: number;
  nrInsc: string;

  // infoExclusao
  /** Event type to exclude (e.g., "S-2200", "S-2206", "S-1200") */
  tpEvento: string;
  /** Receipt number of the event to be excluded */
  nrRecEvt: string;

  // ideTrabalhador (optional — required for non-periodic worker events)
  cpfTrab?: string;

  // Apuração period (optional — required for periodic events S-1200, S-1210, etc.)
  perApur?: string;
}

/**
 * Builder for eSocial event S-3000 — Exclusão de Eventos.
 *
 * Allows the employer to exclude a previously accepted event from eSocial.
 * The excluded event's receipt number must be provided. This is commonly
 * used to correct mistakes by excluding and resending the correct event.
 */
export class S3000Builder extends EsocialXmlBuilder<S3000Input> {
  protected eventType = 'S-3000';
  protected version = 'vS_01_02_00';

  build(input: S3000Input): string {
    const indRetif = input.indRetif ?? 1;
    const tpAmb = input.tpAmb ?? 2;
    const eventId = this.generateEventId(input.tpInsc, input.nrInsc);

    const ideEvento = this.buildIdeEvento(indRetif, tpAmb, input.nrRecibo);
    const ideEmpregador = this.buildIdeEmpregador(input.tpInsc, input.nrInsc);
    const infoExclusao = this.buildInfoExclusao(input);

    const evtContent = ideEvento + ideEmpregador + infoExclusao;
    const evtExclusao = `<evtExclusao Id="${eventId}">${evtContent}</evtExclusao>`;

    const xmlns = `http://www.esocial.gov.br/schema/evt/evtExclusao/${this.version}`;
    return `${this.xmlHeader()}<eSocial xmlns="${xmlns}">${evtExclusao}</eSocial>`;
  }

  private buildInfoExclusao(input: S3000Input): string {
    let content = '';
    content += this.tag('tpEvento', input.tpEvento);
    content += this.tag('nrRecEvt', input.nrRecEvt);

    // ideTrabalhador (for non-periodic worker events)
    if (input.cpfTrab) {
      const ideTrabContent = this.tag('cpfTrab', this.formatCPF(input.cpfTrab));
      content += this.tagGroup('ideTrabalhador', ideTrabContent);
    }

    // perApur (for periodic events)
    if (input.perApur) {
      content += this.tag('perApur', input.perApur);
    }

    return this.tagGroup('infoExclusao', content);
  }
}
