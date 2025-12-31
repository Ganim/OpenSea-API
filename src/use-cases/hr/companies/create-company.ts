import { Company } from '@/entities/hr/company';
import type { CompaniesRepository } from '@/repositories/hr/companies-repository';

export interface CreateCompanyRequest {
  legalName: string;
  cnpj: string;
  tradeName?: string;
  stateRegistration?: string;
  municipalRegistration?: string;
  legalNature?: string;
  taxRegime?: string;
  taxRegimeDetail?: string;
  activityStartDate?: Date;
  status?: string;
  email?: string;
  phoneMain?: string;
  phoneAlt?: string;
  logoUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateCompanyResponse {
  company: Company;
}

export class CreateCompanyUseCase {
  constructor(private companiesRepository: CompaniesRepository) {}

  async execute(request: CreateCompanyRequest): Promise<CreateCompanyResponse> {
    const {
      legalName,
      cnpj,
      tradeName,
      stateRegistration,
      municipalRegistration,
      legalNature,
      taxRegime,
      taxRegimeDetail,
      activityStartDate,
      status,
      email,
      phoneMain,
      phoneAlt,
      logoUrl,
      metadata,
    } = request;

    // Validar CNPJ obrigatório e único (para empresas ativas)
    if (!cnpj || cnpj.trim().length === 0) {
      throw new Error('CNPJ is required');
    }

    const existingCompany = await this.companiesRepository.findByCnpj(cnpj);
    if (existingCompany) {
      throw new Error('Company with this CNPJ already exists');
    }

    // Validar data de início de atividade se fornecida
    if (activityStartDate && activityStartDate > new Date()) {
      throw new Error('Activity start date cannot be in the future');
    }

    // Validar email se fornecido
    if (email && !this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Validar telefone se fornecido
    if (phoneMain && !this.isValidPhone(phoneMain)) {
      throw new Error('Invalid phone format');
    }

    if (phoneAlt && !this.isValidPhone(phoneAlt)) {
      throw new Error('Invalid phone format');
    }

    // Criar empresa
    const company = await this.companiesRepository.create({
      legalName,
      cnpj,
      tradeName,
      stateRegistration,
      municipalRegistration,
      legalNature,
      taxRegime,
      taxRegimeDetail,
      activityStartDate,
      status,
      email,
      phoneMain,
      phoneAlt,
      logoUrl,
      metadata,
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
