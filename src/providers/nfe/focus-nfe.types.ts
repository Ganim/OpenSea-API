/**
 * Focus NFe API Types
 * Interfaces para integração com a API Focus NFe
 */

export type InvoiceTypeParam = 'nfe' | 'nfce';

export interface CreateInvoiceInput {
  type: InvoiceTypeParam;
  apiKey: string;
  reference: string;
  nature: 'saida' | 'entrada'; // NF-e: saida, NFC-e: saida
  series: number;
  idLote?: string;
  data_emissao?: string;
  data_saida_entrada?: string;
  natureza_operacao: string;
  descricao_operacao: string;
  
  // Cliente
  nome_destinatario?: string;
  cpf_cnpj_destinatario?: string;
  endereco_destinatario?: string;
  numero_destinatario?: string;
  complemento_destinatario?: string;
  bairro_destinatario?: string;
  cidade_destinatario?: string;
  uf_destinatario?: string;
  cep_destinatario?: string;
  pais_destinatario?: string;
  telefone_destinatario?: string;
  email_destinatario?: string;
  
  // Itens
  detalhes: DetailItem[];
  
  // Totalizadores
  valor_frete?: number;
  valor_seguro?: number;
  valor_desconto?: number;
  valor_desconto_item?: number;
  
  // Observações
  observacoes?: string;
  
  // Ambiente
  ambiente?: number; // 1: produção, 2: sandbox
}

export interface DetailItem {
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  codigo_ncm?: string;
  codigo_cfop?: string;
  origem?: number;
  icms_aliquota?: number;
  icms_valor?: number;
  pis_aliquota?: number;
  pis_valor?: number;
  cofins_aliquota?: number;
  cofins_valor?: number;
  ipi_aliquota?: number;
  ipi_valor?: number;
}

export interface CreateInvoiceResponse {
  id?: string;
  ref: string;
  status: string;
  status_code: number;
  chave_nfe?: string;
  numero_nf?: number;
  serie_nf?: number;
  caminho_xml?: string;
  caminho_pdf?: string;
  descricao_status?: string;
  ambiente?: number;
}

export interface CheckStatusInput {
  type: InvoiceTypeParam;
  apiKey: string;
  ref: string;
  ambient?: number; // 1: produção, 2: sandbox
}

export interface CheckStatusResponse {
  ref: string;
  status: string;
  status_code: number;
  chave_nfe?: string;
  numero_nf?: number;
  serie_nf?: number;
  caminho_xml?: string;
  caminho_pdf?: string;
  descricao_status?: string;
  motivo_status?: string;
  protocolo?: string;
  ambiente?: number;
}

export interface CancelInvoiceInput {
  type: InvoiceTypeParam;
  apiKey: string;
  ref: string;
  numero_nf: number;
  serie_nf: number;
  chave_nfe: string;
  cnpj_emitente: string;
  data_emissao: string;
  justificativa: string;
  ambiente?: number;
}

export interface CancelInvoiceResponse {
  ref: string;
  status: string;
  status_code: number;
  chave_nfe?: string;
  numero_nf?: number;
  serie_nf?: number;
  descricao_status?: string;
  protocoloCanc?: string;
  ambiente?: number;
}

export interface TestConnectionResponse {
  ok: boolean;
  message: string;
  statusCode?: number;
}
