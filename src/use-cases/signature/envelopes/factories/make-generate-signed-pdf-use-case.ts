import { PrismaSignatureEnvelopeSignersRepository } from '@/repositories/signature/prisma/prisma-signature-envelope-signers-repository';
import { PrismaSignatureEnvelopesRepository } from '@/repositories/signature/prisma/prisma-signature-envelopes-repository';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';
import { GenerateSignedPDFUseCase } from '../generate-signed-pdf';

export function makeGenerateSignedPDFUseCase() {
  return new GenerateSignedPDFUseCase(
    new PrismaSignatureEnvelopesRepository(),
    new PrismaSignatureEnvelopeSignersRepository(),
    S3FileUploadService.getInstance(),
  );
}
