/**
 * eSocial event type codes.
 * Each code corresponds to a specific government event layout.
 */
export enum EsocialEventType {
  // Tabelas
  S_1000 = 'S-1000', // Informações do Empregador
  S_1005 = 'S-1005', // Tabela de Estabelecimentos
  S_1010 = 'S-1010', // Tabela de Rubricas
  S_1020 = 'S-1020', // Tabela de Lotações Tributárias
  S_1070 = 'S-1070', // Tabela de Processos Administrativos/Judiciais

  // Eventos Não Periódicos
  S_2190 = 'S-2190', // Registro Preliminar de Trabalhador
  S_2200 = 'S-2200', // Cadastramento Inicial / Admissão
  S_2205 = 'S-2205', // Alteração de Dados Cadastrais
  S_2206 = 'S-2206', // Alteração de Contrato
  S_2210 = 'S-2210', // Comunicação de Acidente de Trabalho (CAT)
  S_2220 = 'S-2220', // Monitoramento da Saúde do Trabalhador (ASO)
  S_2230 = 'S-2230', // Afastamento Temporário
  S_2231 = 'S-2231', // Cessação de Condições de Exercício
  S_2240 = 'S-2240', // Condições Ambientais do Trabalho
  S_2298 = 'S-2298', // Reintegração / Reversão
  S_2299 = 'S-2299', // Desligamento
  S_2300 = 'S-2300', // Trabalhador Sem Vínculo (Início)
  S_2306 = 'S-2306', // Trabalhador Sem Vínculo (Alteração)
  S_2399 = 'S-2399', // Trabalhador Sem Vínculo (Término)
  S_2400 = 'S-2400', // Cadastro de Beneficiário (Benefícios)
  S_2405 = 'S-2405', // Alteração de Dados de Beneficiário
  S_2410 = 'S-2410', // Cadastro de Benefício (Entes Públicos)
  S_2416 = 'S-2416', // Alteração de Benefício (Entes Públicos)
  S_2418 = 'S-2418', // Reativação de Benefício (Entes Públicos)
  S_2420 = 'S-2420', // Cadastro de Benefício (Término)
  S_2500 = 'S-2500', // Processo Trabalhista
  S_2501 = 'S-2501', // Informações dos Tributos (Processo Trabalhista)

  // Eventos Periódicos
  S_1200 = 'S-1200', // Remuneração do Trabalhador
  S_1202 = 'S-1202', // Remuneração (RPPS)
  S_1207 = 'S-1207', // Benefícios Previdenciários (RPPS)
  S_1210 = 'S-1210', // Pagamentos de Rendimentos
  S_1260 = 'S-1260', // Comercialização da Produção Rural
  S_1270 = 'S-1270', // Contratação de Trabalhadores Avulsos
  S_1280 = 'S-1280', // Informações Complementares (Desoneração)
  S_1299 = 'S-1299', // Fechamento dos Eventos Periódicos
  S_1298 = 'S-1298', // Reabertura dos Eventos Periódicos

  // Exclusão
  S_3000 = 'S-3000', // Exclusão de Eventos

  // Totalizadores (retorno do governo — somente leitura)
  S_5001 = 'S-5001', // Informações das Contribuições Sociais Consolidadas por Trabalhador
  S_5002 = 'S-5002', // Imposto de Renda Retido na Fonte por Trabalhador
  S_5003 = 'S-5003', // Informações do FGTS por Trabalhador
  S_5011 = 'S-5011', // Informações das Contribuições Sociais Consolidadas
  S_5012 = 'S-5012', // IRRF Consolidado
  S_5013 = 'S-5013', // FGTS Consolidado
}

/**
 * Reference type that maps to eSocial event types.
 */
