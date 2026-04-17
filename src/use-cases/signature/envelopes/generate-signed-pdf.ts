import { env } from '@/@env';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SignatureEnvelopeSigner } from '@/entities/signature/signature-envelope-signer';
import { appendSignatureCertificate, maskCPF } from '@/lib/signature/pdf-stamp';
import type { SignerStampData } from '@/lib/signature/pdf-stamp';
import { errorLogger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import type { SignatureEnvelopeSignersRepository } from '@/repositories/signature/signature-envelope-signers-repository';
import type { SignatureEnvelopesRepository } from '@/repositories/signature/signature-envelopes-repository';
import type { FileUploadService } from '@/services/storage/file-upload-service';
import { randomUUID } from 'node:crypto';

export interface GenerateSignedPDFRequest {
  tenantId: string;
  envelopeId: string;
}

export interface GenerateSignedPDFResponse {
  signedFileId: string | null;
  signedPdfUrl: string | null;
}

const SIGNED_PDF_UPLOAD_PREFIX = 'signature/signed';
const SIGNED_PDF_MIME_TYPE = 'application/pdf';

export class GenerateSignedPDFUseCase {
  constructor(
    private envelopesRepository: SignatureEnvelopesRepository,
    private signersRepository: SignatureEnvelopeSignersRepository,
    private fileUploadService: FileUploadService,
  ) {}

  async execute(
    request: GenerateSignedPDFRequest,
  ): Promise<GenerateSignedPDFResponse> {
    const envelope = await this.envelopesRepository.findById(
      new UniqueEntityID(request.envelopeId),
      request.tenantId,
    );

    if (!envelope) {
      throw new ResourceNotFoundError('Envelope not found');
    }

    const allSigners = await this.signersRepository.findByEnvelopeId(
      envelope.id.toString(),
    );
    const signedSigners = allSigners.filter(
      (signer) => signer.status === 'SIGNED',
    );

    // Load original PDF via Prisma → fileKey → storage provider
    const originalFile = await prisma.storageFile.findUnique({
      where: { id: envelope.documentFileId },
    });

    if (!originalFile) {
      throw new ResourceNotFoundError('Original document file not found');
    }

    const originalBuffer = await this.fileUploadService.getObject(
      originalFile.fileKey,
    );

    const verifyUrl = `${env.FRONTEND_URL.replace(/\/+$/, '')}/verify/${envelope.verificationCode ?? envelope.id.toString()}`;

    const signerStampData: SignerStampData[] = signedSigners.map(
      (signer: SignatureEnvelopeSigner) => ({
        name: signer.externalName ?? signer.displayName,
        cpfMasked: maskCPF(signer.externalDocument ?? ''),
        signedAt: signer.signedAt ?? new Date(),
        ipAddress: signer.ipAddress,
        userAgent: signer.userAgent,
        signatureLevel: signer.signatureLevel,
      }),
    );

    const stampedBuffer = await appendSignatureCertificate(originalBuffer, {
      envelopeTitle: envelope.title,
      verificationCode: envelope.verificationCode ?? envelope.id.toString(),
      documentHash: envelope.documentHash,
      signers: signerStampData,
      verifyUrl,
    });

    const fileName = `signed-${envelope.id.toString()}.pdf`;
    const uploadResult = await this.fileUploadService.upload(
      stampedBuffer,
      fileName,
      SIGNED_PDF_MIME_TYPE,
      { prefix: `${SIGNED_PDF_UPLOAD_PREFIX}/${request.tenantId}` },
    );

    const signedFileId = randomUUID();
    const signedPath = `/signature/signed/${fileName}`;

    await prisma.storageFile.create({
      data: {
        id: signedFileId,
        tenantId: request.tenantId,
        folderId: null,
        name: fileName,
        originalName: fileName,
        fileKey: uploadResult.key,
        path: signedPath,
        size: uploadResult.size,
        mimeType: uploadResult.mimeType,
        fileType: 'DOCUMENT',
        status: 'ACTIVE',
        currentVersion: 1,
        uploadedBy: envelope.createdByUserId,
        isHidden: true, // signed PDFs are surfaced only through the envelope UI
        isProtected: false,
        entityType: 'SignatureEnvelope',
        entityId: envelope.id.toString(),
      },
    });

    await prisma.storageFileVersion.create({
      data: {
        id: randomUUID(),
        fileId: signedFileId,
        version: 1,
        fileKey: uploadResult.key,
        size: uploadResult.size,
        mimeType: uploadResult.mimeType,
        uploadedBy: envelope.createdByUserId,
      },
    });

    await this.envelopesRepository.update({
      id: envelope.id.toString(),
      signedFileId,
    });

    return {
      signedFileId,
      signedPdfUrl: uploadResult.url,
    };
  }

  /**
   * Safe wrapper that logs + swallows any failure so envelope completion is
   * never blocked by a stamping error. HR / Sales can retry via admin endpoint.
   */
  async executeSafely(
    request: GenerateSignedPDFRequest,
  ): Promise<GenerateSignedPDFResponse> {
    try {
      return await this.execute(request);
    } catch (error) {
      errorLogger.error(
        {
          error: {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          },
          envelopeId: request.envelopeId,
          tenantId: request.tenantId,
        },
        'GenerateSignedPDF: non-fatal stamping failure',
      );
      return { signedFileId: null, signedPdfUrl: null };
    }
  }
}
