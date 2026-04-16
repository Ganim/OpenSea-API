import { PrismaGeneratedEmploymentContractsRepository } from '@/repositories/hr/prisma/prisma-generated-employment-contracts-repository';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';
import { GetContractDownloadUrlUseCase } from '../get-contract-download-url';

export function makeGetContractDownloadUrlUseCase(): GetContractDownloadUrlUseCase {
  const generatedContractsRepository =
    new PrismaGeneratedEmploymentContractsRepository();
  const fileUploadService = S3FileUploadService.getInstance();

  return new GetContractDownloadUrlUseCase(
    generatedContractsRepository,
    fileUploadService,
  );
}