export enum EsocialReferenceType {
  EMPLOYEE = 'EMPLOYEE',
  PAYROLL = 'PAYROLL',
  ABSENCE = 'ABSENCE',
  TERMINATION = 'TERMINATION',
  MEDICAL_EXAM = 'MEDICAL_EXAM',
  TENANT_CONFIG = 'TENANT_CONFIG',
  RUBRICA = 'RUBRICA',
  ESOCIAL_EVENT = 'ESOCIAL_EVENT',
}

/**
 * Get event category label.
 */
export function getEventCategory(
  eventType: string,
): 'TABELA' | 'NAO_PERIODICO' | 'PERIODICO' | 'EXCLUSAO' | 'TOTALIZADOR' {
  if (eventType.startsWith('S-1') && parseInt(eventType.split('-')[1]) < 1200) {
    return 'TABELA';
  }
  if (eventType.startsWith('S-2')) {
    return 'NAO_PERIODICO';
  }
  if (eventType.startsWith('S-3')) {
    return 'EXCLUSAO';
  }
  if (eventType.startsWith('S-5')) {
    return 'TOTALIZADOR';
  }
  return 'PERIODICO';
}

/**
 * Human-readable description for an event type.
 */
const EVENT_TYPE_DESCRIPTIONS: Record<string, string> = {
  'S-1000': 'Informações do Empregador',
  'S-1005': 'Tabela de Estabelecimentos',
  'S-1010': 'Tabela de Rubricas',
  'S-1020': 'Tabela de Lotações Tributárias',
  'S-1070': 'Tabela de Processos Administrativos/Judiciais',
  'S-1200': 'Remuneração do Trabalhador',
  'S-1202': 'Remuneração (RPPS)',
  'S-1207': 'Benefícios Previdenciários (RPPS)',
  'S-1210': 'Pagamentos de Rendimentos',
  'S-1260': 'Comercialização da Produção Rural',
  'S-1270': 'Contratação de Trabalhadores Avulsos',
  'S-1280': 'Informações Complementares (Desoneração)',
  'S-1298': 'Reabertura dos Eventos Periódicos',
  'S-1299': 'Fechamento dos Eventos Periódicos',
  'S-2190': 'Registro Preliminar de Trabalhador',
  'S-2200': 'Cadastramento Inicial / Admissão',
  'S-2205': 'Alteração de Dados Cadastrais',
  'S-2206': 'Alteração de Contrato',
  'S-2210': 'Comunicação de Acidente de Trabalho (CAT)',
  'S-2220': 'Monitoramento da Saúde do Trabalhador (ASO)',
  'S-2230': 'Afastamento Temporário',
  'S-2231': 'Cessação de Condições de Exercício',
  'S-2240': 'Condições Ambientais do Trabalho',
  'S-2298': 'Reintegração / Reversão',
  'S-2299': 'Desligamento',
  'S-2300': 'Trabalhador Sem Vínculo (Início)',
  'S-2306': 'Trabalhador Sem Vínculo (Alteração)',
  'S-2399': 'Trabalhador Sem Vínculo (Término)',
  'S-2400': 'Cadastro de Beneficiário',
  'S-2405': 'Alteração de Dados de Beneficiário',
  'S-2410': 'Cadastro de Benefício (Entes Públicos)',
  'S-2416': 'Alteração de Benefício (Entes Públicos)',
  'S-2418': 'Reativação de Benefício (Entes Públicos)',
  'S-2420': 'Cadastro de Benefício (Término)',
  'S-2500': 'Processo Trabalhista',
  'S-2501': 'Informações dos Tributos (Processo Trabalhista)',
  'S-3000': 'Exclusão de Eventos',
  'S-5001': 'Contribuições Sociais Consolidadas por Trabalhador',
  'S-5002': 'IRRF por Trabalhador',
  'S-5003': 'FGTS por Trabalhador',
  'S-5011': 'Contribuições Sociais Consolidadas',
  'S-5012': 'IRRF Consolidado',
  'S-5013': 'FGTS Consolidado',
};

export function getEventTypeDescription(eventType: string): string {
  return EVENT_TYPE_DESCRIPTIONS[eventType] ?? eventType;
}
