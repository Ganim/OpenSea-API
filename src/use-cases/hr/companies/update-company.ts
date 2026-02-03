import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Company } from '@/entities/hr/company';
import type { CompaniesRepository } from '@/repositories/hr/companies-repository';

export interface UpdateCompanyRequest {
  tenantId: string;
  id: string;
  legalName?: string;
  tradeName?: string | null;
  stateRegistration?: string | null;
  municipalRegistration?: string | null;
  legalNature?: string | null;
  taxRegime?: string | null;
  taxRegimeDetail?: string | null;
  activityStartDate?: Date | null;
  status?: string;
  email?: string | null;
  phoneMain?: string | null;
  phoneAlt?: string | null;
  logoUrl?: string | null;
  metadata?: Record<string, unknown>;
}

export interface UpdateCompanyResponse {
  company: Company | null;
}

export class UpdateCompanyUseCase {
  constructor(private companiesRepository: CompaniesRepository) {}

  async execute(request: UpdateCompanyRequest): Promise<UpdateCompanyResponse> {
    const id = new UniqueEntityID(request.id);

    // Validar email se fornecido
    if (
      request.email !== undefined &&
      request.email &&
      !this.isValidEmail(request.email)
    ) {
      throw new Error('Invalid email format');
    }

    // Validar telefone se fornecido
    if (
      request.phoneMain !== undefined &&
      request.phoneMain &&
      !this.isValidPhone(request.phoneMain)
    ) {
      throw new Error('Invalid phone format');
    }

    if (
      request.phoneAlt !== undefined &&
      request.phoneAlt &&
      !this.isValidPhone(request.phoneAlt)
    ) {
      throw new Error('Invalid phone format');
    }

    // Validar data de início de atividade se fornecida
    if (request.activityStartDate && request.activityStartDate > new Date()) {
      throw new Error('Activity start date cannot be in the future');
    }

    const company = await this.companiesRepository.update({
      id,
      legalName: request.legalName,
      tradeName: request.tradeName,
      stateRegistration: request.stateRegistration,
      municipalRegistration: request.municipalRegistration,
      legalNature: request.legalNature,
      taxRegime: request.taxRegime,
      taxRegimeDetail: request.taxRegimeDetail,
      activityStartDate: request.activityStartDate,
      status: request.status,
      email: request.email,
      phoneMain: request.phoneMain,
      phoneAlt: request.phoneAlt,
      logoUrl: request.logoUrl,
      metadata: request.metadata,
    });

    return { company };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    // Simples validação: apenas dígitos e alguns caracteres especiais
    const phoneRegex = /^[\d\s\-()]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }
}
