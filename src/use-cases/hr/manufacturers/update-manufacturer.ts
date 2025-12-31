import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Manufacturer } from '@/entities/hr/organization/manufacturer';
import type {
  UpdateManufacturerSchema,
  ManufacturersRepository,
} from '@/repositories/hr/manufacturers-repository';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';

interface UpdateManufacturerRequest {
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

  // Manufacturer specific fields
  productionCapacity?: number | null;
  leadTime?: number | null;
  certifications?: string[];
  qualityRating?: number | null;
  defectRate?: number | null;
  minimumOrderQuantity?: number | null;
  paymentTerms?: string | null;
  countryOfOrigin?: string | null;
  factoryLocation?: string | null;
  externalId?: string | null;
  notes?: string | null;

  metadata?: Record<string, unknown>;
}

interface UpdateManufacturerResponse {
  manufacturer: Manufacturer;
}

export class UpdateManufacturerUseCase {
  constructor(private manufacturersRepository: ManufacturersRepository) {}

  async execute(
    request: UpdateManufacturerRequest,
  ): Promise<UpdateManufacturerResponse> {
    // Validar qualityRating se fornecido
    if (
      request.qualityRating !== undefined &&
      request.qualityRating !== null &&
      (request.qualityRating < 0 || request.qualityRating > 5)
    ) {
      throw new BadRequestError('Quality rating must be between 0 and 5');
    }

    // Validar defectRate se fornecido
    if (
      request.defectRate !== undefined &&
      request.defectRate !== null &&
      (request.defectRate < 0 || request.defectRate > 100)
    ) {
      throw new BadRequestError('Defect rate must be between 0 and 100');
    }

    const data: UpdateManufacturerSchema = {
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
      productionCapacity: request.productionCapacity,
      leadTime: request.leadTime,
      certifications: request.certifications,
      qualityRating: request.qualityRating,
      defectRate: request.defectRate,
      minimumOrderQuantity: request.minimumOrderQuantity,
      paymentTerms: request.paymentTerms,
      countryOfOrigin: request.countryOfOrigin,
      factoryLocation: request.factoryLocation,
      externalId: request.externalId,
      notes: request.notes,
      metadata: request.metadata,
    };

    const manufacturer = await this.manufacturersRepository.update(data);

    if (!manufacturer) {
      throw new ResourceNotFoundError('Manufacturer not found');
    }

    return { manufacturer };
  }
}
