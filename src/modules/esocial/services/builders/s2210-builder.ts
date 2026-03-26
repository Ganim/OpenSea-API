import { EsocialXmlBuilder } from './base-builder';

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface S2210LocalAcidente {
  /** 1=Estabelecimento do empregador, 2=Estabelecimento de terceiros, 3=Via pública, 4=Área rural, 9=Outros */
  tpLocal: number;
  dscLocal?: string;
  /** Logradouro */
  dscLograd?: string;
  nrLograd?: string;
  bairro?: string;
  cep?: string;
  codMunic?: string;
  uf?: string;
  /** País (105=Brasil) */
  pais?: number;
  /** CNPJ do local do acidente (se terceiros) */
  cnpjLocalAcid?: string;
}

export interface S2210ParteAtingida {
  /** eSocial Tabela 13 — Código da Parte Atingida */
  codParteAting: string;
  /** 1=Esquerdo, 2=Direito, 3=Ambos */
  lateralidade: number;
}

export interface S2210AgenteCausador {
  /** eSocial Tabela 14 — Código do Agente Causador */
  codAgntCausador: string;
}

export interface S2210Atestado {
  dtAtend: Date | string;
  hrAtend?: string;
  indInternacao: 'S' | 'N';
  durTrat?: number;
  indAfast: 'S' | 'N';
  dscLesao?: string;
  codCID: string;
  nmMedico: string;
  nrCRM: string;
  ufCRM: string;
}

/**
 * Input data for the S-2210 event (Comunicação de Acidente de Trabalho — CAT).
 */
export interface S2210Input {
  indRetif?: 1 | 2;
  tpAmb?: 1 | 2;
  nrRecibo?: string;

  // ideEmpregador
  tpInsc: number;
  nrInsc: string;

  // ideVinculo
  cpfTrab: string;
  matricula: string;

  // CAT
  dtAcid: Date | string;
  hrAcid?: string;
  /** 1=Típico, 2=Doença, 3=Trajeto */
  tpAcid: number;
  /** 1=Inicial, 2=Reabertura, 3=Comunicação de óbito */
  tpCat: number;
  /** Código da Situação Geradora (Tabela 15) */
  codSitGeradora: string;
  /** S or N — Iniciativa do atestado de óbito foi da empresa */
  inicATal?: string;
  /** CNAE do local do acidente */
  codCNAE?: string;
  /** Descrição da lesão */
  dscLesao?: string;
  /** Complemento da lesão */
  dscCompLesao?: string;
  /** Método/Situação do acidente */
  mtdSit?: string;
  /** CID-10 */
  codCID: string;
  /** Número de ordem da CAT (quando reabertura ou óbito) */
  nrOrdCAT?: string;

  ideLocalAcid?: S2210LocalAcidente;
  parteAtingida: S2210ParteAtingida;
  agenteCausador: S2210AgenteCausador;
  atestado?: S2210Atestado;
}

/**
 * Builder for eSocial event S-2210 — Comunicação de Acidente de Trabalho (CAT).
 *
 * Reports workplace accidents, occupational diseases, and commute accidents
 * to the government within the mandatory 24-hour deadline.
 */
export class S2210Builder extends EsocialXmlBuilder<S2210Input> {
  protected eventType = 'S-2210';
  protected version = 'vS_01_02_00';

  build(input: S2210Input): string {
    const indRetif = input.indRetif ?? 1;
    const tpAmb = input.tpAmb ?? 2;
    const eventId = this.generateEventId(input.tpInsc, input.nrInsc);

    const ideEvento = this.buildIdeEvento(indRetif, tpAmb, input.nrRecibo);
    const ideEmpregador = this.buildIdeEmpregador(input.tpInsc, input.nrInsc);
    const ideVinculo = this.buildIdeVinculo(input);
    const cat = this.buildCat(input);

    const evtContent = ideEvento + ideEmpregador + ideVinculo + cat;
    const evtCAT = `<evtCAT Id="${eventId}">${evtContent}</evtCAT>`;

    const xmlns = `http://www.esocial.gov.br/schema/evt/evtCAT/${this.version}`;
    return `${this.xmlHeader()}<eSocial xmlns="${xmlns}">${evtCAT}</eSocial>`;
  }

