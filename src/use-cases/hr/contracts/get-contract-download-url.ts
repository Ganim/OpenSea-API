import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { GeneratedEmploymentContract } from '@/entities/hr/generated-employment-contract';
import type { GeneratedEmploymentContractsRepository } from '@/repositories/hr/generated-employment-contracts-repository';
import type { FileUploadService } from '@/services/storage/file-upload-service';

export interface GetContractDownloadUrlRequest {
  tenantId: string;
  contractId: string;
  expiresInSeconds?: number;
}

export interface GetContractDownloadUrlResponse {
  contract: GeneratedEmploymentContract;
  downloadUrl: string;
  expiresInSeconds: number;
}

const DEFAULT_EXPIRATION_SECONDS = 300;

export class GetContractDownloadUrlUseCase {
  constructor(
    private generatedContractsRepository: GeneratedEmploymentContractsRepository,
    private fileUploadService: FileUploadService,
  ) {}

  async execute(
    request: GetContractDownloadUrlRequest,
  ): Promise<GetContractDownloadUrlResponse> {
    const {
      tenantId,
      contractId,
      expiresInSeconds = DEFAULT_EXPIRATION_SECONDS,
    } = request;

    const contract = await this.generatedContractsRepository.findById(
      new UniqueEntityID(contractId),
      tenantId,
    );
    if (!contract) {
      throw new ResourceNotFoundError('Generated contract not found');
    }
    if (!contract.pdfKey) {
      throw new BadRequestError(
        'Contract has no associated PDF available for download',
      );
    }

    const downloadUrl = await this.fileUploadService.getPresignedUrl(
      contract.pdfKey,
      expiresInSeconds,
    );

    return {
      contract,
      downloadUrl,
      expiresInSeconds,
    };
  }
}
