import { PrismaContractTemplatesRepository } from '@/repositories/hr/prisma/prisma-contract-templates-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaGeneratedEmploymentContractsRepository } from '@/repositories/hr/prisma/prisma-generated-employment-contracts-repository';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';
import { GenerateContractPDFUseCase } from '../generate-contract-pdf';

export function makeGenerateContractPDFUseCase(): GenerateContractPDFUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  const contractTemplatesRepository = new PrismaContractTemplatesRepository();
  const generatedContractsRepository =
    new PrismaGeneratedEmploymentContractsRepository();
  const fileUploadService = S3FileUploadService.getInstance();

  return new GenerateContractPDFUseCase(
    employeesRepository,
    contractTemplatesRepository,
    generatedContractsRepository,
    fileUploadService,
  );
}
