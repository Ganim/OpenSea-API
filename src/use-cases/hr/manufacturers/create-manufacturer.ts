import type { Manufacturer } from '@/entities/hr/organization/manufacturer';
import type {
  CreateManufacturerSchema,
  ManufacturersRepository,
} from '@/repositories/hr/manufacturers-repository';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';

interface CreateManufacturerRequest {
  legalName: string;
  cnpj?: string;
  cpf?: string;
  tradeName?: string;
  stateRegistration?: string;
  municipalRegistration?: string;
  taxRegime?: string;
  email?: string;
  phoneMain?: string;
  website?: string;

  // Manufacturer specific fields
  productionCapacity?: number;
  leadTime?: number;
  certifications?: string[];
  qualityRating?: number;
  defectRate?: number;
  minimumOrderQuantity?: number;
  paymentTerms?: string;
  countryOfOrigin?: string;
  factoryLocation?: string;
  externalId?: string;
  notes?: string;

  metadata?: Record<string, unknown>;
}

interface CreateManufacturerResponse {
  manufacturer: Manufacturer;
}

export class CreateManufacturerUseCase {
  constructor(private manufacturersRepository: ManufacturersRepository) {}

  async execute(
    request: CreateManufacturerRequest,
  ): Promise<CreateManufacturerResponse> {
    // Validações
    if (!request.legalName) {
      throw new BadRequestError('Legal name is required');
    }

    if (!request.cnpj && !request.cpf) {
      throw new BadRequestError('Either CNPJ or CPF is required');
    }

    // Validar qualityRating se fornecido
    if (
      request.qualityRating !== undefined &&
      (request.qualityRating < 0 || request.qualityRating > 5)
    ) {
      throw new BadRequestError('Quality rating must be between 0 and 5');
    }

    // Validar defectRate se fornecido
    if (
      request.defectRate !== undefined &&
      (request.defectRate < 0 || request.defectRate > 100)
    ) {
      throw new BadRequestError('Defect rate must be between 0 and 100');
    }

    // Verificar se já existe fabricante com mesmo CNPJ
    if (request.cnpj) {
      const existingManufacturer =
        await this.manufacturersRepository.findByCnpj(request.cnpj);
      if (existingManufacturer) {
        throw new BadRequestError('Manufacturer with this CNPJ already exists');
      }
    }

    // Verificar se já existe fabricante com mesmo CPF
    if (request.cpf) {
      const existingManufacturer = await this.manufacturersRepository.findByCpf(
        request.cpf,
      );
      if (existingManufacturer) {
        throw new BadRequestError('Manufacturer with this CPF already exists');
      }
    }

    const data: CreateManufacturerSchema = {
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

    const manufacturer = await this.manufacturersRepository.create(data);

    return { manufacturer };
  }
}
