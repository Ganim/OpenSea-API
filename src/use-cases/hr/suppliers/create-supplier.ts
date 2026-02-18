import type { Supplier } from '@/entities/hr/organization/supplier';
import type {
  CreateSupplierSchema,
  SuppliersRepository,
} from '@/repositories/hr/suppliers-repository';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';

interface CreateSupplierRequest {
  tenantId: string;
  legalName: string;
  cnpj?: string | null;
  cpf?: string | null;
  tradeName?: string | null;
  stateRegistration?: string | null;
  municipalRegistration?: string | null;
  taxRegime?: string | null;
  status?: string;
  email?: string;
  phoneMain?: string;
  website?: string | null;

  // Supplier specific fields
  paymentTerms?: string | null;
  rating?: number | null;
  isPreferredSupplier?: boolean;
  contractNumber?: string | null;
  contractStartDate?: Date | null;
  contractEndDate?: Date | null;
  leadTime?: number | null;
  minimumOrderValue?: number | null;
  externalId?: string | null;
  notes?: string | null;

  metadata?: Record<string, unknown> | null;
}

interface CreateSupplierResponse {
  supplier: Supplier;
}

export class CreateSupplierUseCase {
  constructor(private suppliersRepository: SuppliersRepository) {}

  async execute(
    request: CreateSupplierRequest,
  ): Promise<CreateSupplierResponse> {
    // Validações
    if (!request.legalName) {
      throw new BadRequestError('Legal name is required');
    }

    if (!request.cnpj && !request.cpf) {
      throw new BadRequestError('Either CNPJ or CPF is required');
    }

    // Validar rating se fornecido
    if (
      request.rating !== undefined &&
      request.rating !== null &&
      (request.rating < 0 || request.rating > 5)
    ) {
      throw new BadRequestError('Rating must be between 0 and 5');
    }

    // Verificar se já existe fornecedor com mesmo CNPJ
    if (request.cnpj) {
      const existingSupplier = await this.suppliersRepository.findByCnpj(
        request.cnpj,
      );
      if (existingSupplier) {
        throw new BadRequestError('Supplier with this CNPJ already exists');
      }
    }

    // Verificar se já existe fornecedor com mesmo CPF
    if (request.cpf) {
      const existingSupplier = await this.suppliersRepository.findByCpf(
        request.cpf,
      );
      if (existingSupplier) {
        throw new BadRequestError('Supplier with this CPF already exists');
      }
    }

    const data: CreateSupplierSchema = {
      tenantId: request.tenantId,
      legalName: request.legalName,
      cnpj: request.cnpj,
      cpf: request.cpf,
      tradeName: request.tradeName,
      stateRegistration: request.stateRegistration,
      municipalRegistration: request.municipalRegistration,
      taxRegime: request.taxRegime,
      email: request.email,
      phoneMain: request.phoneMain,
      website: request.website,
      paymentTerms: request.paymentTerms,
      rating: request.rating,
      isPreferredSupplier: request.isPreferredSupplier,
      contractNumber: request.contractNumber,
      contractStartDate: request.contractStartDate,
      contractEndDate: request.contractEndDate,
      leadTime: request.leadTime,
      minimumOrderValue: request.minimumOrderValue,
      externalId: request.externalId,
      notes: request.notes,
      metadata: request.metadata,
    };

    const supplier = await this.suppliersRepository.create(data);

    return { supplier };
  }
}
