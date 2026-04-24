import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { EsocialConfig } from '@/entities/esocial/esocial-config';
import type {
  EsocialConfigRepository,
  UpdateEsocialConfigData,
} from '@/repositories/esocial/esocial-config-repository';

export interface UpdateEsocialConfigRequest {
  tenantId: string;
  environment?: string;
  version?: string;
  tpInsc?: number;
  nrInsc?: string | null;
  /**
   * Phase 06 Plan 06-06 (D-06) — Número INPI (REP-P), 17 dígitos.
   * null = limpar explicitamente; undefined = não tocar.
   */
  inpiNumber?: string | null;
  autoGenerateOnAdmission?: boolean;
  autoGenerateOnTermination?: boolean;
  autoGenerateOnLeave?: boolean;
  autoGenerateOnPayroll?: boolean;
  requireApproval?: boolean;
}

export interface UpdateEsocialConfigResponse {
  config: EsocialConfig;
}

export class UpdateEsocialConfigUseCase {
  constructor(private configRepository: EsocialConfigRepository) {}

  async execute(
    request: UpdateEsocialConfigRequest,
  ): Promise<UpdateEsocialConfigResponse> {
    // Validate environment
    if (
      request.environment &&
      !['PRODUCAO', 'HOMOLOGACAO'].includes(request.environment)
    ) {
      throw new BadRequestError('Environment must be PRODUCAO or HOMOLOGACAO');
    }

    // Validate tpInsc
    if (request.tpInsc && ![1, 2].includes(request.tpInsc)) {
      throw new BadRequestError('tpInsc must be 1 (CNPJ) or 2 (CPF)');
    }

    // Validate nrInsc format
    if (request.nrInsc) {
      const cleaned = request.nrInsc.replace(/\D/g, '');
      const expectedLength = (request.tpInsc ?? 1) === 1 ? 14 : 11;
      if (cleaned.length !== expectedLength) {
        throw new BadRequestError(
          `nrInsc must have ${expectedLength} digits for ${(request.tpInsc ?? 1) === 1 ? 'CNPJ' : 'CPF'}`,
        );
      }
    }

    // Validate inpiNumber format (Phase 06 Plan 06-06 D-06): 17 dígitos numéricos
    // quando fornecido. null é aceito como "limpar explicitamente".
    if (request.inpiNumber) {
      const cleaned = request.inpiNumber.replace(/\D/g, '');
      if (cleaned.length !== 17) {
        throw new BadRequestError(
          'inpiNumber deve conter 17 dígitos numéricos',
        );
      }
    }

    const data: UpdateEsocialConfigData = {};
    if (request.environment !== undefined)
      data.environment = request.environment;
    if (request.version !== undefined) data.version = request.version;
    if (request.tpInsc !== undefined) data.tpInsc = request.tpInsc;
    if (request.nrInsc !== undefined) data.nrInsc = request.nrInsc;
    if (request.inpiNumber !== undefined)
      data.inpiNumber = request.inpiNumber
        ? request.inpiNumber.replace(/\D/g, '')
        : null;
    if (request.autoGenerateOnAdmission !== undefined)
      data.autoGenerateOnAdmission = request.autoGenerateOnAdmission;
    if (request.autoGenerateOnTermination !== undefined)
      data.autoGenerateOnTermination = request.autoGenerateOnTermination;
    if (request.autoGenerateOnLeave !== undefined)
      data.autoGenerateOnLeave = request.autoGenerateOnLeave;
    if (request.autoGenerateOnPayroll !== undefined)
      data.autoGenerateOnPayroll = request.autoGenerateOnPayroll;
    if (request.requireApproval !== undefined)
      data.requireApproval = request.requireApproval;

    const config = await this.configRepository.upsert(request.tenantId, data);

    return { config };
  }
}
