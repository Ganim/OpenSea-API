import { EsocialXmlBuilder } from './base-builder';

/**
 * Input data for the S-2399 event (Trabalhador Sem Vínculo — Término).
 *
 * Reports the end of a non-employee worker relationship.
 */
export interface S2399Input {
  indRetif?: 1 | 2;
  tpAmb?: 1 | 2;
  nrRecibo?: string;

  // ideEmpregador
  tpInsc: number;
  nrInsc: string;

  // ideVinculo (TSV identification)
  cpfTrab: string;
  /** Matrícula used in the original S-2300 */
  matricula: string;
  /** eSocial Tabela 01 — Categoria (same as S-2300) */
  codCateg: number;

  // infoTSVTermino
  dtTerm: Date | string;
  /**
   * Motivo do término do TSV (eSocial Tabela 25):
   * 01 = Exoneração de cargo em comissão
   * 02 = Término de mandato
   * 03 = Término de estágio
   * 04 = Rescisão de contrato (autônomo)
   * 05 = Falecimento
   * 99 = Outros
   */
  mtvDesligTSV?: string;
}

/**
 * Builder for eSocial event S-2399 — Trabalhador Sem Vínculo de Emprego (Término).
 *
 * Closes the non-employee worker relationship originally reported in S-2300.
 */
export class S2399Builder extends EsocialXmlBuilder<S2399Input> {
  protected eventType = 'S-2399';
  protected version = 'vS_01_02_00';

  build(input: S2399Input): string {
    const indRetif = input.indRetif ?? 1;
    const tpAmb = input.tpAmb ?? 2;
    const eventId = this.generateEventId(input.tpInsc, input.nrInsc);

    const ideEvento = this.buildIdeEvento(indRetif, tpAmb, input.nrRecibo);
    const ideEmpregador = this.buildIdeEmpregador(input.tpInsc, input.nrInsc);
    const ideTrabSemVinculo = this.buildIdeTrabSemVinculo(input);
    const infoTSVTermino = this.buildInfoTSVTermino(input);

    const evtContent =
      ideEvento + ideEmpregador + ideTrabSemVinculo + infoTSVTermino;
    const evtTSVTermino = `<evtTSVTermino Id="${eventId}">${evtContent}</evtTSVTermino>`;

    const xmlns = `http://www.esocial.gov.br/schema/evt/evtTSVTermino/${this.version}`;
    return `${this.xmlHeader()}<eSocial xmlns="${xmlns}">${evtTSVTermino}</eSocial>`;
  }

  private buildIdeTrabSemVinculo(input: S2399Input): string {
    let content = '';
    content += this.tag('cpfTrab', this.formatCPF(input.cpfTrab));
    content += this.tag('matricula', input.matricula);
    content += this.tag('codCateg', input.codCateg);
    return this.tagGroup('ideTrabSemVinculo', content);
  }

  private buildInfoTSVTermino(input: S2399Input): string {
    let content = '';
    content += this.tag('dtTerm', this.formatDate(input.dtTerm));
    if (input.mtvDesligTSV)
      content += this.tag('mtvDesligTSV', input.mtvDesligTSV);
    return this.tagGroup('infoTSVTermino', content);
  }
}
