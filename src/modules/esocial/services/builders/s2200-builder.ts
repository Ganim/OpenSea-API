import { EsocialXmlBuilder } from './base-builder';

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface S2200Dependant {
  /** eSocial Tabela 07 — Tipo de Dependente (01=Cônjuge, 03=Filho, etc.) */
  tpDep: string;
  nmDep: string;
  dtNascDep: Date | string;
  cpfDep?: string;
  /** S = Sim, N = Não */
  depIRRF: 'S' | 'N';
  /** S = Sim, N = Não */
  depSF: 'S' | 'N';
}

export interface S2200Address {
  tpLograd?: string; // R, AV, TV, etc.
  dscLograd: string;
  nrLograd: string;
  complemento?: string;
  bairro?: string;
  cep: string;
  codMunic?: string; // IBGE municipality code
  uf: string;
}

export interface S2200Nascimento {
  dtNascto: Date | string;
  paisNascto?: number; // 105 = Brasil
  nmMunic?: string;
  uf?: string;
}

export interface S2200Contrato {
  nmCargo: string;
  CBOCargo: string;
  vrSalFx: number;
  /** 1=Hora, 2=Dia, 3=Semana, 4=Quinzena, 5=Mês, 6=Tarefa, 7=Outros */
  undSalFixo: number;
  dscSalVar?: string;
  /** 1=Prazo indeterminado, 2=Prazo determinado */
  tpContr: number;
  dtTerm?: Date | string; // End date for fixed-term contracts
  qtdHrsSem?: number;
  /** 2=Jornada 12x36, 3=Comissionista, 7=Demais, 9=Sem horário */
  tpJornada?: number;
}

export interface S2200Celetista {
  dtAdm: Date | string;
  /** eSocial Tabela 19 — Tipo de Admissão */
  tpAdmissao: number;
  /** 1=Normal, 2=Decorrente de ação fiscal, 3=Decorrente de decisão judicial */
  indAdmissao: number;
  nrProcTrab?: string;
  dtDesAdm?: Date | string;
  /** 1=Trabalho urbano, 2=Trabalho rural */
  natAtividade: number;
}

export interface S2200Input {
  // --- ideEvento ---
  indRetif?: 1 | 2;
  tpAmb?: 1 | 2;
  nrRecibo?: string;

  // --- ideEmpregador ---
  tpInsc: number;
  nrInsc: string;

  // --- trabalhador ---
  cpfTrab: string;
  nmTrab: string;
  /** M or F */
  sexo: string;
  /** eSocial Tabela 08 — Raça/Cor (1-6) */
  racaCor: number;
  /** eSocial Tabela 16 — Estado Civil (1=Solteiro, 2=Casado, etc.) */
  estCiv?: number;
  /** eSocial Tabela 04 — Grau de Instrução (01-12) */
  grauInstr?: string;
  nmSoc?: string;
  /** eSocial Tabela 06 — País de Nacionalidade (105=Brasil) */
  paisNac?: number;

  nascimento: S2200Nascimento;
  endereco?: S2200Address;
  dependentes?: S2200Dependant[];

  // --- vinculo ---
  matricula: string;
  /** 1=CLT, 2=Estatutário */
  tpRegTrab: number;
  /** 1=RGPS, 2=RPPS, 3=RPSE */
  tpRegPrev: number;
  /** S=Cadastramento inicial, N=Não */
  cadIni?: string;

  celetista?: S2200Celetista;
  contrato: S2200Contrato;

  /** Employer CNPJ for localTrabalho (defaults to nrInsc) */
  localTrabCnpj?: string;
}

/**
 * Builder for eSocial event S-2200 — Cadastramento / Admissão do Trabalhador.
 *
 * This is the most complex non-periodic event. It captures the full worker
 * profile, address, dependants, employment bond, contract, and work location.
 */
export class S2200Builder extends EsocialXmlBuilder<S2200Input> {
  protected eventType = 'S-2200';
  protected version = 'vS_01_02_00';

  build(input: S2200Input): string {
    const indRetif = input.indRetif ?? 1;
    const tpAmb = input.tpAmb ?? 2;
    const eventId = this.generateEventId(input.tpInsc, input.nrInsc);

    const ideEvento = this.buildIdeEvento(indRetif, tpAmb, input.nrRecibo);
    const ideEmpregador = this.buildIdeEmpregador(input.tpInsc, input.nrInsc);
    const trabalhador = this.buildTrabalhador(input);
    const vinculo = this.buildVinculo(input);

    const evtContent = ideEvento + ideEmpregador + trabalhador + vinculo;
    const evtAdmissao = `<evtAdmissao Id="${eventId}">${evtContent}</evtAdmissao>`;

    const xmlns = `http://www.esocial.gov.br/schema/evt/evtAdmissao/${this.version}`;
    return `${this.xmlHeader()}<eSocial xmlns="${xmlns}">${evtAdmissao}</eSocial>`;
  }

