import { createHash } from 'node:crypto';
import path from 'node:path';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SignatureEnvelope } from '@/entities/signature/signature-envelope';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { GeneratedEmploymentContractsRepository } from '@/repositories/hr/generated-employment-contracts-repository';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { FileUploadService } from '@/services/storage/file-upload-service';
import type { CreateEnvelopeUseCase } from '@/use-cases/signature/envelopes/create-envelope';
import type { GetEnvelopeByIdUseCase } from '@/use-cases/signature/envelopes/get-envelope-by-id';

const DEFAULT_EXPIRATION_DAYS = 14;
const PDF_MIME_TYPE = 'application/pdf';

interface RequestContractSignatureUseCaseRequest {
  tenantId: string;
  contractId: string;
  userId: string;
  signerEmail?: string;
  signerName?: string;
  expiresInDays?: number;
}

interface RequestContractSignatureUseCaseResponse {
  envelope: SignatureEnvelope;
  envelopeId: string;
}

interface ResolvedPdfDocument {
  storageFileId: string;
  documentHash: string;
}

export class RequestContractSignatureUseCase {
  constructor(
    private generatedContractsRepository: GeneratedEmploymentContractsRepository,
    private employeesRepository: EmployeesRepository,
    private storageFilesRepository: StorageFilesRepository,
    private createEnvelopeUseCase: CreateEnvelopeUseCase,
    private getEnvelopeByIdUseCase: GetEnvelopeByIdUseCase,
    private fileUploadService: FileUploadService,
  ) {}

  async execute(
    input: RequestContractSignatureUseCaseRequest,
  ): Promise<RequestContractSignatureUseCaseResponse> {
    const contract = await this.generatedContractsRepository.findById(
      new UniqueEntityID(input.contractId),
      input.tenantId,
    );

    if (!contract) {
      throw new ResourceNotFoundError('Employment contract not found.');
    }

    if (contract.signatureEnvelopeId) {
      const { envelope: existingEnvelope } =
        await this.getEnvelopeByIdUseCase.execute({
          tenantId: input.tenantId,
          envelopeId: contract.signatureEnvelopeId,
        });

      const isActive =
        existingEnvelope.status === 'DRAFT' ||
        existingEnvelope.status === 'PENDING' ||
        existingEnvelope.status === 'IN_PROGRESS';

      if (isActive) {
        throw new BadRequestError(
          'Contrato já enviado para assinatura. Cancele o envio atual antes de criar um novo.',
        );
      }

      await this.generatedContractsRepository.updateSignatureEnvelopeId(
        contract.id,
        null,
        input.tenantId,
      );
      contract.signatureEnvelopeId = null;
    }

    const employee = await this.employeesRepository.findById(
      contract.employeeId,
      input.tenantId,
    );

    if (!employee) {
      throw new ResourceNotFoundError('Employee linked to contract not found.');
    }

    const signerEmail = input.signerEmail ?? employee.email;
    if (!signerEmail) {
      throw new BadRequestError(
        'Funcionário não possui e-mail cadastrado. Informe o signerEmail para continuar.',
      );
    }
    const signerName = input.signerName ?? employee.fullName;

    const { storageFileId, documentHash } = await this.resolvePdfDocument(
      contract.id,
      input.tenantId,
      input.userId,
    );

    const expiresAt = new Date(
      Date.now() +
        (input.expiresInDays ?? DEFAULT_EXPIRATION_DAYS) * 24 * 60 * 60 * 1000,
    );

    const { envelope } = await this.createEnvelopeUseCase.execute({
      tenantId: input.tenantId,
      title: `Contrato de trabalho — ${employee.fullName}`,
      signatureLevel: 'ADVANCED',
      documentFileId: storageFileId,
      documentHash,
      sourceModule: 'hr',
      sourceEntityType: 'employment_contract',
      sourceEntityId: input.contractId,
      routingType: 'SEQUENTIAL',
      createdByUserId: input.userId,
      expiresAt,
      signers: [
        {
          externalName: signerName,
          externalEmail: signerEmail,
          externalDocument: employee.cpf?.value ?? undefined,
          order: 1,
          group: 1,
          role: 'SIGNER',
          signatureLevel: 'ADVANCED',
        },
      ],
    });

    await this.generatedContractsRepository.updateSignatureEnvelopeId(
      contract.id,
      envelope.id.toString(),
      input.tenantId,
    );

    return { envelope, envelopeId: envelope.id.toString() };
  }

  /**
   * Ensures the contract has a StorageFile row backing its PDF and returns the
   * storage file id + SHA-256 hash of the actual bytes in object storage.
   *
   * If the contract was generated with only a pdfKey (no StorageFile row yet —
   * legacy path in {@link GenerateContractPDFUseCase}), this creates the row
   * on demand and attaches it to the contract.
   */
  private async resolvePdfDocument(
    contractId: UniqueEntityID,
    tenantId: string,
    userId: string,
  ): Promise<ResolvedPdfDocument> {
    const contract = await this.generatedContractsRepository.findById(
      contractId,
      tenantId,
    );
    if (!contract) {
      throw new ResourceNotFoundError('Employment contract not found.');
    }

    if (contract.storageFileId) {
      const existingFile = await this.storageFilesRepository.findById(
        contract.storageFileId,
        tenantId,
      );
      if (existingFile) {
        const buffer = await this.fileUploadService.getObject(
          existingFile.fileKey,
        );
        const documentHash = createHash('sha256').update(buffer).digest('hex');
        return {
          storageFileId: existingFile.id.toString(),
          documentHash,
        };
      }
    }

    if (!contract.pdfKey) {
      throw new BadRequestError(
        'Contrato ainda não possui PDF gerado. Gere o PDF antes de enviar para assinatura.',
      );
    }

    const pdfBuffer = await this.fileUploadService.getObject(contract.pdfKey);
    const baseName = path.basename(contract.pdfKey);

    const storageFile = await this.storageFilesRepository.create({
      tenantId,
      folderId: null,
      name: baseName,
      originalName: baseName,
      fileKey: contract.pdfKey,
      path: `/${baseName}`,
      size: pdfBuffer.length,
      mimeType: PDF_MIME_TYPE,
      fileType: 'DOCUMENT',
      entityType: 'employment_contract',
      entityId: contract.id.toString(),
      uploadedBy: userId,
    });

    contract.attachStorageFile(storageFile.id);
    await this.generatedContractsRepository.save(contract);

    const documentHash = createHash('sha256').update(pdfBuffer).digest('hex');

    return {
      storageFileId: storageFile.id.toString(),
      documentHash,
    };
  }
}
