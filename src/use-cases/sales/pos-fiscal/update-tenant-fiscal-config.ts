import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PosFiscalConfig } from '@/entities/sales/pos-fiscal-config';
import {
  PosFiscalDocumentType,
  type PosFiscalDocumentTypeValue,
} from '@/entities/sales/value-objects/pos-fiscal-document-type';
import {
  PosFiscalEmissionMode,
  type PosFiscalEmissionModeValue,
} from '@/entities/sales/value-objects/pos-fiscal-emission-mode';
import {
  type PosFiscalConfigDTO,
  posFiscalConfigToDTO,
} from '@/mappers/sales/pos-fiscal-config/pos-fiscal-config-to-dto';
import type { PosFiscalConfigsRepository } from '@/repositories/sales/pos-fiscal-configs-repository';
import { queueAuditLog } from '@/workers/queues/audit.queue';

/**
 * Document types that, when chosen as `defaultDocumentType` together with an
 * `emissionMode` that actually transmits to SEFAZ, require an A1 certificate
 * to sign the envelope. SAT_CFE / MFE are out of scope for Fase 1 (the
 * device-driven flows do not need an X.509 certificate at this layer) so they
 * are intentionally excluded.
 */
const CERTIFICATE_REQUIRING_DOCUMENT_TYPES: ReadonlyArray<PosFiscalDocumentTypeValue> =
  ['NFE', 'NFC_E'];

/**
 * Emission modes that actually transmit a fiscal envelope. `NONE` is a
 * deliberate "fiscal disabled" toggle (no certificate, no series, no number
 * required) and `OFFLINE_CONTINGENCY` does not transmit on its own — it is
 * a flag the device pipeline observes to queue documents for later
 * retransmission. Only `ONLINE_SYNC` requires immediate certificate +
 * counter availability.
 */
const TRANSMITTING_EMISSION_MODES: ReadonlyArray<PosFiscalEmissionModeValue> = [
  'ONLINE_SYNC',
];

export interface UpdateTenantFiscalConfigRequest {
  tenantId: string;
  /** ID of the user performing the update — recorded on the audit trail. */
  userId: string;
  enabledDocumentTypes: PosFiscalDocumentTypeValue[];
  defaultDocumentType: PosFiscalDocumentTypeValue;
  emissionMode: PosFiscalEmissionModeValue;
  certificatePath?: string | null;
  nfceSeries?: number | null;
  nfceNextNumber?: number | null;
  satDeviceId?: string | null;
}

export interface UpdateTenantFiscalConfigResponse {
  fiscalConfig: PosFiscalConfigDTO;
}

/**
 * Upserts the tenant-wide POS fiscal configuration (Emporion Plan A —
 * Task 32). The upsert is a singleton per tenant: the row is keyed by
 * `tenantId`, so calling this use case repeatedly always mutates the same
 * record.
 *
 * Validation invariants:
 *  - `enabledDocumentTypes` cannot be empty (a tenant with no enabled types
 *    cannot emit anything; making this configurable would just produce
 *    silently broken setups).
 *  - `defaultDocumentType` must be a member of `enabledDocumentTypes`.
 *  - When `defaultDocumentType === 'NFC_E'` and `emissionMode === 'ONLINE_SYNC'`,
 *    the tenant must provide both `nfceSeries` and `nfceNextNumber` — those
 *    are the SEFAZ counter inputs for online emission.
 *  - When `defaultDocumentType` requires a certificate (NFe / NFC-e) and
 *    the mode actually transmits (`ONLINE_SYNC`), `certificatePath` is
 *    required.
 *
 * On success the operation emits a `POS_FISCAL_CONFIG_UPDATE` audit log
 * (fire-and-forget) describing the resulting mode/document type so security
 * can correlate config changes with later emission failures.
 */
export class UpdateTenantFiscalConfigUseCase {
  constructor(private posFiscalConfigsRepository: PosFiscalConfigsRepository) {}

