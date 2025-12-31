import { UniqueEntityID } from '../../domain/unique-entity-id';
import {
  Organization,
  OrganizationProps,
  OrganizationType,
} from './organization';

export interface ManufacturerSpecificData {
  // Dados de produção
  productionCapacity?: number | null; // Capacidade de produção (unidades/mês)
  leadTime?: number | null; // Prazo de fabricação em dias
  certifications?: string[]; // Certificações (ISO, etc)

  // Dados de qualidade
  qualityRating?: number | null; // Avaliação de qualidade (0-5)
  defectRate?: number | null; // Taxa de defeitos (%)

  // Dados comerciais
  minimumOrderQuantity?: number | null; // Quantidade mínima de pedido
  paymentTerms?: string | null; // Ex: "30/60/90 dias"

  // Dados operacionais
  countryOfOrigin?: string | null; // País de origem
  factoryLocation?: string | null; // Localização da fábrica

  // Códigos e IDs
  sequentialCode?: number; // Código sequencial interno
  externalId?: string | null; // ID no sistema do fabricante

  // Observações
  notes?: string | null;
}

export interface ManufacturerProps
  extends Omit<OrganizationProps, 'type' | 'typeSpecificData'> {
  type?: 'MANUFACTURER';
  typeSpecificData?: ManufacturerSpecificData | null;
}

export class Manufacturer extends Organization {
  protected readonly organizationType: OrganizationType = 'MANUFACTURER';

  // Getters específicos de Manufacturer
  get productionCapacity(): number | null | undefined {
    return this.manufacturerData.productionCapacity;
  }

  get leadTime(): number | null | undefined {
    return this.manufacturerData.leadTime;
  }

  get certifications(): string[] {
    return this.manufacturerData.certifications ?? [];
  }

  get qualityRating(): number | null | undefined {
    return this.manufacturerData.qualityRating;
  }

  get defectRate(): number | null | undefined {
    return this.manufacturerData.defectRate;
  }

  get minimumOrderQuantity(): number | null | undefined {
    return this.manufacturerData.minimumOrderQuantity;
  }

  get paymentTerms(): string | null | undefined {
    return this.manufacturerData.paymentTerms;
  }

  get countryOfOrigin(): string | null | undefined {
    return this.manufacturerData.countryOfOrigin;
  }

  get factoryLocation(): string | null | undefined {
    return this.manufacturerData.factoryLocation;
  }

  get sequentialCode(): number | undefined {
    return this.manufacturerData.sequentialCode;
  }

  get externalId(): string | null | undefined {
    return this.manufacturerData.externalId;
  }

  get notes(): string | null | undefined {
    return this.manufacturerData.notes;
  }

  private get manufacturerData(): ManufacturerSpecificData {
    return (this.typeSpecificData as ManufacturerSpecificData) ?? {};
  }

  // Métodos específicos de Manufacturer
  updateManufacturerData(data: {
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
  }): void {
    const currentData = this.manufacturerData;
    const updatedData: ManufacturerSpecificData = { ...currentData };

    if (data.productionCapacity !== undefined)
      updatedData.productionCapacity = data.productionCapacity;
    if (data.leadTime !== undefined) updatedData.leadTime = data.leadTime;
    if (data.certifications !== undefined)
      updatedData.certifications = data.certifications;
    if (data.qualityRating !== undefined) {
      // Validar qualityRating entre 0 e 5
      if (
        data.qualityRating !== null &&
        (data.qualityRating < 0 || data.qualityRating > 5)
      ) {
        throw new Error('Quality rating must be between 0 and 5');
      }
      updatedData.qualityRating = data.qualityRating;
    }
    if (data.defectRate !== undefined) {
      // Validar defectRate entre 0 e 100
      if (
        data.defectRate !== null &&
        (data.defectRate < 0 || data.defectRate > 100)
      ) {
        throw new Error('Defect rate must be between 0 and 100');
      }
      updatedData.defectRate = data.defectRate;
    }
    if (data.minimumOrderQuantity !== undefined)
      updatedData.minimumOrderQuantity = data.minimumOrderQuantity;
    if (data.paymentTerms !== undefined)
      updatedData.paymentTerms = data.paymentTerms;
    if (data.countryOfOrigin !== undefined)
      updatedData.countryOfOrigin = data.countryOfOrigin;
    if (data.factoryLocation !== undefined)
      updatedData.factoryLocation = data.factoryLocation;
    if (data.externalId !== undefined) updatedData.externalId = data.externalId;
    if (data.notes !== undefined) updatedData.notes = data.notes;

    this.updateTypeSpecificData(updatedData as Record<string, unknown>);
  }

  addCertification(certification: string): void {
    const currentCertifications = this.certifications;
    if (!currentCertifications.includes(certification)) {
      this.updateManufacturerData({
        certifications: [...currentCertifications, certification],
      });
    }
  }

  removeCertification(certification: string): void {
    const currentCertifications = this.certifications;
    this.updateManufacturerData({
      certifications: currentCertifications.filter((c) => c !== certification),
    });
  }

  updateQualityRating(rating: number): void {
    this.updateManufacturerData({ qualityRating: rating });
  }

  updateDefectRate(rate: number): void {
    this.updateManufacturerData({ defectRate: rate });
  }

  hasCertification(certification: string): boolean {
    return this.certifications.includes(certification);
  }

  static create(props: ManufacturerProps, id?: UniqueEntityID): Manufacturer {
    // Normalizar typeSpecificData
    const typeSpecificData: ManufacturerSpecificData = {
      ...(props.typeSpecificData ?? {}),
      certifications: props.typeSpecificData?.certifications ?? [],
    };

    const organizationProps: OrganizationProps = {
      ...props,
      type: 'MANUFACTURER',
      typeSpecificData: typeSpecificData as Record<string, unknown>,
    };

    const manufacturer = new Manufacturer(organizationProps, id);

    // Validar que tem CNPJ ou CPF
    manufacturer.validateFiscalId();

    return manufacturer;
  }
}
