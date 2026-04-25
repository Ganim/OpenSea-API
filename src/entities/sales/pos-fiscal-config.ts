import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

import { PosFiscalDocumentType } from './value-objects/pos-fiscal-document-type';
import { PosFiscalEmissionMode } from './value-objects/pos-fiscal-emission-mode';

export interface PosFiscalConfigProps {
  tenantId: string;
  enabledDocumentTypes: PosFiscalDocumentType[];
  defaultDocumentType: PosFiscalDocumentType;
  emissionMode: PosFiscalEmissionMode;
  certificatePath: string | null;
  nfceSeries: number | null;
  nfceNextNumber: number | null;
  satDeviceId: string | null;
  createdAt: Date;
  updatedAt?: Date;
}

export class PosFiscalConfig extends Entity<PosFiscalConfigProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }

  get enabledDocumentTypes(): PosFiscalDocumentType[] {
    return this.props.enabledDocumentTypes;
  }

  get defaultDocumentType(): PosFiscalDocumentType {
    return this.props.defaultDocumentType;
  }

  get emissionMode(): PosFiscalEmissionMode {
    return this.props.emissionMode;
  }

  get certificatePath(): string | null {
    return this.props.certificatePath;
  }

  get nfceSeries(): number | null {
    return this.props.nfceSeries;
  }

  get nfceNextNumber(): number | null {
    return this.props.nfceNextNumber;
  }

  get satDeviceId(): string | null {
    return this.props.satDeviceId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  public incrementNfceNumber(): number {
    if (this.props.nfceNextNumber === null) {
      throw new Error('nfceNextNumber is not configured');
    }

    const current = this.props.nfceNextNumber;
    this.props.nfceNextNumber = current + 1;
    this.touch();
    return current;
  }

  public setEmissionMode(mode: PosFiscalEmissionMode): void {
    this.props.emissionMode = mode;
    this.touch();
  }

  public static create(
    props: Optional<
      PosFiscalConfigProps,
      | 'emissionMode'
      | 'certificatePath'
      | 'nfceSeries'
      | 'nfceNextNumber'
      | 'satDeviceId'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: UniqueEntityID,
  ): PosFiscalConfig {
    return new PosFiscalConfig(
      {
        tenantId: props.tenantId,
        enabledDocumentTypes: props.enabledDocumentTypes,
        defaultDocumentType: props.defaultDocumentType,
        emissionMode: props.emissionMode ?? PosFiscalEmissionMode.ONLINE_SYNC(),
        certificatePath: props.certificatePath ?? null,
        nfceSeries: props.nfceSeries ?? null,
        nfceNextNumber: props.nfceNextNumber ?? null,
        satDeviceId: props.satDeviceId ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
      },
      id,
    );
  }
}
