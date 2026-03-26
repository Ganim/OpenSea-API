import { EsocialXmlBuilder } from './base-builder';

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface S2220Exame {
  dtExam: Date | string;
  /** Código do procedimento realizado (Tabela TUSS / SUS) */
  procRealizado: string;
  /** Observação sobre o procedimento */
  obsProc?: string;
  /** 1=Sequencial, 2=Referência */
  ordExame: number;
  /** 1=Normal, 2=Alterado, 3=Estável, 4=Agravamento */
  indResult?: number;
}

export interface S2220Medico {
  nmMedico: string;
  nrCRM: string;
  ufCRM: string;
}

/**
 * Input data for the S-2220 event (Monitoramento da Saúde do Trabalhador — ASO).
 */
export interface S2220Input {
  indRetif?: 1 | 2;
  tpAmb?: 1 | 2;
  nrRecibo?: string;

  // ideEmpregador
  tpInsc: number;
  nrInsc: string;

  // ideVinculo
  cpfTrab: string;
  matricula: string;

  // exMedOcup
  /** 0=Admissional, 1=Periódico, 2=Retorno ao trabalho, 3=Mudança de risco, 4=Demissional */
  tpAso: number;
  dtAso: Date | string;
  /** Result of ASO: 1=Apto, 2=Inapto */
  resAso: number;

  exames: S2220Exame[];
  medico: S2220Medico;
}

/**
 * Builder for eSocial event S-2220 — Monitoramento da Saúde do Trabalhador (ASO).
 *
 * Reports occupational health exams (ASO) performed on the employee:
 * admissional, periodic, return-to-work, risk-change, and dismissal exams.
 */
export class S2220Builder extends EsocialXmlBuilder<S2220Input> {
  protected eventType = 'S-2220';
  protected version = 'vS_01_02_00';

  build(input: S2220Input): string {
    const indRetif = input.indRetif ?? 1;
    const tpAmb = input.tpAmb ?? 2;
    const eventId = this.generateEventId(input.tpInsc, input.nrInsc);

    const ideEvento = this.buildIdeEvento(indRetif, tpAmb, input.nrRecibo);
    const ideEmpregador = this.buildIdeEmpregador(input.tpInsc, input.nrInsc);
    const ideVinculo = this.buildIdeVinculo(input);
    const exMedOcup = this.buildExMedOcup(input);

    const evtContent = ideEvento + ideEmpregador + ideVinculo + exMedOcup;
    const evtMonit = `<evtMonit Id="${eventId}">${evtContent}</evtMonit>`;

    const xmlns = `http://www.esocial.gov.br/schema/evt/evtMonit/${this.version}`;
    return `${this.xmlHeader()}<eSocial xmlns="${xmlns}">${evtMonit}</eSocial>`;
  }

  private buildIdeVinculo(input: S2220Input): string {
    let content = '';
    content += this.tag('cpfTrab', this.formatCPF(input.cpfTrab));
    content += this.tag('matricula', input.matricula);
    return this.tagGroup('ideVinculo', content);
  }

  private buildExMedOcup(input: S2220Input): string {
    let content = '';
    content += this.tag('tpAso', input.tpAso);
    content += this.tag('dtAso', this.formatDate(input.dtAso));
    content += this.tag('resAso', input.resAso);

    // exames
    for (const exame of input.exames) {
      content += this.buildExame(exame);
    }

    // medico
    content += this.buildMedico(input.medico);

    return this.tagGroup('exMedOcup', content);
  }

  private buildExame(exame: S2220Exame): string {
    let content = '';
    content += this.tag('dtExam', this.formatDate(exame.dtExam));
    content += this.tag('procRealizado', exame.procRealizado);
    if (exame.obsProc) content += this.tag('obsProc', exame.obsProc);
    content += this.tag('ordExame', exame.ordExame);
    if (exame.indResult !== undefined)
      content += this.tag('indResult', exame.indResult);
    return this.tagGroup('exame', content);
  }

  private buildMedico(medico: S2220Medico): string {
    let content = '';
    content += this.tag('nmMedico', medico.nmMedico);
    content += this.tag('nrCRM', medico.nrCRM);
    content += this.tag('ufCRM', medico.ufCRM);
    return this.tagGroup('medico', content);
  }
}
