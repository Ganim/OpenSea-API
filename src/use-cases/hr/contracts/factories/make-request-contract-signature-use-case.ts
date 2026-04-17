import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaGeneratedEmploymentContractsRepository } from '@/repositories/hr/prisma/prisma-generated-employment-contracts-repository';
import { PrismaStorageFilesRepository } from '@/repositories/storage/prisma/prisma-storage-files-repository';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';
import { makeCreateEnvelopeUseCase } from '@/use-cases/signature/envelopes/factories/make-create-envelope-use-case';
import { makeGetEnvelopeByIdUseCase } from '@/use-cases/signature/envelopes/factories/make-get-envelope-by-id-use-case';
import { RequestContractSignatureUseCase } from '../request-contract-signature';

export function makeRequestContractSignatureUseCase(): RequestContractSignatureUseCase {
  return new RequestContractSignatureUseCase(
    new PrismaGeneratedEmploymentContractsRepository(),
    new PrismaEmployeesRepository(),
    new PrismaStorageFilesRepository(),
    makeCreateEnvelopeUseCase(),
    makeGetEnvelopeByIdUseCase(),
    S3FileUploadService.getInstance(),
  );
}
