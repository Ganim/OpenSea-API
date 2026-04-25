import { randomUUID } from 'node:crypto';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { FileUploadService } from '@/services/storage/file-upload-service';

/**
 * Phase 8 / Plan 08-03 / Task 2 — D-08-03-01.
 *
 * Owner-only upload de evidência (foto/PDF) para o flow self-justify da PWA
 * pessoal. Diferente de `UploadPunchApprovalEvidenceUseCase` (Phase 7-03 D-10
 * — gestor uploadando PDF, PIN obrigatório, 10MB cap) este use case é
 * orientado ao funcionário próprio:
 *
 *  - Sem PIN gate (D-08 ratificado por D-08-03-01).
 *  - Aceita JPG/PNG/PDF (3 tipos — câmera, galeria, atestado).
 *  - 5MB cap por arquivo (consistente com AttachmentPicker D-08).
 *  - Storage prefix dedicado `self-evidence` para facilitar GC futura.
 *
 * O caller upload um arquivo POR REQUEST e recebe `storageKey`. O frontend
 * acumula até 3 keys e passa para o `CreateSelfPunchApprovalUseCase` que
 * valida via `headObject` antes de criar o PunchApproval.
 */
const MAX_SELF_EVIDENCE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
]);

export interface UploadSelfPunchEvidenceRequest {
  tenantId: string;
  /** request.user.sub — caller deve ter Employee linkado (404 se não). */
  userId: string;
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

export interface UploadSelfPunchEvidenceResponse {
  storageKey: string;
  size: number;
  uploadedAt: string;
  filename: string;
  mimeType: string;
}

export class UploadSelfPunchEvidenceUseCase {
  constructor(
    private readonly employeesRepository: EmployeesRepository,
    private readonly fileUploadService: Pick<
      FileUploadService,
      'uploadWithKey'
    >,
  ) {}

  async execute(
    input: UploadSelfPunchEvidenceRequest,
  ): Promise<UploadSelfPunchEvidenceResponse> {
    if (!ALLOWED_MIME_TYPES.has(input.mimeType.toLowerCase())) {
      throw new BadRequestError(
        `Tipo de arquivo inválido (${input.mimeType}). Aceito: JPG, PNG, PDF.`,
      );
    }
    if (input.buffer.byteLength > MAX_SELF_EVIDENCE_SIZE) {
      throw new BadRequestError(
        `Arquivo excede ${MAX_SELF_EVIDENCE_SIZE / (1024 * 1024)}MB.`,
      );
    }
    if (input.buffer.byteLength === 0) {
      throw new BadRequestError('Arquivo vazio.');
    }

    // Resolver Employee.id para garantir ownership futura no create-self.
    const employee = await this.employeesRepository.findByUserId(
      new UniqueEntityID(input.userId),
      input.tenantId,
    );
    if (!employee) {
      throw new ResourceNotFoundError(
        'Employee record not found for current user',
      );
    }

    const ext = pickExtension(input.mimeType);
    const storageKey = `${input.tenantId}/punch-approvals/self-evidence/${employee.id.toString()}/${randomUUID()}${ext}`;

    await this.fileUploadService.uploadWithKey(input.buffer, storageKey, {
      mimeType: input.mimeType,
      cacheControl: 'private, max-age=0, no-store',
      metadata: {
        'x-tenant-id': input.tenantId,
        'x-employee-id': employee.id.toString(),
        'x-uploaded-by': input.userId,
        'x-evidence-kind': 'self',
      },
    });

    return {
      storageKey,
      size: input.buffer.byteLength,
      uploadedAt: new Date().toISOString(),
      filename: input.filename,
      mimeType: input.mimeType,
    };
  }
}

function pickExtension(mimeType: string): string {
  const lower = mimeType.toLowerCase();
  if (lower === 'image/jpeg' || lower === 'image/jpg') return '.jpg';
  if (lower === 'image/png') return '.png';
  if (lower === 'application/pdf') return '.pdf';
  return '';
}
