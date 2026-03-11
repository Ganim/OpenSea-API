import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type NfeEnvironment = 'HOMOLOGATION' | 'PRODUCTION';
export type DigitalCertificateType = 'NONE' | 'A1' | 'A3';

export interface CompanyFiscalSettingsProps {
  companyId: UniqueEntityID;
  nfeEnvironment?: NfeEnvironment;
  nfeSeries?: string;
  nfeLastNumber?: number;
  nfeDefaultOperationNature?: string;
  nfeDefaultCfop?: string;
  digitalCertificateType: DigitalCertificateType;
  certificateA1PfxBlob?: Buffer;
  certificateA1Password?: string;
  certificateA1ExpiresAt?: Date;
  nfceEnabled: boolean;
  nfceCscId?: string;
  nfceCscToken?: string;
  defaultTaxProfileId?: UniqueEntityID;
  metadata: Record<string, unknown>;
  pendingIssues: string[];
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class CompanyFiscalSettings extends Entity<CompanyFiscalSettingsProps> {
  get companyId(): UniqueEntityID {
    return this.props.companyId;
  }

  get nfeEnvironment(): NfeEnvironment | undefined {
    return this.props.nfeEnvironment;
  }

  get nfeSeries(): string | undefined {
    return this.props.nfeSeries;
  }

  get nfeLastNumber(): number | undefined {
    return this.props.nfeLastNumber;
  }

  get nfeDefaultOperationNature(): string | undefined {
    return this.props.nfeDefaultOperationNature;
  }

  get nfeDefaultCfop(): string | undefined {
    return this.props.nfeDefaultCfop;
  }

  get digitalCertificateType(): DigitalCertificateType {
    return this.props.digitalCertificateType;
  }

  get certificateA1PfxBlob(): Buffer | undefined {
    return this.props.certificateA1PfxBlob;
  }

  get certificateA1Password(): string | undefined {
    return this.props.certificateA1Password;
  }

  get certificateA1ExpiresAt(): Date | undefined {
    return this.props.certificateA1ExpiresAt;
  }

  get nfceEnabled(): boolean {
    return this.props.nfceEnabled;
  }

  get nfceCscId(): string | undefined {
    return this.props.nfceCscId;
  }

  get nfceCscToken(): string | undefined {
    return this.props.nfceCscToken;
  }

  get defaultTaxProfileId(): UniqueEntityID | undefined {
    return this.props.defaultTaxProfileId;
  }

  get metadata(): Record<string, unknown> {
    return this.props.metadata ?? {};
  }

  get pendingIssues(): string[] {
    return this.props.pendingIssues ?? [];
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  static create(
    props: Omit<CompanyFiscalSettingsProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): CompanyFiscalSettings {
    const now = new Date();
    return new CompanyFiscalSettings(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }
}
