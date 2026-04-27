/**
 * EnrollPin use case — Plan 10-04 Task 4.3.
 *
 * Admin calls this endpoint after the agent completes local enrollment.
 * The API records the enrollment event in the audit log.
 *
 * LGPD invariant PUNCH-BIO-03:
 *   - Input schema does NOT accept iso_template_blob or any biometric buffer.
 *   - Audit newData contains ONLY: deviceId, targetEmployeeId, qualityScores, avgScore.
 *   - Templates never leave the agent — this endpoint is an audit gate, not a
 *     template storage mechanism.
 *
 * D-J1: Authorization is enforced via verifyActionPin middleware in the controller
 * (admin types their action PIN which is validated server-side via a pre-issued token).
 *
 * Clean Architecture: pure use case — no FastifyRequest/reply dependencies.
 */
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';

// Minimal repository interfaces required by this use case
export interface EnrollPinEmployeesRepository {
  findById(
    id: string,
    tenantId?: string,
  ): Promise<{ id: string; tenantId?: string; name?: string } | null>;
}

export interface EnrollPinDevicesRepository {
  findById(
    id: string,
    tenantId?: string,
  ): Promise<{
    id: string;
    tenantId?: string;
    status?: string;
    paired?: boolean;
  } | null>;
}

export interface EnrollPinAuditLogsRepository {
  log(entry: {
    tenantId: string;
    userId: string;
    action: string;
    entity: string;
    entityId: string;
    newData: Record<string, unknown>;
  }): Promise<{ id: string }>;
}

export interface EnrollPinRequest {
  tenantId: string;
  actorUserId: string;
  deviceId: string;
  targetEmployeeId: string;
  /** Capture quality scores for 3 fingerprints — NEVER include template buffer */
  qualityScores: number[];
  avgScore: number;
}

export interface EnrollPinResponse {
  ok: true;
  auditLogId: string;
}

/** Minimum average quality score to accept enrollment (server-side mirror of agent gate) */
const MIN_AVG_SCORE = 50;

export class EnrollPinUseCase {
  constructor(
    private readonly employeesRepository: EnrollPinEmployeesRepository,
    private readonly punchDevicesRepository: EnrollPinDevicesRepository,
    private readonly auditLogsRepository: EnrollPinAuditLogsRepository,
  ) {}

  async execute(input: EnrollPinRequest): Promise<EnrollPinResponse> {
    const {
      tenantId,
      actorUserId,
      deviceId,
      targetEmployeeId,
      qualityScores,
      avgScore,
    } = input;

    // Server-side mirror of agent quality gate
    if (avgScore < MIN_AVG_SCORE) {
      throw new BadRequestError(
        `avgScore ${avgScore.toFixed(1)} is below minimum ${MIN_AVG_SCORE}`,
      );
    }

    // Validate employee exists
    const employee = await this.employeesRepository.findById(
      targetEmployeeId,
      tenantId,
    );
    if (!employee) {
      throw new ResourceNotFoundError(`Employee ${targetEmployeeId} not found`);
    }

    // Validate device exists
    const device = await this.punchDevicesRepository.findById(
      deviceId,
      tenantId,
    );
    if (!device) {
      throw new ResourceNotFoundError(`PunchDevice ${deviceId} not found`);
    }

    // Dual-write audit — LGPD: newData has NO template data
    const auditLog = await this.auditLogsRepository.log({
      tenantId,
      userId: actorUserId,
      action: AuditAction.BIO_ENROLLED,
      entity: AuditEntity.PUNCH_BIO_AGENT,
      entityId: deviceId,
      newData: {
        deviceId,
        targetEmployeeId,
        qualityScores,
        avgScore,
        captureCount: qualityScores.length,
      },
    });

    return { ok: true, auditLogId: auditLog.id.toString() };
  }
}
