import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface FiscalDocumentItemProps {
  id: UniqueEntityID;
  fiscalDocumentId: UniqueEntityID;
  itemNumber: number;
  productId?: UniqueEntityID;
  productName: string;
  productCode: string;
  ncm: string;
  cest?: string;
  cfop: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount: number;
  cst: string;
  icmsBase: number;
  icmsRate: number;
  icmsValue: number;
  ipiBase: number;
  ipiRate: number;
  ipiValue: number;
  pisBase: number;
  pisRate: number;
  pisValue: number;
  cofinsBase: number;
  cofinsRate: number;
  cofinsValue: number;
  ibsRate: number;
  ibsValue: number;
  cbsRate: number;
  cbsValue: number;
  createdAt: Date;
}

export class FiscalDocumentItem extends Entity<FiscalDocumentItemProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get fiscalDocumentId(): UniqueEntityID {
    return this.props.fiscalDocumentId;
  }

  get itemNumber(): number {
    return this.props.itemNumber;
  }

  get productId(): UniqueEntityID | undefined {
    return this.props.productId;
  }

  get productName(): string {
    return this.props.productName;
  }

  get productCode(): string {
    return this.props.productCode;
  }

  get ncm(): string {
    return this.props.ncm;
  }

  get cest(): string | undefined {
    return this.props.cest;
  }

  get cfop(): string {
    return this.props.cfop;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get unitPrice(): number {
    return this.props.unitPrice;
  }

  get totalPrice(): number {
    return this.props.totalPrice;
  }

  get discount(): number {
    return this.props.discount;
  }

  get cst(): string {
    return this.props.cst;
  }

  get icmsBase(): number {
    return this.props.icmsBase;
  }

  get icmsRate(): number {
    return this.props.icmsRate;
  }

  get icmsValue(): number {
    return this.props.icmsValue;
  }

  get ipiBase(): number {
    return this.props.ipiBase;
  }

  get ipiRate(): number {
    return this.props.ipiRate;
  }

  get ipiValue(): number {
    return this.props.ipiValue;
  }

  get pisBase(): number {
    return this.props.pisBase;
  }

  get pisRate(): number {
    return this.props.pisRate;
  }

  get pisValue(): number {
    return this.props.pisValue;
  }

  get cofinsBase(): number {
    return this.props.cofinsBase;
  }

  get cofinsRate(): number {
    return this.props.cofinsRate;
  }

  get cofinsValue(): number {
    return this.props.cofinsValue;
  }

  get ibsRate(): number {
    return this.props.ibsRate;
  }

  get ibsValue(): number {
    return this.props.ibsValue;
  }

  get cbsRate(): number {
    return this.props.cbsRate;
  }

  get cbsValue(): number {
    return this.props.cbsValue;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  /** Total tax for this item (ICMS + IPI + PIS + COFINS + IBS + CBS) */
  get totalItemTax(): number {
    return (
      this.props.icmsValue +
      this.props.ipiValue +
      this.props.pisValue +
      this.props.cofinsValue +
      this.props.ibsValue +
      this.props.cbsValue
    );
  }

  static create(
    props: Optional<
      FiscalDocumentItemProps,
      | 'id'
      | 'createdAt'
      | 'discount'
      | 'icmsBase'
      | 'icmsRate'
      | 'icmsValue'
      | 'ipiBase'
      | 'ipiRate'
      | 'ipiValue'
      | 'pisBase'
      | 'pisRate'
      | 'pisValue'
      | 'cofinsBase'
      | 'cofinsRate'
      | 'cofinsValue'
      | 'ibsRate'
      | 'ibsValue'
      | 'cbsRate'
      | 'cbsValue'
    >,
    id?: UniqueEntityID,
  ): FiscalDocumentItem {
    return new FiscalDocumentItem(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        discount: props.discount ?? 0,
        icmsBase: props.icmsBase ?? 0,
        icmsRate: props.icmsRate ?? 0,
        icmsValue: props.icmsValue ?? 0,
        ipiBase: props.ipiBase ?? 0,
        ipiRate: props.ipiRate ?? 0,
        ipiValue: props.ipiValue ?? 0,
        pisBase: props.pisBase ?? 0,
        pisRate: props.pisRate ?? 0,
        pisValue: props.pisValue ?? 0,
        cofinsBase: props.cofinsBase ?? 0,
        cofinsRate: props.cofinsRate ?? 0,
        cofinsValue: props.cofinsValue ?? 0,
        ibsRate: props.ibsRate ?? 0,
        ibsValue: props.ibsValue ?? 0,
        cbsRate: props.cbsRate ?? 0,
        cbsValue: props.cbsValue ?? 0,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
