import { UniqueEntityID } from '../../domain/unique-entity-id';
import {
  Organization,
  OrganizationProps,
  OrganizationType,
} from './organization';

export interface SupplierSpecificData {
  // Dados comerciais
  paymentTerms?: string | null; // Ex: "30/60/90 dias"
  rating?: number | null; // Avaliação do fornecedor (0-5)
  isPreferredSupplier?: boolean; // Fornecedor preferencial

  // Dados de contrato
  contractNumber?: string | null;
  contractStartDate?: Date | null;
  contractEndDate?: Date | null;

  // Dados operacionais
  leadTime?: number | null; // Prazo de entrega em dias
  minimumOrderValue?: number | null; // Valor mínimo de pedido

  // Códigos e IDs
  sequentialCode?: number; // Código sequencial interno
  externalId?: string | null; // ID no sistema do fornecedor

  // Observações
  notes?: string | null;
}

export interface SupplierProps
  extends Omit<OrganizationProps, 'type' | 'typeSpecificData'> {
  type?: 'SUPPLIER';
  typeSpecificData?: SupplierSpecificData | null;
}

export class Supplier extends Organization {
  protected readonly organizationType: OrganizationType = 'SUPPLIER';

  // Getters específicos de Supplier
  get paymentTerms(): string | null | undefined {
    return this.supplierData.paymentTerms;
  }

  get rating(): number | null | undefined {
    return this.supplierData.rating;
  }

  get isPreferredSupplier(): boolean {
    return this.supplierData.isPreferredSupplier ?? false;
  }

  get contractNumber(): string | null | undefined {
    return this.supplierData.contractNumber;
  }

  get contractStartDate(): Date | null | undefined {
    const date = this.supplierData.contractStartDate;
    if (!date) return date;
    return typeof date === 'string' ? new Date(date) : date;
  }

  get contractEndDate(): Date | null | undefined {
    const date = this.supplierData.contractEndDate;
    if (!date) return date;
    return typeof date === 'string' ? new Date(date) : date;
  }

  get leadTime(): number | null | undefined {
    return this.supplierData.leadTime;
  }

  get minimumOrderValue(): number | null | undefined {
    return this.supplierData.minimumOrderValue;
  }

  get sequentialCode(): number | undefined {
    return this.supplierData.sequentialCode;
  }

  get externalId(): string | null | undefined {
    return this.supplierData.externalId;
  }

  get notes(): string | null | undefined {
    return this.supplierData.notes;
  }

  private get supplierData(): SupplierSpecificData {
    return (this.typeSpecificData as SupplierSpecificData) ?? {};
  }

  // Métodos específicos de Supplier
  updateSupplierData(data: {
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
  }): void {
    const currentData = this.supplierData;
    const updatedData: SupplierSpecificData = { ...currentData };

    if (data.paymentTerms !== undefined)
      updatedData.paymentTerms = data.paymentTerms;
    if (data.rating !== undefined) {
      // Validar rating entre 0 e 5
      if (data.rating !== null && (data.rating < 0 || data.rating > 5)) {
        throw new Error('Rating must be between 0 and 5');
      }
      updatedData.rating = data.rating;
    }
    if (data.isPreferredSupplier !== undefined)
      updatedData.isPreferredSupplier = data.isPreferredSupplier;
    if (data.contractNumber !== undefined)
      updatedData.contractNumber = data.contractNumber;
    if (data.contractStartDate !== undefined)
      updatedData.contractStartDate = data.contractStartDate;
    if (data.contractEndDate !== undefined)
      updatedData.contractEndDate = data.contractEndDate;
    if (data.leadTime !== undefined) updatedData.leadTime = data.leadTime;
    if (data.minimumOrderValue !== undefined)
      updatedData.minimumOrderValue = data.minimumOrderValue;
    if (data.externalId !== undefined) updatedData.externalId = data.externalId;
    if (data.notes !== undefined) updatedData.notes = data.notes;

    this.updateTypeSpecificData(updatedData as Record<string, unknown>);
  }

  setAsPreferred(): void {
    this.updateSupplierData({ isPreferredSupplier: true });
  }

  removePreferred(): void {
    this.updateSupplierData({ isPreferredSupplier: false });
  }

  updateRating(rating: number): void {
    this.updateSupplierData({ rating });
  }

  hasActiveContract(): boolean {
    if (!this.contractStartDate || !this.contractEndDate) {
      return false;
    }
    const now = new Date();
    return now >= this.contractStartDate && now <= this.contractEndDate;
  }

  static create(props: SupplierProps, id?: UniqueEntityID): Supplier {
    // Normalizar typeSpecificData
    const typeSpecificData: SupplierSpecificData = {
      ...(props.typeSpecificData ?? {}),
    };

    const organizationProps: OrganizationProps = {
      ...props,
      type: 'SUPPLIER',
      typeSpecificData: typeSpecificData as Record<string, unknown>,
    };

    const supplier = new Supplier(organizationProps, id);

    // Validar que tem CNPJ ou CPF
    supplier.validateFiscalId();

    return supplier;
  }
}
