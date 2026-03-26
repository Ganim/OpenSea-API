import { EsocialXmlBuilder } from './base-builder';

// ---------------------------------------------------------------------------
// Input types (reuse address pattern from S-2200)
// ---------------------------------------------------------------------------

export interface S2300Address {
  tpLograd?: string;
  dscLograd: string;
  nrLograd: string;
  complemento?: string;
  bairro?: string;
  cep: string;
  codMunic?: string;
  uf: string;
}

export interface S2300Dependant {
  /** eSocial Tabela 07 — Tipo de Dependente */
  tpDep: string;
  nmDep: string;
  dtNascDep: Date | string;
  cpfDep?: string;
  depIRRF: 'S' | 'N';
  depSF: 'S' | 'N';
}

/**
 * Input data for the S-2300 event (Trabalhador Sem Vínculo de Emprego — Início).
 *
 * Reports the beginning of a non-employee worker relationship (directors,
 * interns, cooperative members, autonomous workers, etc.).
 */
export interface S2300Input {
  indRetif?: 1 | 2;
  tpAmb?: 1 | 2;
  nrRecibo?: string;

  // ideEmpregador
  tpInsc: number;
  nrInsc: string;

  // trabalhador
  cpfTrab: string;
  nmTrab: string;
  /** M or F */
  sexo: string;
  /** eSocial Tabela 08 — Raça/Cor */
  racaCor: number;
  /** eSocial Tabela 16 — Estado Civil */
  estCiv?: number;
  /** eSocial Tabela 04 — Grau de Instrução */
  grauInstr?: string;
  dtNascto: Date | string;

  endereco?: S2300Address;
  dependentes?: S2300Dependant[];

  // infoTSVInicio
  /** eSocial Tabela 01 — Categoria do trabalhador (7xx = TSV) */
  codCateg: number;
  dtInicio: Date | string;
  /** 1=Trabalho urbano, 2=Trabalho rural */
  natAtividade?: number;

  // infoCargo (optional)
  nmCargo?: string;
  CBOCargo?: string;

  // remuneracao (optional)
  vrSalFx?: number;
  /** 1=Hora, 2=Dia, 3=Semana, 4=Quinzena, 5=Mês, 6=Tarefa, 7=Outros */
  undSalFixo?: number;
}

/**
 * Builder for eSocial event S-2300 — Trabalhador Sem Vínculo de Emprego (Início).
 *
 * Used for non-employee workers: directors without employment bond,
 * cooperative members, interns, autonomous workers, elected representatives, etc.
 */
export class S2300Builder extends EsocialXmlBuilder<S2300Input> {
  protected eventType = 'S-2300';
  protected version = 'vS_01_02_00';

  build(input: S2300Input): string {
    const indRetif = input.indRetif ?? 1;
    const tpAmb = input.tpAmb ?? 2;
    const eventId = this.generateEventId(input.tpInsc, input.nrInsc);

    const ideEvento = this.buildIdeEvento(indRetif, tpAmb, input.nrRecibo);
    const ideEmpregador = this.buildIdeEmpregador(input.tpInsc, input.nrInsc);
    const trabalhador = this.buildTrabalhador(input);
    const infoTSVInicio = this.buildInfoTSVInicio(input);

    const evtContent = ideEvento + ideEmpregador + trabalhador + infoTSVInicio;
    const evtTSVInicio = `<evtTSVInicio Id="${eventId}">${evtContent}</evtTSVInicio>`;

    const xmlns = `http://www.esocial.gov.br/schema/evt/evtTSVInicio/${this.version}`;
    return `${this.xmlHeader()}<eSocial xmlns="${xmlns}">${evtTSVInicio}</eSocial>`;
  }

  // ---------------------------------------------------------------------------
  // Trabalhador
  // ---------------------------------------------------------------------------

  private buildTrabalhador(input: S2300Input): string {
    let content = '';
    content += this.tag('cpfTrab', this.formatCPF(input.cpfTrab));
    content += this.tag('nmTrab', input.nmTrab);
    content += this.tag('sexo', input.sexo);
    content += this.tag('racaCor', input.racaCor);
    if (input.estCiv !== undefined) content += this.tag('estCiv', input.estCiv);
    if (input.grauInstr) content += this.tag('grauInstr', input.grauInstr);
    content += this.tag('dtNascto', this.formatDate(input.dtNascto));

    if (input.endereco) {
      content += this.buildEndereco(input.endereco);
    }

    if (input.dependentes && input.dependentes.length > 0) {
      for (const dep of input.dependentes) {
        content += this.buildDependente(dep);
      }
    }

    return this.tagGroup('trabalhador', content);
  }

  private buildEndereco(addr: S2300Address): string {
    let brasilContent = '';
    if (addr.tpLograd) brasilContent += this.tag('tpLograd', addr.tpLograd);
    brasilContent += this.tag('dscLograd', addr.dscLograd);
    brasilContent += this.tag('nrLograd', addr.nrLograd);
    if (addr.complemento)
      brasilContent += this.tag('complemento', addr.complemento);
    if (addr.bairro) brasilContent += this.tag('bairro', addr.bairro);
    brasilContent += this.tag('cep', this.formatCEP(addr.cep));
    if (addr.codMunic) brasilContent += this.tag('codMunic', addr.codMunic);
    brasilContent += this.tag('uf', addr.uf);

    const brasil = this.tagGroup('brasil', brasilContent);
    return this.tagGroup('endereco', brasil);
  }

  private buildDependente(dep: S2300Dependant): string {
    let content = '';
    content += this.tag('tpDep', dep.tpDep);
    content += this.tag('nmDep', dep.nmDep);
    content += this.tag('dtNascDep', this.formatDate(dep.dtNascDep));
    if (dep.cpfDep) content += this.tag('cpfDep', this.formatCPF(dep.cpfDep));
    content += this.tag('depIRRF', dep.depIRRF);
    content += this.tag('depSF', dep.depSF);
    return this.tagGroup('dependente', content);
  }

  // ---------------------------------------------------------------------------
  // infoTSVInicio
  // ---------------------------------------------------------------------------

  private buildInfoTSVInicio(input: S2300Input): string {
    let content = '';
    content += this.tag('codCateg', input.codCateg);
    content += this.tag('dtInicio', this.formatDate(input.dtInicio));
    if (input.natAtividade !== undefined)
      content += this.tag('natAtividade', input.natAtividade);

    // infoCargo
    if (input.nmCargo) {
      let cargoContent = '';
      cargoContent += this.tag('nmCargo', input.nmCargo);
      if (input.CBOCargo) cargoContent += this.tag('CBOCargo', input.CBOCargo);
      content += this.tagGroup('infoCargo', cargoContent);
    }

    // remuneracao
    if (input.vrSalFx !== undefined) {
      let remContent = '';
      remContent += this.tag('vrSalFx', this.formatMoney(input.vrSalFx));
      remContent += this.tag('undSalFixo', input.undSalFixo ?? 5);
      content += this.tagGroup('remuneracao', remContent);
    }

    return this.tagGroup('infoTSVInicio', content);
  }
}