  private buildIdeVinculo(input: S2210Input): string {
    let content = '';
    content += this.tag('cpfTrab', this.formatCPF(input.cpfTrab));
    content += this.tag('matricula', input.matricula);
    return this.tagGroup('ideVinculo', content);
  }

  private buildCat(input: S2210Input): string {
    let content = '';

    content += this.tag('dtAcid', this.formatDate(input.dtAcid));
    if (input.hrAcid) content += this.tag('hrAcid', input.hrAcid);
    content += this.tag('tpAcid', input.tpAcid);
    content += this.tag('tpCat', input.tpCat);
    if (input.nrOrdCAT) content += this.tag('nrOrdCAT', input.nrOrdCAT);
    content += this.tag('codSitGeradora', input.codSitGeradora);
    if (input.inicATal) content += this.tag('inicATal', input.inicATal);
    if (input.codCNAE) content += this.tag('codCNAE', input.codCNAE);
    if (input.dscLesao) content += this.tag('dscLesao', input.dscLesao);
    if (input.dscCompLesao)
      content += this.tag('dscCompLesao', input.dscCompLesao);
    if (input.mtdSit) content += this.tag('mtdSit', input.mtdSit);
    content += this.tag('codCID', input.codCID);

    // ideLocalAcid
    if (input.ideLocalAcid) {
      content += this.buildLocalAcidente(input.ideLocalAcid);
    }

    // parteAtingida
    content += this.buildParteAtingida(input.parteAtingida);

    // agenteCausador
    content += this.buildAgenteCausador(input.agenteCausador);

    // atestado
    if (input.atestado) {
      content += this.buildAtestado(input.atestado);
    }

    return this.tagGroup('cat', content);
  }

  private buildLocalAcidente(local: S2210LocalAcidente): string {
    let content = '';
    content += this.tag('tpLocal', local.tpLocal);
    if (local.dscLocal) content += this.tag('dscLocal', local.dscLocal);
    if (local.dscLograd) content += this.tag('dscLograd', local.dscLograd);
    if (local.nrLograd) content += this.tag('nrLograd', local.nrLograd);
    if (local.bairro) content += this.tag('bairro', local.bairro);
    if (local.cep) content += this.tag('cep', this.formatCEP(local.cep));
    if (local.codMunic) content += this.tag('codMunic', local.codMunic);
    if (local.uf) content += this.tag('uf', local.uf);
    content += this.tag('pais', local.pais ?? 105);
    if (local.cnpjLocalAcid)
      content += this.tag(
        'cnpjLocalAcid',
        this.formatCNPJ(local.cnpjLocalAcid),
      );
    return this.tagGroup('ideLocalAcid', content);
  }

  private buildParteAtingida(parte: S2210ParteAtingida): string {
    let content = '';
    content += this.tag('codParteAting', parte.codParteAting);
    content += this.tag('lateralidade', parte.lateralidade);
    return this.tagGroup('parteAtingida', content);
  }

  private buildAgenteCausador(agente: S2210AgenteCausador): string {
    const content = this.tag('codAgntCausador', agente.codAgntCausador);
    return this.tagGroup('agenteCausador', content);
  }

  private buildAtestado(atestado: S2210Atestado): string {
    let content = '';
    content += this.tag('dtAtend', this.formatDate(atestado.dtAtend));
    if (atestado.hrAtend) content += this.tag('hrAtend', atestado.hrAtend);
    content += this.tag('indInternacao', atestado.indInternacao);
    if (atestado.durTrat !== undefined)
      content += this.tag('durTrat', atestado.durTrat);
    content += this.tag('indAfast', atestado.indAfast);
    if (atestado.dscLesao) content += this.tag('dscLesao', atestado.dscLesao);
    content += this.tag('codCID', atestado.codCID);
    content += this.tag('nmMedico', atestado.nmMedico);
    content += this.tag('nrCRM', atestado.nrCRM);
    content += this.tag('ufCRM', atestado.ufCRM);
    return this.tagGroup('atestado', content);
  }
}
