import { EsocialXmlBuilder } from './base-builder';
import type { AbsenceTypeValue } from '@/entities/hr/value-objects/absence-type';

/**
 * Maps OpenSea AbsenceType values to eSocial Tabela 18 (Motivo de Afastamento).
 *
 * Only absence types that are reportable to eSocial are mapped here.
 * Non-mapped types (PERSONAL_LEAVE, BEREAVEMENT_LEAVE, etc.) are short-duration
 * CLT absences that do not generate an S-2230 event.
 */
export const ABSENCE_TYPE_TO_ESOCIAL_MOTIVO: Partial<
  Record<AbsenceTypeValue, string>
> = {
  WORK_ACCIDENT: '01',
  SICK_LEAVE: '03',
  MATERNITY_LEAVE: '06',
  MILITARY_SERVICE: '10',
  PATERNITY_LEAVE: '15',
  VACATION: '21',
  UNPAID_LEAVE: '24',
};

/**
 * Input data for the S-2230 event (Afastamento Temporário).
 */
export interface S2230Input {
  indRetif?: 1 | 2;
  tpAmb?: 1 | 2;
  nrRecibo?: string;

  // ideEmpregador
  tpInsc: number;
  nrInsc: string;

  // ideVinculo
  cpfTrab: string;
  matricula: string;

  // infoAfastamento
  dtIniAfast: Date | string;
  /** eSocial Tabela 18 — Motivo de Afastamento */
  codMotAfast: string;
  dtTermAfast?: Date | string;
  /** CID-10 code (for sick leave / work accident) */
  codCID?: string;
}

/**
 * Builder for eSocial event S-2230 — Afastamento Temporário.
 *
 * Reports employee leaves to the government. Only certain absence types
 * require eSocial reporting (see ABSENCE_TYPE_TO_ESOCIAL_MOTIVO).
 */
export class S2230Builder extends EsocialXmlBuilder<S2230Input> {
  protected eventType = 'S-2230';
  protected version = 'vS_01_02_00';

  build(input: S2230Input): string {
    const indRetif = input.indRetif ?? 1;
    const tpAmb = input.tpAmb ?? 2;
    const eventId = this.generateEventId(input.tpInsc, input.nrInsc);

    const ideEvento = this.buildIdeEvento(indRetif, tpAmb, input.nrRecibo);
    const ideEmpregador = this.buildIdeEmpregador(input.tpInsc, input.nrInsc);
    const ideVinculo = this.buildIdeVinculo(input);
    const infoAfastamento = this.buildInfoAfastamento(input);

    const evtContent = ideEvento + ideEmpregador + ideVinculo + infoAfastamento;
    const evtAfastTemp = `<evtAfastTemp Id="${eventId}">${evtContent}</evtAfastTemp>`;

    const xmlns = `http://www.esocial.gov.br/schema/evt/evtAfastTemp/${this.version}`;
    return `${this.xmlHeader()}<eSocial xmlns="${xmlns}">${evtAfastTemp}</eSocial>`;
  }

  private buildIdeVinculo(input: S2230Input): string {
    let content = '';
    content += this.tag('cpfTrab', this.formatCPF(input.cpfTrab));
    content += this.tag('matricula', input.matricula);
    return this.tagGroup('ideVinculo', content);
  }

  private buildInfoAfastamento(input: S2230Input): string {
    // iniAfastamento
    let iniContent = '';
    iniContent += this.tag('dtIniAfast', this.formatDate(input.dtIniAfast));
    iniContent += this.tag('codMotAfast', input.codMotAfast);
    if (input.codCID) iniContent += this.tag('codCID', input.codCID);

    let content = this.tagGroup('iniAfastamento', iniContent);

    // fimAfastamento (optional — can be sent later as an update)
    if (input.dtTermAfast) {
      const fimContent = this.tag(
        'dtTermAfast',
        this.formatDate(input.dtTermAfast),
      );
      content += this.tagGroup('fimAfastamento', fimContent);
    }

    return this.tagGroup('infoAfastamento', content);
  }

  // ---------------------------------------------------------------------------
  // Static helper
  // ---------------------------------------------------------------------------

  /**
   * Convert an OpenSea AbsenceType value to the corresponding eSocial motivo code.
   * Returns undefined for absence types that are not reportable to eSocial.
   */
  static getEsocialMotivo(absenceType: AbsenceTypeValue): string | undefined {
    return ABSENCE_TYPE_TO_ESOCIAL_MOTIVO[absenceType];
  }

  /**
   * Whether the given absence type should generate an S-2230 event.
   */
  static isReportableAbsence(absenceType: AbsenceTypeValue): boolean {
    return absenceType in ABSENCE_TYPE_TO_ESOCIAL_MOTIVO;
  }
}
