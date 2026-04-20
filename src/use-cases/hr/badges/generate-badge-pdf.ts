import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  renderIndividualBadge,
  type BadgeData,
} from '@/lib/pdf/badge-pdf-renderer';
import type { TenantsRepository } from '@/repositories/core/tenants-repository';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { RotateQrTokenUseCase } from '@/use-cases/hr/qr-tokens/rotate-qr-token';

/**
 * Individual crachá PDF generation (Phase 5 / Plan 05-06 Task 1).
 *
 * Flow per CONTEXT D-14 "admin baixa novo crachá na sequência":
 *   1. Resolve the employee + tenant (tenant-scoped lookup).
 *   2. Rotate the QR token via {@link RotateQrTokenUseCase} — returns the
 *      plaintext 64-hex token ONCE. Every print invalidates the previous
 *      crachá intentionally (D-14 contract).
 *   3. Build a {@link BadgeData} view-model and hand it to the pure pdfkit
 *      renderer. Returns `{ pdf, filename }` for the HTTP controller to
 *      stream as `application/pdf`.
 *
 * The plaintext token is never logged or persisted beyond the rotation hash
 * on `Employee.qrTokenHash`. Controllers audit the rotation via
 * `AUDIT_MESSAGES.HR.PUNCH_QR_TOKEN_ROTATED`.
 */
export interface GenerateBadgePdfRequest {
  tenantId: string;
  employeeId: string;
  rotatedByUserId: string;
}

export interface GenerateBadgePdfResponse {
  pdf: Buffer;
  filename: string;
}

export class GenerateBadgePdfUseCase {
  constructor(
    private readonly employeesRepo: EmployeesRepository,
    private readonly tenantsRepo: TenantsRepository,
    private readonly rotateQrTokenUseCase: RotateQrTokenUseCase,
  ) {}

  async execute(
    input: GenerateBadgePdfRequest,
  ): Promise<GenerateBadgePdfResponse> {
    const employee = await this.employeesRepo.findById(
      new UniqueEntityID(input.employeeId),
      input.tenantId,
    );
    if (!employee) {
      throw new ResourceNotFoundError('Funcionário não encontrado');
    }

    const tenant = await this.tenantsRepo.findById(
      new UniqueEntityID(input.tenantId),
    );
    if (!tenant) {
      throw new ResourceNotFoundError('Tenant não encontrado');
    }

    const { token, rotatedAt } = await this.rotateQrTokenUseCase.execute({
      tenantId: input.tenantId,
      employeeId: input.employeeId,
      rotatedByUserId: input.rotatedByUserId,
    });

    const brandColor = extractBrandColor(tenant.settings);

    const data: BadgeData = {
      employeeId: employee.id.toString(),
      fullName: employee.fullName,
      socialName: employee.socialName ?? null,
      registration: employee.registrationNumber,
      photoUrl: employee.photoUrl ?? null,
      qrToken: token,
      tenantName: tenant.name,
      tenantLogoUrl: tenant.logoUrl ?? null,
      tenantBrandColor: brandColor,
      rotatedAt: new Date(rotatedAt),
    };

    const pdf = await renderIndividualBadge(data);
    return {
      pdf,
      filename: `cracha-${employee.registrationNumber}.pdf`,
    };
  }
}

function extractBrandColor(settings: Record<string, unknown>): string {
  const raw = settings?.brandColor;
  if (typeof raw === 'string' && /^#[0-9a-fA-F]{6}$/.test(raw)) return raw;
  return '#2563EB';
}
