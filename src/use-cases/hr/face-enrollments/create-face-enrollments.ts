import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FaceEnrollment } from '@/entities/hr/face-enrollment';
import { encryptEmbedding } from '@/lib/face-encryption';
import {
  type FaceEnrollmentDTO,
  faceEnrollmentToDto,
} from '@/mappers/hr/face-enrollment/to-dto';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { FaceEnrollmentsRepository } from '@/repositories/hr/face-enrollments-repository';

/**
 * Creates a face-enrollment batch for an employee.
 *
 * Contract (D-05 / D-07):
 *   - admin captures 3-5 embeddings in the client, sends them as raw number[]
 *   - this use case encrypts each one with AES-256-GCM (fresh IV per row)
 *     and persists via `repo.createMany` atomically
 *   - existing active enrollments are soft-deleted FIRST (replace policy
 *     D-05: "Refazer enrollment" invalidates the previous batch)
 *   - consentTextHash is REQUIRED (sha256 hex of the LGPD consent text
 *     the admin presented before capture); the controller writes the
 *     matching CONSENT_GIVEN audit log BEFORE calling this use case and
 *     passes the resulting auditLogId so the enrollment rows FK back to it
 *
 * The response DTOs are scrubbed of embedding/iv/authTag (T-FACE-03).
 */
export interface CreateFaceEnrollmentsRequest {
  tenantId: string;
  employeeId: string;
  /** Each inner array must have exactly 128 floats (face-api.js descriptor). */
  embeddings: number[][];
  /**
   * sha256 hex digest of the LGPD consent text the admin accepted. 64 chars.
   * The controller captures this in the consent audit log; use cases reject
   * any request that arrives without it.
   */
  consentTextHash: string;
  capturedByUserId: string;
  /**
   * AuditLog id of the PUNCH_FACE_ENROLLMENT_CONSENT_GIVEN entry recorded by
   * the controller BEFORE calling this use case. Stored on every enrollment
   * row for LGPD traceability (one consent → N photos of the same batch).
   */
  consentAuditLogId: string | null;
}

export interface CreateFaceEnrollmentsResponse {
  enrollments: FaceEnrollmentDTO[];
  /** Number of previously-active rows that were soft-deleted. */
  replacedCount: number;
}

export class CreateFaceEnrollmentsUseCase {
  constructor(
    private readonly faceEnrollmentsRepo: FaceEnrollmentsRepository,
    private readonly employeesRepo: EmployeesRepository,
  ) {}

  async execute(
    input: CreateFaceEnrollmentsRequest,
  ): Promise<CreateFaceEnrollmentsResponse> {
    if (input.embeddings.length < 3) {
      throw new BadRequestError('Cadastro mínimo de 3 fotos');
    }
    if (input.embeddings.length > 5) {
      throw new BadRequestError('Cadastro máximo de 5 fotos');
    }
    for (let i = 0; i < input.embeddings.length; i++) {
      if (input.embeddings[i].length !== 128) {
        throw new BadRequestError(
          `Embedding ${i + 1} deve ter exatamente 128 dimensões`,
        );
      }
    }
    if (!input.consentTextHash || input.consentTextHash.length < 16) {
      throw new BadRequestError('Hash do termo de consentimento obrigatório');
    }

    const employee = await this.employeesRepo.findById(
      new UniqueEntityID(input.employeeId),
      input.tenantId,
    );
    if (!employee) {
      throw new ResourceNotFoundError('Funcionário não encontrado');
    }

    // D-05 replace policy: previous enrollments are soft-deleted BEFORE the
    // new batch is persisted. Surfacing `replacedCount` lets the admin UI
    // confirm that the user's prior biometrics were invalidated.
    const replacedCount =
      await this.faceEnrollmentsRepo.softDeleteAllByEmployee(
        input.employeeId,
        input.tenantId,
      );

    const entities: FaceEnrollment[] = input.embeddings.map((raw, idx) => {
      // face-api.js descriptors are plain JS arrays; marshal into Float32
      // before encryption so the endianness-sensitive Buffer.from(v.buffer)
      // path stays consistent (Pitfall 3 in face-encryption.ts).
      const vec = new Float32Array(raw);
      const { ciphertext, iv, authTag } = encryptEmbedding(vec);
      return FaceEnrollment.create({
        tenantId: new UniqueEntityID(input.tenantId),
        employeeId: new UniqueEntityID(input.employeeId),
        embedding: ciphertext,
        iv,
        authTag,
        photoCount: idx + 1,
        capturedAt: new Date(),
        capturedByUserId: new UniqueEntityID(input.capturedByUserId),
        consentAuditLogId: input.consentAuditLogId,
      });
    });

    await this.faceEnrollmentsRepo.createMany(entities);

    return {
      enrollments: entities.map(faceEnrollmentToDto),
      replacedCount,
    };
  }
}
