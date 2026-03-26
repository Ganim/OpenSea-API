import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import type { AccountantAccessesRepository } from '@/repositories/finance/accountant-accesses-repository';
import {
  SpedExportService,
  type SpedFormat,
  type SpedExportResult,
} from '@/services/finance/sped-export.service';

interface ExportSpedRequest {
  accessToken: string;
  year: number;
  startMonth?: number;
  endMonth?: number;
  format: SpedFormat;
}

export class ExportSpedUseCase {
  constructor(
    private accountantAccessesRepository: AccountantAccessesRepository,
    private spedExportService: SpedExportService,
  ) {}

  async execute(request: ExportSpedRequest): Promise<SpedExportResult> {
    const {
      accessToken,
      year,
      startMonth = 1,
      endMonth = 12,
      format,
    } = request;

    // Validate token
    const access =
      await this.accountantAccessesRepository.findByToken(accessToken);

    if (!access) {
      throw new UnauthorizedError('Token de acesso inválido.');
    }

    if (!access.isActive) {
      throw new UnauthorizedError('Acesso desativado.');
    }

    if (access.expiresAt && access.expiresAt < new Date()) {
      throw new UnauthorizedError('Token de acesso expirado.');
    }

    // Update last access
    await this.accountantAccessesRepository.updateLastAccess(access.id);

    return this.spedExportService.export({
      tenantId: access.tenantId,
      year,
      startMonth,
      endMonth,
      format,
    });
  }
}
