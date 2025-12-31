import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Supplier } from '@/entities/hr/organization/supplier';
import type {
  UpdateSupplierSchema,
  SuppliersRepository,
} from '@/repositories/hr/suppliers-repository';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';

interface UpdateSupplierRequest {
  id: string;
  legalName?: string;
  tradeName?: string | null;
  stateRegistration?: string | null;
  municipalRegistration?: string | null;
  taxRegime?: string | null;
  status?: string;
  email?: string | null;
  phoneMain?: string | null;
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

interface UpdateSupplierResponse {
  supplier: Supplier;
}

export class UpdateSupplierUseCase {
  constructor(private suppliersRepository: SuppliersRepository) {}

  async execute(
    request: UpdateSupplierRequest,
  ): Promise<UpdateSupplierResponse> {
    // Validar rating se fornecido
    if (
      request.rating !== undefined &&
      request.rating !== null &&
      (request.rating < 0 || request.rating > 5)
    ) {
      throw new BadRequestError('Rating must be between 0 and 5');
    }

    const data: UpdateSupplierSchema = {
      id: new UniqueEntityID(request.id),
      legalName: request.legalName,
      tradeName: request.tradeName,
      stateRegistration: request.stateRegistration,
      municipalRegistration: request.municipalRegistration,
      taxRegime: request.taxRegime,
      status: request.status,
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

    const supplier = await this.suppliersRepository.update(data);

    if (!supplier) {
      throw new ResourceNotFoundError('Supplier not found');
    }

    return { supplier };
  }
}
