import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { convertPfxToPem } from '@/services/banking/convert-pfx';
import type { FileUploadService } from '@/services/storage/file-upload-service';

interface ConvertPfxCertificateRequest {
  tenantId: string;
  bankAccountId: string;
  pfxBuffer: Buffer;
  pfxPassword: string;
}

interface ConvertPfxCertificateResponse {
  certFileId: string;
  keyFileId: string;
}

export class ConvertPfxCertificateUseCase {
  constructor(private fileUploadService: FileUploadService) {}

  async execute(
    request: ConvertPfxCertificateRequest,
  ): Promise<ConvertPfxCertificateResponse> {
    const { tenantId, bankAccountId, pfxBuffer, pfxPassword } = request;

    let cert: Buffer;
    let key: Buffer;

    try {
      const result = convertPfxToPem(pfxBuffer, pfxPassword);
      cert = result.cert;
      key = result.key;
    } catch (err) {
      throw new BadRequestError(
        err instanceof Error
          ? `Falha ao converter certificado: ${err.message}`
          : 'Falha ao converter o arquivo .pfx. Verifique a senha.',
      );
    }

    // Upload cert PEM to S3
    const certResult = await this.fileUploadService.upload(
      cert,
      `${bankAccountId}-cert.pem`,
      'application/x-pem-file',
      {
        prefix: `tenants/${tenantId}/bank-certificates`,
      },
    );

    // Upload key PEM to S3
    const keyResult = await this.fileUploadService.upload(
      key,
      `${bankAccountId}-key.pem`,
      'application/x-pem-file',
      {
        prefix: `tenants/${tenantId}/bank-certificates`,
      },
    );

    return {
      certFileId: certResult.key,
      keyFileId: keyResult.key,
    };
  }
}
