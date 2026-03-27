import https from 'https';

/**
 * eSocial SOAP WebService client.
 * Handles batch event transmission and status checking via the
 * government's eSocial SOAP endpoints.
 */

const ENDPOINTS = {
  PRODUCAO: {
    envioLote:
      'https://webservices.producaorestrita.esocial.gov.br/servicos/empregador/enviarloteeventos/WsEnviarLoteEventos.svc',
    consultaLote:
      'https://webservices.producaorestrita.esocial.gov.br/servicos/empregador/consultarloteeventos/WsConsultarLoteEventos.svc',
  },
  HOMOLOGACAO: {
    envioLote:
      'https://webservices.homologacao.esocial.gov.br/servicos/empregador/enviarloteeventos/WsEnviarLoteEventos.svc',
    consultaLote:
      'https://webservices.homologacao.esocial.gov.br/servicos/empregador/consultarloteeventos/WsConsultarLoteEventos.svc',
  },
} as const;

export interface BatchTransmitResult {
  protocol: string;
  status: string;
  responseXml?: string;
}

export interface BatchStatusResult {
  status: string;
  events: Array<{
    id: string;
    receipt?: string;
    rejectionCode?: string;
    rejectionMessage?: string;
  }>;
}

export interface CertificateAuth {
  pfx: Buffer;
  passphrase: string;
}

export class EsocialSoapClient {
  /**
   * Send a batch of signed events to eSocial.
   */
  async sendBatch(
    signedEvents: Array<{ id: string; xml: string }>,
    environment: 'PRODUCAO' | 'HOMOLOGACAO',
    certificate: CertificateAuth,
  ): Promise<BatchTransmitResult> {
    const endpoint = ENDPOINTS[environment].envioLote;

    // Build events XML
    const eventsXml = signedEvents
      .map((evt, idx) => `<evento Id="ID${idx + 1}">${evt.xml}</evento>`)
      .join('\n');

    // Build SOAP envelope
    const groupId = `GRP_${Date.now()}`;
    const soapEnvelope = this.buildEnvioLoteEnvelope(groupId, eventsXml);

    // Send via HTTPS with mTLS
    const responseXml = await this.sendRequest(
      endpoint,
      soapEnvelope,
      certificate,
      'http://www.esocial.gov.br/servicos/empregador/lote/eventos/envio/v1_1_0/ServicoEnviarLoteEventos/EnviarLoteEventos',
    );

    // Parse response
    return this.parseEnvioResponse(responseXml);
  }

  /**
   * Check the status of a previously transmitted batch.
   */
  async checkBatchStatus(
    protocol: string,
    environment: 'PRODUCAO' | 'HOMOLOGACAO',
    certificate: CertificateAuth,
  ): Promise<BatchStatusResult> {
    const endpoint = ENDPOINTS[environment].consultaLote;

    const soapEnvelope = this.buildConsultaLoteEnvelope(protocol);

    const responseXml = await this.sendRequest(
      endpoint,
      soapEnvelope,
      certificate,
      'http://www.esocial.gov.br/servicos/empregador/lote/eventos/envio/consulta/retornoProcessamento/v1_1_0/ServicoConsultarLoteEventos/ConsultarLoteEventos',
    );

    return this.parseConsultaResponse(responseXml);
  }

