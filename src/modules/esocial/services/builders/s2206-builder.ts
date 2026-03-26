import { EsocialXmlBuilder } from './base-builder';

/**
 * Input data for the S-2206 event (Alteração Contratual).
 *
 * Triggered when contract terms change: salary, position, department,
 * work schedule, contract type, etc.
 */
export interface S2206Input {
  indRetif?: 1 | 2;
  tpAmb?: 1 | 2;
  nrRecibo?: string;

  // ideEmpregador
  tpInsc: number;
  nrInsc: string;

  // ideVinculo — identifies the employment bond being changed
  cpfTrab: string;
  matricula: string;

  // altContratual — effective date and new contract data
  dtAlteracao: Date | string;

  // New contract values (only changed fields are required by the caller,
  // but eSocial expects a full snapshot of the current contract state)
  nmCargo: string;
  CBOCargo: string;
  vrSalFx: number;
  /** 1=Hora, 2=Dia, 3=Semana, 4=Quinzena, 5=Mês, 6=Tarefa, 7=Outros */
  undSalFixo: number;
  dscSalVar?: string;
  /** 1=Prazo indeterminado, 2=Prazo determinado */
  tpContr: number;
  dtTerm?: Date | string;
  qtdHrsSem?: number;
  tpJornada?: number;

  /** Work location CNPJ */
  localTrabCnpj?: string;
}

/**
 * Builder for eSocial event S-2206 — Alteração de Contrato de Trabalho.
 */
export class S2206Builder extends EsocialXmlBuilder<S2206Input> {
  protected eventType = 'S-2206';
  protected version = 'vS_01_02_00';

  build(input: S2206Input): string {
    const indRetif = input.indRetif ?? 1;
    const tpAmb = input.tpAmb ?? 2;
    const eventId = this.generateEventId(input.tpInsc, input.nrInsc);

    const ideEvento = this.buildIdeEvento(indRetif, tpAmb, input.nrRecibo);
    const ideEmpregador = this.buildIdeEmpregador(input.tpInsc, input.nrInsc);
    const ideVinculo = this.buildIdeVinculo(input);
    const altContratual = this.buildAltContratual(input);

    const evtContent =
      ideEvento + ideEmpregador + ideVinculo + altContratual;
    const evtAltContratual = `<evtAltContratual Id="${eventId}">${evtContent}</evtAltContratual>`;

    const xmlns = `http://www.esocial.gov.br/schema/evt/evtAltContratual/${this.version}`;
    return `${this.xmlHeader()}<eSocial xmlns="${xmlns}">${evtAltContratual}</eSocial>`;
  }

  private buildIdeVinculo(input: S2206Input): string {
    let content = '';
    content += this.tag('cpfTrab', this.formatCPF(input.cpfTrab));
    content += this.tag('matricula', input.matricula);
    return this.tagGroup('ideVinculo', content);
  }

  private buildAltContratual(input: S2206Input): string {
    let content = '';
    content += this.tag('dtAlteracao', this.formatDate(input.dtAlteracao));

    // infoContrato snapshot
    let contratoContent = '';
    contratoContent += this.tag('nmCargo', input.nmCargo);
    contratoContent += this.tag('CBOCargo', input.CBOCargo);
    contratoContent += this.tag('vrSalFx', this.formatMoney(input.vrSalFx));
    contratoContent += this.tag('undSalFixo', input.undSalFixo);
    if (input.dscSalVar)
      contratoContent += this.tag('dscSalVar', input.dscSalVar);
    contratoContent += this.tag('tpContr', input.tpContr);

    // duracao
    let duracaoContent = '';
    duracaoContent += this.tag('tpContr', input.tpContr);
    if (input.tpContr === 2 && input.dtTerm) {
      duracaoContent += this.tag('dtTerm', this.formatDate(input.dtTerm));
    }
    contratoContent += this.tagGroup('duracao', duracaoContent);

    // horContratual
    if (input.qtdHrsSem !== undefined) {
      let horContent = '';
      horContent += this.tag('qtdHrsSem', input.qtdHrsSem);
      if (input.tpJornada !== undefined)
        horContent += this.tag('tpJornada', input.tpJornada);
      contratoContent += this.tagGroup('horContratual', horContent);
    }

    // localTrabalho
    const localCnpj = input.localTrabCnpj ?? input.nrInsc;
    let localGeralContent = '';
    localGeralContent += this.tag('tpInsc', 1);
    localGeralContent += this.tag('nrInsc', this.formatCNPJ(localCnpj));
    const localTrabGeral = this.tagGroup('localTrabGeral', localGeralContent);
    contratoContent += this.tagGroup('localTrabalho', localTrabGeral);

    content += this.tagGroup('infoContrato', contratoContent);

    return this.tagGroup('altContratual', content);
  }
}