  // ---------------------------------------------------------------------------
  // Trabalhador
  // ---------------------------------------------------------------------------

  private buildTrabalhador(input: S2200Input): string {
    let content = '';

    content += this.tag('cpfTrab', this.formatCPF(input.cpfTrab));
    content += this.tag('nmTrab', input.nmTrab);
    content += this.tag('sexo', input.sexo);
    content += this.tag('racaCor', input.racaCor);
    if (input.estCiv !== undefined) content += this.tag('estCiv', input.estCiv);
    if (input.grauInstr) content += this.tag('grauInstr', input.grauInstr);
    if (input.nmSoc) content += this.tag('nmSoc', input.nmSoc);
    content += this.tag('paisNac', input.paisNac ?? 105);

    // nascimento
    content += this.buildNascimento(input.nascimento);

    // endereco
    if (input.endereco) {
      content += this.buildEndereco(input.endereco);
    }

    // dependentes
    if (input.dependentes && input.dependentes.length > 0) {
      for (const dep of input.dependentes) {
        content += this.buildDependente(dep);
      }
    }

    return this.tagGroup('trabalhador', content);
  }

  private buildNascimento(nasc: S2200Nascimento): string {
    let content = '';
    content += this.tag('dtNascto', this.formatDate(nasc.dtNascto));
    content += this.tag('paisNascto', nasc.paisNascto ?? 105);
    if (nasc.nmMunic) content += this.tag('nmMunic', nasc.nmMunic);
    if (nasc.uf) content += this.tag('uf', nasc.uf);
    return this.tagGroup('nascimento', content);
  }

  private buildEndereco(addr: S2200Address): string {
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

  private buildDependente(dep: S2200Dependant): string {
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
  // Vinculo
  // ---------------------------------------------------------------------------

  private buildVinculo(input: S2200Input): string {
    let content = '';

    content += this.tag('matricula', input.matricula);
    content += this.tag('tpRegTrab', input.tpRegTrab);
    content += this.tag('tpRegPrev', input.tpRegPrev);
    content += this.tag('cadIni', input.cadIni ?? 'S');

    // infoRegimeTrab > infoCeletista
    if (input.celetista) {
      content += this.buildInfoRegimeTrab(input.celetista);
    }

    // infoContrato
    content += this.buildInfoContrato(input);

    return this.tagGroup('vinculo', content);
  }

  private buildInfoRegimeTrab(cel: S2200Celetista): string {
    let celContent = '';
    celContent += this.tag('dtAdm', this.formatDate(cel.dtAdm));
    celContent += this.tag('tpAdmissao', cel.tpAdmissao);
    celContent += this.tag('indAdmissao', cel.indAdmissao);
    if (cel.nrProcTrab) celContent += this.tag('nrProcTrab', cel.nrProcTrab);
    if (cel.dtDesAdm)
      celContent += this.tag('dtDesAdm', this.formatDate(cel.dtDesAdm));
    celContent += this.tag('natAtividade', cel.natAtividade);

    const infoCeletista = this.tagGroup('infoCeletista', celContent);
    return this.tagGroup('infoRegimeTrab', infoCeletista);
  }

  private buildInfoContrato(input: S2200Input): string {
    const c = input.contrato;
    let content = '';

    content += this.tag('nmCargo', c.nmCargo);
    content += this.tag('CBOCargo', c.CBOCargo);
    content += this.tag('vrSalFx', this.formatMoney(c.vrSalFx));
    content += this.tag('undSalFixo', c.undSalFixo);
    if (c.dscSalVar) content += this.tag('dscSalVar', c.dscSalVar);
    content += this.tag('tpContr', c.tpContr);

    // duracao
    let duracaoContent = '';
    duracaoContent += this.tag('tpContr', c.tpContr);
    if (c.tpContr === 2 && c.dtTerm) {
      duracaoContent += this.tag('dtTerm', this.formatDate(c.dtTerm));
    }
    content += this.tagGroup('duracao', duracaoContent);

    // horContratual
    if (c.qtdHrsSem !== undefined) {
      let horContent = '';
      horContent += this.tag('qtdHrsSem', c.qtdHrsSem);
      if (c.tpJornada !== undefined)
        horContent += this.tag('tpJornada', c.tpJornada);
      content += this.tagGroup('horContratual', horContent);
    }

    // localTrabalho
    const localCnpj = input.localTrabCnpj ?? input.nrInsc;
    let localGeralContent = '';
    localGeralContent += this.tag('tpInsc', 1);
    localGeralContent += this.tag('nrInsc', this.formatCNPJ(localCnpj));
    const localTrabGeral = this.tagGroup('localTrabGeral', localGeralContent);
    content += this.tagGroup('localTrabalho', localTrabGeral);

    return this.tagGroup('infoContrato', content);
  }
}
