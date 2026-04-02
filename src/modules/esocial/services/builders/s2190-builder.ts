import { EsocialXmlBuilder } from './base-builder';

/**
 * Input data for the S-2190 event (Admissão Preliminar).
 *
 * This is the simplest admission event — sent **before** the hire date
 * to register the preliminary admission with only minimal worker data.
 */
export interface S2190Input {
  /** 1 = Original, 2 = Retificação */
  indRetif?: 1 | 2;
  /** 1 = Produção, 2 = Produção Restrita (homologação) */
  tpAmb?: 1 | 2;
  /** Receipt number (required when indRetif = 2) */
  nrRecibo?: string;

  /** Employer inscription type: 1 = CNPJ, 2 = CPF */
  tpInsc: number;
  /** Employer document (CNPJ or CPF) */
  nrInsc: string;

  /** Worker CPF (may be encrypted — caller must decrypt before passing) */
  cpfTrab: string;
  /** Worker birth date */
  dtNascto: Date | string;
  /** Hire date */
  dtAdm: Date | string;
}

/**
 * Builder for eSocial event S-2190 — Admissão Preliminar.
 *
 * Generates the XML envelope that the employer sends **before** the hire date
 * to comply with the preliminary registration requirement.
 */
export class S2190Builder extends EsocialXmlBuilder<S2190Input> {
  protected eventType = 'S-2190';
  protected version = 'vS_01_02_00';

  build(input: S2190Input): string {
    const indRetif = input.indRetif ?? 1;
    const tpAmb = input.tpAmb ?? 2;

    const eventId = this.generateEventId(input.tpInsc, input.nrInsc);

    // --- ideEvento ---
    const ideEvento = this.buildIdeEvento(indRetif, tpAmb, input.nrRecibo);

    // --- ideEmpregador ---
    const ideEmpregador = this.buildIdeEmpregador(input.tpInsc, input.nrInsc);

    // --- infoRegPrelim ---
    let infoRegPrelimContent = '';
    infoRegPrelimContent += this.tag('cpfTrab', this.formatCPF(input.cpfTrab));
    infoRegPrelimContent += this.tag(
      'dtNascto',
      this.formatDate(input.dtNascto),
    );
    infoRegPrelimContent += this.tag('dtAdm', this.formatDate(input.dtAdm));
    const infoRegPrelim = this.tagGroup('infoRegPrelim', infoRegPrelimContent);

    // --- evtAdmPrelim ---
    const evtContent = ideEvento + ideEmpregador + infoRegPrelim;
    const evtAdmPrelim = `<evtAdmPrelim Id="${eventId}">${evtContent}</evtAdmPrelim>`;

    // --- root ---
    const xmlns = `http://www.esocial.gov.br/schema/evt/evtAdmPrelim/${this.version}`;
    return `${this.xmlHeader()}<eSocial xmlns="${xmlns}">${evtAdmPrelim}</eSocial>`;
  }
}
