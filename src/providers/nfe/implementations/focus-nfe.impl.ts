import type {
  CancelInvoiceInput,
  CancelInvoiceResponse,
  CheckStatusInput,
  CheckStatusResponse,
  CreateInvoiceInput,
  CreateInvoiceResponse,
  TestConnectionResponse,
} from '../focus-nfe.types';
import type { IFocusNfeProvider } from '../focus-nfe.provider';
import { FocusNfeRestClient } from '../focus-nfe-rest-client';

/**
 * Implementação do IFocusNfeProvider usando Focus NFe REST API
 */
export class FocusNfeProviderImpl implements IFocusNfeProvider {
  private client: FocusNfeRestClient;

  constructor(production: boolean = true) {
    this.client = new FocusNfeRestClient(production);
  }

  async createInvoice(input: CreateInvoiceInput): Promise<CreateInvoiceResponse> {
    try {
      const endpoint = input.type === 'nfe' ? 'createNfe' : 'createNfce';
      
      const payload = {
        referencia: input.reference,
        natureza_operacao: input.natureza_operacao,
        descricao_operacao: input.descricao_operacao,
        data_emissao: input.data_emissao,
        data_saida_entrada: input.data_saida_entrada,
        natureza_operacao_desc: input.descricao_operacao,
        series: input.series,
        detalhes: input.detalhes,
        valor_frete: input.valor_frete,
        valor_seguro: input.valor_seguro,
        valor_desconto: input.valor_desconto,
        observacoes: input.observacoes,
      };

      // Adiciona dados do cliente se fornecidos
      if (input.nome_destinatario) {
        Object.assign(payload, {
          nome_destinatario: input.nome_destinatario,
          cpf_cnpj_destinatario: input.cpf_cnpj_destinatario,
          endereco_destinatario: input.endereco_destinatario,
          numero_destinatario: input.numero_destinatario,
          complemento_destinatario: input.complemento_destinatario,
          bairro_destinatario: input.bairro_destinatario,
          cidade_destinatario: input.cidade_destinatario,
          uf_destinatario: input.uf_destinatario,
          cep_destinatario: input.cep_destinatario,
          pais_destinatario: input.pais_destinatario || 'BR',
          email_destinatario: input.email_destinatario,
          telefone_destinatario: input.telefone_destinatario,
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let response: any;
      if (input.type === 'nfe') {
        response = await this.client.createNfe(payload, input.apiKey);
      } else {
        response = await this.client.createNfce(payload, input.apiKey);
      }

      return {
        id: response.id,
        ref: response.referencia || response.ref,
        status: response.status,
        status_code: response.status_code || 200,
        chave_nfe: response.chave_nfe,
        numero_nf: response.numero_nf,
        serie_nf: response.serie_nf,
        caminho_xml: response.caminho_xml,
        caminho_pdf: response.caminho_pdf,
        descricao_status: response.descricao_status,
        ambiente: input.ambiente || 2, // sandbox by default
      };
    } catch (error) {
      throw new Error(
        `Focus NFe create invoice failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async checkStatus(input: CheckStatusInput): Promise<CheckStatusResponse> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let response: any;
      if (input.type === 'nfe') {
        response = await this.client.getNfeStatus(input.ref, input.apiKey);
      } else {
        response = await this.client.getNfceStatus(input.ref, input.apiKey);
      }

      return {
        ref: response.referencia || response.ref,
        status: response.status,
        status_code: response.status_code || 200,
        chave_nfe: response.chave_nfe,
        numero_nf: response.numero_nf,
        serie_nf: response.serie_nf,
        caminho_xml: response.caminho_xml,
        caminho_pdf: response.caminho_pdf,
        descricao_status: response.descricao_status,
        motivo_status: response.motivo_status,
        protocolo: response.protocolo,
        ambiente: input.ambient || 2,
      };
    } catch (error) {
      throw new Error(
        `Focus NFe check status failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async cancelInvoice(input: CancelInvoiceInput): Promise<CancelInvoiceResponse> {
    try {
      const payload = {
        numero_nf: input.numero_nf,
        series: input.serie_nf,
        chave_nfe: input.chave_nfe,
        cnpj_emitente: input.cnpj_emitente,
        data_emissao: input.data_emissao,
        justificativa: input.justificativa,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let response: any;
      if (input.type === 'nfe') {
        response = await this.client.cancelNfe(input.ref, payload, input.apiKey);
      } else {
        response = await this.client.cancelNfce(input.ref, payload, input.apiKey);
      }

      return {
        ref: response.referencia || response.ref,
        status: response.status,
        status_code: response.status_code || 200,
        chave_nfe: response.chave_nfe,
        numero_nf: response.numero_nf,
        serie_nf: response.serie_nf,
        descricao_status: response.descricao_status,
        protocoloCanc: response.protocolo_cancelamento || response.protocoloCanc,
        ambiente: input.ambiente || 2,
      };
    } catch (error) {
      throw new Error(
        `Focus NFe cancel invoice failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async testConnection(
    apiKey: string,
    production: boolean = false,
  ): Promise<TestConnectionResponse> {
    try {
      await this.client.testConnection(apiKey);
      return {
        ok: true,
        message: 'Connection successful',
        statusCode: 200,
      };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : String(error),
        statusCode: 500,
      };
    }
  }
}
