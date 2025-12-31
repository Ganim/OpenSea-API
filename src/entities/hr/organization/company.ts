import { UniqueEntityID } from '../../domain/unique-entity-id';
import {
  Organization,
  OrganizationProps,
  OrganizationType,
} from './organization';

export interface CompanySpecificData {
  legalNature?: string | null;
  taxRegimeDetail?: string | null;
  activityStartDate?: Date | null;
  phoneAlt?: string | null;
  logoUrl?: string | null;
  pendingIssues?: string[];
}

export interface CompanyProps
  extends Omit<OrganizationProps, 'type' | 'typeSpecificData'> {
  type?: 'COMPANY';
  typeSpecificData?: CompanySpecificData | null;
}

export class Company extends Organization {
  protected readonly organizationType: OrganizationType = 'COMPANY';

  // Getters específicos de Company
  get legalNature(): string | null | undefined {
    return this.companyData.legalNature;
  }

  get taxRegimeDetail(): string | null | undefined {
    return this.companyData.taxRegimeDetail;
  }

  get activityStartDate(): Date | null | undefined {
    const date = this.companyData.activityStartDate;
    if (!date) return date;
    return typeof date === 'string' ? new Date(date) : date;
  }

  get phoneAlt(): string | null | undefined {
    return this.companyData.phoneAlt;
  }

  get logoUrl(): string | null | undefined {
    return this.companyData.logoUrl;
  }

  get pendingIssues(): string[] {
    return this.companyData.pendingIssues ?? [];
  }

  private get companyData(): CompanySpecificData {
    return (this.typeSpecificData as CompanySpecificData) ?? {};
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

  // Métodos específicos de Company
  updateCompanyData(data: {
    legalNature?: string | null;
    taxRegimeDetail?: string | null;
    activityStartDate?: Date | null;
    phoneAlt?: string | null;
    logoUrl?: string | null;
  }): void {
    const currentData = this.companyData;
    const updatedData: CompanySpecificData = { ...currentData };

    if (data.legalNature !== undefined)
      updatedData.legalNature = data.legalNature;
    if (data.taxRegimeDetail !== undefined)
      updatedData.taxRegimeDetail = data.taxRegimeDetail;
    if (data.activityStartDate !== undefined)
      updatedData.activityStartDate = data.activityStartDate;
    if (data.phoneAlt !== undefined) updatedData.phoneAlt = data.phoneAlt;
    if (data.logoUrl !== undefined) updatedData.logoUrl = data.logoUrl;

    // Recalcular pendências
    updatedData.pendingIssues = this.calculatePendingIssues();

    this.updateTypeSpecificData(updatedData as Record<string, unknown>);
  }

  static create(props: CompanyProps, id?: UniqueEntityID): Company {
    // Normalizar typeSpecificData
    const typeSpecificData: CompanySpecificData = {
      ...(props.typeSpecificData ?? {}),
    };

    const organizationProps: OrganizationProps = {
      ...props,
      type: 'COMPANY',
      typeSpecificData: typeSpecificData as Record<string, unknown>,
    };

    const company = new Company(organizationProps, id);

    // Validar CNPJ obrigatório para empresa
    if (!company.cnpj) {
      throw new Error('CNPJ is required for Company');
    }

    return company;
  }
}