  /**
   * Build the SOAP envelope for batch event submission.
   */
  private buildEnvioLoteEnvelope(groupId: string, eventsXml: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:v1="http://www.esocial.gov.br/servicos/empregador/lote/eventos/envio/v1_1_0">
  <soapenv:Header/>
  <soapenv:Body>
    <v1:EnviarLoteEventos>
      <v1:loteEventos>
        <eSocial xmlns="http://www.esocial.gov.br/schema/lote/eventos/envio/v1_1_1">
          <envioLoteEventos grupo="${groupId}">
            <ideEmpregador>
              <tpInsc>1</tpInsc>
              <nrInsc></nrInsc>
            </ideEmpregador>
            <ideTransmissor>
              <tpInsc>1</tpInsc>
              <nrInsc></nrInsc>
            </ideTransmissor>
            <eventos>
              ${eventsXml}
            </eventos>
          </envioLoteEventos>
        </eSocial>
      </v1:loteEventos>
    </v1:EnviarLoteEventos>
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Build the SOAP envelope for batch status query.
   */
  private buildConsultaLoteEnvelope(protocol: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:v1="http://www.esocial.gov.br/servicos/empregador/lote/eventos/envio/consulta/retornoProcessamento/v1_1_0">
  <soapenv:Header/>
  <soapenv:Body>
    <v1:ConsultarLoteEventos>
      <v1:consulta>
        <eSocial xmlns="http://www.esocial.gov.br/schema/consulta/lote/eventos/retornoProcessamento/v1_0_0">
          <consultaLoteEventos>
            <protocoloEnvio>${protocol}</protocoloEnvio>
          </consultaLoteEventos>
        </eSocial>
      </v1:consulta>
    </v1:ConsultarLoteEventos>
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Send SOAP request via HTTPS with mutual TLS (client certificate).
   */
  private sendRequest(
    url: string,
    soapEnvelope: string,
    certificate: CertificateAuth,
    soapAction: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);

      const options: https.RequestOptions = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname,
        method: 'POST',
        pfx: certificate.pfx,
        passphrase: certificate.passphrase,
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'Content-Length': Buffer.byteLength(soapEnvelope, 'utf-8'),
          SOAPAction: soapAction,
        },
        rejectUnauthorized: true,
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(
              new Error(
                `SOAP request failed with status ${res.statusCode}: ${data.slice(0, 500)}`,
              ),
            );
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`SOAP request error: ${error.message}`));
      });

      req.write(soapEnvelope);
      req.end();
    });
  }

  /**
   * Parse the envio (transmission) response XML.
   */
  private parseEnvioResponse(responseXml: string): BatchTransmitResult {
    // Extract protocol from response
    const protocolMatch = responseXml.match(
      /<protocoloEnvio>([^<]+)<\/protocoloEnvio>/,
    );
    const statusMatch = responseXml.match(/<cdResposta>([^<]+)<\/cdResposta>/);

    if (!protocolMatch) {
      // Check for error
      const errorMatch = responseXml.match(
        /<descResposta>([^<]+)<\/descResposta>/,
      );
      throw new Error(
        `eSocial transmission failed: ${errorMatch?.[1] || 'Unknown error'}`,
      );
    }

    return {
      protocol: protocolMatch[1],
      status: statusMatch?.[1] || 'UNKNOWN',
      responseXml,
    };
  }

  /**
   * Parse the consulta (status check) response XML.
   */
  private parseConsultaResponse(responseXml: string): BatchStatusResult {
    const statusMatch = responseXml.match(/<cdResposta>([^<]+)<\/cdResposta>/);

    // Extract individual event results
    const events: BatchStatusResult['events'] = [];
    const eventPattern = /<evento\s+Id="([^"]+)"[^>]*>[\s\S]*?<\/evento>/g;
    let match: RegExpExecArray | null;

    while ((match = eventPattern.exec(responseXml)) !== null) {
      const eventXml = match[0];
      const id = match[1];

      const receiptMatch = eventXml.match(/<nrRecibo>([^<]+)<\/nrRecibo>/);
      const rejCodeMatch = eventXml.match(/<cdResposta>([^<]+)<\/cdResposta>/);
      const rejMsgMatch = eventXml.match(
        /<descResposta>([^<]+)<\/descResposta>/,
      );

      events.push({
        id,
        receipt: receiptMatch?.[1],
        rejectionCode: rejCodeMatch?.[1],
        rejectionMessage: rejMsgMatch?.[1],
      });
    }

    return {
      status: statusMatch?.[1] || 'UNKNOWN',
      events,
    };
  }
}
