import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type CompanyStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type TaxRegime =
  | 'SIMPLES'
  | 'LUCRO_PRESUMIDO'
  | 'LUCRO_REAL'
  | 'IMUNE_ISENTA'
  | 'OUTROS';

export interface CompanyProps {
  // Obrigatórios
  tenantId: UniqueEntityID;
  legalName: string;
  cnpj: string;

  // Principais opcionais
  tradeName?: string | null;
  stateRegistration?: string | null; // IE
  municipalRegistration?: string | null; // IM
  legalNature?: string | null;
  taxRegime?: TaxRegime | null;
  taxRegimeDetail?: string | null;
  activityStartDate?: Date | null;
  status: CompanyStatus;
  email?: string | null;
  phoneMain?: string | null;
  phoneAlt?: string | null;
  logoUrl?: string | null;

  // Metadados e pendências
  metadata?: Record<string, unknown> | null;
  pendingIssues: string[];

  // Audit
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Company extends Entity<CompanyProps> {
  // Getters obrigatórios
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get legalName(): string {
    return this.props.legalName;
  }

  get cnpj(): string {
    return this.props.cnpj;
  }

  get status(): CompanyStatus {
    return this.props.status;
  }

  // Getters principais
  get tradeName(): string | null | undefined {
    return this.props.tradeName;
  }

  get stateRegistration(): string | null | undefined {
    return this.props.stateRegistration;
  }

  get municipalRegistration(): string | null | undefined {
    return this.props.municipalRegistration;
  }

  get legalNature(): string | null | undefined {
    return this.props.legalNature;
  }

  get taxRegime(): TaxRegime | null | undefined {
    return this.props.taxRegime;
  }

  get taxRegimeDetail(): string | null | undefined {
    return this.props.taxRegimeDetail;
  }

  get activityStartDate(): Date | null | undefined {
    return this.props.activityStartDate;
  }

  get email(): string | null | undefined {
    return this.props.email;
  }

  get phoneMain(): string | null | undefined {
    return this.props.phoneMain;
  }

  get phoneAlt(): string | null | undefined {
    return this.props.phoneAlt;
  }

  get logoUrl(): string | null | undefined {
    return this.props.logoUrl;
  }

  // Getters metadados
  get metadata(): Record<string, unknown> {
    return this.props.metadata ?? {};
  }

  get pendingIssues(): string[] {
    return this.props.pendingIssues;
  }

  // Getters audit
  get deletedAt(): Date | null | undefined {
    return this.props.deletedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  isDeleted(): boolean {
    return this.deletedAt !== undefined && this.deletedAt !== null;
  }

  isActive(): boolean {
    return this.status === 'ACTIVE' && !this.isDeleted();
  }

  // Calcula pendências automaticamente
  calculatePendingIssues(): string[] {
    const issues: string[] = [];

    if (!this.tradeName) issues.push('trade_name_not_defined');
    if (!this.stateRegistration) issues.push('state_registration_not_defined');
    if (!this.municipalRegistration)
      issues.push('municipal_registration_not_defined');
    if (!this.legalNature) issues.push('legal_nature_not_defined');
    if (!this.taxRegime) issues.push('tax_regime_not_defined');
    if (!this.activityStartDate) issues.push('activity_start_date_not_defined');
    if (!this.email) issues.push('email_not_defined');
    if (!this.phoneMain) issues.push('phone_main_not_defined');
    if (!this.phoneAlt) issues.push('phone_alt_not_defined');
    if (!this.logoUrl) issues.push('logo_url_not_defined');

    return issues;
  }

  // Métodos de negócio
  delete(): void {
    if (this.isDeleted()) {
      throw new Error('Company is already deleted');
    }
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  restore(): void {
    if (!this.isDeleted()) {
      throw new Error('Company is not deleted');
    }
    this.props.deletedAt = undefined;
    this.props.updatedAt = new Date();
  }

  changeStatus(status: CompanyStatus): void {
    this.props.status = status;
    this.props.updatedAt = new Date();
  }

  updateMainData(
    tradeName?: string | null,
    stateRegistration?: string | null,
    municipalRegistration?: string | null,
    legalNature?: string | null,
    taxRegime?: TaxRegime | null,
    taxRegimeDetail?: string | null,
    activityStartDate?: Date | null,
    email?: string | null,
    phoneMain?: string | null,
    phoneAlt?: string | null,
    logoUrl?: string | null,
  ): void {
    if (tradeName !== undefined) this.props.tradeName = tradeName;
    if (stateRegistration !== undefined)
      this.props.stateRegistration = stateRegistration;
    if (municipalRegistration !== undefined)
      this.props.municipalRegistration = municipalRegistration;
    if (legalNature !== undefined) this.props.legalNature = legalNature;
    if (taxRegime !== undefined) this.props.taxRegime = taxRegime;
    if (taxRegimeDetail !== undefined)
      this.props.taxRegimeDetail = taxRegimeDetail;
    if (activityStartDate !== undefined)
      this.props.activityStartDate = activityStartDate;
    if (email !== undefined) this.props.email = email;
    if (phoneMain !== undefined) this.props.phoneMain = phoneMain;
    if (phoneAlt !== undefined) this.props.phoneAlt = phoneAlt;
    if (logoUrl !== undefined) this.props.logoUrl = logoUrl;

    // Recalcular pendências
    this.props.pendingIssues = this.calculatePendingIssues();
    this.props.updatedAt = new Date();
  }

  updateMetadata(metadata: Record<string, unknown>): void {
    this.props.metadata = metadata;
    this.props.updatedAt = new Date();
  }

  static create(props: CompanyProps, id?: UniqueEntityID): Company {
    return new Company(props, id);
  }
}