  async execute(
    request: UpdateTenantFiscalConfigRequest,
  ): Promise<UpdateTenantFiscalConfigResponse> {
    const enabledTypes = this.parseEnabledTypes(request.enabledDocumentTypes);
    const defaultType = PosFiscalDocumentType.create(
      request.defaultDocumentType,
    );
    const emissionMode = PosFiscalEmissionMode.create(request.emissionMode);

    this.assertDefaultIsEnabled(defaultType, enabledTypes);
    this.assertNfceCounterPresence({
      defaultType,
      emissionMode,
      nfceSeries: request.nfceSeries ?? null,
      nfceNextNumber: request.nfceNextNumber ?? null,
    });
    this.assertCertificatePresence({
      defaultType,
      emissionMode,
      certificatePath: request.certificatePath ?? null,
    });

    const existing = await this.posFiscalConfigsRepository.findByTenantId(
      request.tenantId,
    );

    const fiscalConfig =
      existing ??
      PosFiscalConfig.create({
        tenantId: request.tenantId,
        enabledDocumentTypes: enabledTypes,
        defaultDocumentType: defaultType,
        emissionMode,
      });

    // Mutate in place so we keep the same id/createdAt and so `updatedAt`
    // gets bumped via the entity's `touch()` helper. This avoids the subtle
    // bug where re-creating the entity for an existing row would produce a
    // fresh id (which the upsert keys by `tenantId`, so it would be silently
    // discarded) and a reset `createdAt`.
    fiscalConfig.props.enabledDocumentTypes = enabledTypes;
    fiscalConfig.props.defaultDocumentType = defaultType;
    fiscalConfig.props.emissionMode = emissionMode;
    fiscalConfig.props.certificatePath = request.certificatePath ?? null;
    fiscalConfig.props.nfceSeries = request.nfceSeries ?? null;
    fiscalConfig.props.nfceNextNumber = request.nfceNextNumber ?? null;
    fiscalConfig.props.satDeviceId = request.satDeviceId ?? null;
    fiscalConfig.props.updatedAt = new Date();

    await this.posFiscalConfigsRepository.upsert(fiscalConfig);

    queueAuditLog({
      userId: request.userId,
      action: 'POS_FISCAL_CONFIG_UPDATE',
      entity: 'POS_FISCAL_CONFIG',
      entityId: fiscalConfig.id.toString(),
      module: 'SALES',
      description: `POS fiscal config updated for tenant ${request.tenantId} — mode: ${emissionMode.value}, default: ${defaultType.value}`,
      newData: {
        tenantId: request.tenantId,
        emissionMode: emissionMode.value,
        defaultDocumentType: defaultType.value,
        enabledDocumentTypes: enabledTypes.map((t) => t.value),
        nfceSeries: request.nfceSeries ?? null,
        nfceNextNumber: request.nfceNextNumber ?? null,
        hasCertificate: Boolean(request.certificatePath),
      },
    }).catch(() => {});

    return { fiscalConfig: posFiscalConfigToDTO(fiscalConfig) };
  }

  // ---- validation helpers --------------------------------------------------

  private parseEnabledTypes(
    raw: PosFiscalDocumentTypeValue[],
  ): PosFiscalDocumentType[] {
    if (!raw || raw.length === 0) {
      throw new BadRequestError(
        'enabledDocumentTypes must contain at least one document type.',
      );
    }
    // De-duplicate to keep the upsert idempotent (`['NFE','NFE']` is just
    // `['NFE']`). Leave order alone — admins may rely on it for UI display.
    const seen = new Set<PosFiscalDocumentTypeValue>();
    const types: PosFiscalDocumentType[] = [];
    for (const value of raw) {
      const valueObject = PosFiscalDocumentType.create(value);
      if (seen.has(valueObject.value)) continue;
      seen.add(valueObject.value);
      types.push(valueObject);
    }
    return types;
  }

  private assertDefaultIsEnabled(
    defaultType: PosFiscalDocumentType,
    enabledTypes: PosFiscalDocumentType[],
  ): void {
    const isEnabled = enabledTypes.some((t) => t.equals(defaultType));
    if (!isEnabled) {
      throw new BadRequestError(
        `defaultDocumentType (${defaultType.value}) must be one of the enabledDocumentTypes.`,
      );
    }
  }

  private assertNfceCounterPresence(input: {
    defaultType: PosFiscalDocumentType;
    emissionMode: PosFiscalEmissionMode;
    nfceSeries: number | null;
    nfceNextNumber: number | null;
  }): void {
    const requiresCounter =
      input.defaultType.isNfcE && input.emissionMode.isOnlineSync;
    if (!requiresCounter) return;

    if (input.nfceSeries === null || input.nfceSeries === undefined) {
      throw new BadRequestError(
        'nfceSeries is required when defaultDocumentType=NFC_E and emissionMode=ONLINE_SYNC.',
      );
    }
    if (input.nfceNextNumber === null || input.nfceNextNumber === undefined) {
      throw new BadRequestError(
        'nfceNextNumber is required when defaultDocumentType=NFC_E and emissionMode=ONLINE_SYNC.',
      );
    }
    if (input.nfceSeries <= 0) {
      throw new BadRequestError('nfceSeries must be a positive integer.');
    }
    if (input.nfceNextNumber <= 0) {
      throw new BadRequestError('nfceNextNumber must be a positive integer.');
    }
  }

  private assertCertificatePresence(input: {
    defaultType: PosFiscalDocumentType;
    emissionMode: PosFiscalEmissionMode;
    certificatePath: string | null;
  }): void {
    const transmits = TRANSMITTING_EMISSION_MODES.includes(
      input.emissionMode.value,
    );
    const requiresCertificate =
      transmits &&
      CERTIFICATE_REQUIRING_DOCUMENT_TYPES.includes(input.defaultType.value);
    if (!requiresCertificate) return;

    if (!input.certificatePath || input.certificatePath.trim().length === 0) {
      throw new BadRequestError(
        `certificatePath is required when defaultDocumentType=${input.defaultType.value} and emissionMode=${input.emissionMode.value}.`,
      );
    }
  }
}
