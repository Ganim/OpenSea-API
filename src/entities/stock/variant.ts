import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { Slug } from './value-objects/slug';

export interface VariantProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  productId: UniqueEntityID;
  sku?: string; // SKU manual opcional
  slug: Slug; // Slug gerado automaticamente - IMUTÁVEL
  fullCode: string; // Código completo gerado automaticamente (ex: 001.001.0001.001) - IMUTÁVEL
  sequentialCode?: number; // Código sequencial da variante
  barcode: string; // Code128 gerado do fullCode - IMUTÁVEL
  eanCode: string; // EAN-13 gerado do fullCode - IMUTÁVEL
  upcCode: string; // UPC gerado do fullCode - IMUTÁVEL
  qrCode?: string; // QR Code editável
  name: string;
  price: number;
  imageUrl?: string;
  attributes: Record<string, unknown>;
  costPrice?: number;
  profitMargin?: number;
  colorHex?: string;
  colorPantone?: string;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  reference?: string;
  similars?: unknown[];
  outOfLine: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Variant extends Entity<VariantProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get productId(): UniqueEntityID {
    return this.props.productId;
  }

  get sku(): string | undefined {
    return this.props.sku;
  }

  set sku(sku: string | undefined) {
    this.props.sku = sku;
    this.touch();
  }

  get slug(): Slug {
    return this.props.slug;
  }

  // slug é imutável após criação (gerado automaticamente)

  get fullCode(): string {
    return this.props.fullCode;
  }

  // fullCode é imutável após criação (gerado automaticamente)

  get barcode(): string {
    return this.props.barcode;
  }

  // barcode é imutável após criação (gerado automaticamente)

  get eanCode(): string {
    return this.props.eanCode;
  }

  // eanCode é imutável após criação (gerado automaticamente)

  get upcCode(): string {
    return this.props.upcCode;
  }

  // upcCode é imutável após criação (gerado automaticamente)

  get qrCode(): string | undefined {
    return this.props.qrCode;
  }

  set qrCode(qrCode: string | undefined) {
    this.props.qrCode = qrCode;
    this.touch();
  }

  get sequentialCode(): number | undefined {
    return this.props.sequentialCode;
  }

  get name(): string {
    return this.props.name;
  }

  set name(name: string) {
    this.props.name = name;
    this.touch();
  }

  get price(): number {
    return this.props.price;
  }

  set price(price: number) {
    if (price < 0) {
      throw new Error('Price cannot be negative');
    }
    this.props.price = price;
    this.touch();
  }

  get imageUrl(): string | undefined {
    return this.props.imageUrl;
  }

  set imageUrl(imageUrl: string | undefined) {
    this.props.imageUrl = imageUrl;
    this.touch();
  }

  get attributes(): Record<string, unknown> {
    return this.props.attributes;
  }

  set attributes(attributes: Record<string, unknown>) {
    this.props.attributes = attributes;
    this.touch();
  }

  get costPrice(): number | undefined {
    return this.props.costPrice;
  }

  set costPrice(costPrice: number | undefined) {
    if (costPrice !== undefined && costPrice < 0) {
      throw new Error('Cost price cannot be negative');
    }
    this.props.costPrice = costPrice;
    this.touch();
  }

  get profitMargin(): number | undefined {
    return this.props.profitMargin;
  }

  set profitMargin(profitMargin: number | undefined) {
    if (
      profitMargin !== undefined &&
      (profitMargin < 0 || profitMargin > 100)
    ) {
      throw new Error('Profit margin must be between 0 and 100');
    }
    this.props.profitMargin = profitMargin;
    this.touch();
  }

  get colorHex(): string | undefined {
    return this.props.colorHex;
  }

  set colorHex(colorHex: string | undefined) {
    this.props.colorHex = colorHex;
    this.touch();
  }

  get colorPantone(): string | undefined {
    return this.props.colorPantone;
  }

  set colorPantone(colorPantone: string | undefined) {
    this.props.colorPantone = colorPantone;
    this.touch();
  }

  get minStock(): number | undefined {
    return this.props.minStock;
  }

  set minStock(minStock: number | undefined) {
    if (minStock !== undefined && minStock < 0) {
      throw new Error('Min stock cannot be negative');
    }
    this.props.minStock = minStock;
    this.touch();
  }

  get maxStock(): number | undefined {
    return this.props.maxStock;
  }

  set maxStock(maxStock: number | undefined) {
    if (maxStock !== undefined && maxStock < 0) {
      throw new Error('Max stock cannot be negative');
    }
    this.props.maxStock = maxStock;
    this.touch();
  }

  get reorderPoint(): number | undefined {
    return this.props.reorderPoint;
  }

  set reorderPoint(reorderPoint: number | undefined) {
    if (reorderPoint !== undefined && reorderPoint < 0) {
      throw new Error('Reorder point cannot be negative');
    }
    this.props.reorderPoint = reorderPoint;
    this.touch();
  }

  get reorderQuantity(): number | undefined {
    return this.props.reorderQuantity;
  }

  set reorderQuantity(reorderQuantity: number | undefined) {
    if (reorderQuantity !== undefined && reorderQuantity < 0) {
      throw new Error('Reorder quantity cannot be negative');
    }
    this.props.reorderQuantity = reorderQuantity;
    this.touch();
  }

  get reference(): string | undefined {
    return this.props.reference;
  }

  set reference(reference: string | undefined) {
    this.props.reference = reference;
    this.touch();
  }

  get similars(): unknown[] | undefined {
    return this.props.similars;
  }

  set similars(similars: unknown[] | undefined) {
    this.props.similars = similars;
    this.touch();
  }

  get outOfLine(): boolean {
    return this.props.outOfLine;
  }

  set outOfLine(outOfLine: boolean) {
    this.props.outOfLine = outOfLine;
    this.touch();
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  set isActive(isActive: boolean) {
    this.props.isActive = isActive;
    this.touch();
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  // Computed Properties
  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  get hasCostPrice(): boolean {
    return this.props.costPrice !== undefined;
  }

  get hasBarcode(): boolean {
    return !!this.props.barcode;
  }

  get hasEanCode(): boolean {
    return !!this.props.eanCode;
  }

  get hasUpcCode(): boolean {
    return !!this.props.upcCode;
  }

  get hasStockControl(): boolean {
    return (
      this.props.minStock !== undefined ||
      this.props.maxStock !== undefined ||
      this.props.reorderPoint !== undefined
    );
  }

  get calculatedProfitMargin(): number | undefined {
    if (
      !this.hasCostPrice ||
      this.costPrice === undefined ||
      this.costPrice === 0
    ) {
      return undefined;
    }
    return ((this.price - this.costPrice) / this.costPrice) * 100;
  }

  get netProfit(): number | null {
    if (!this.hasCostPrice || this.costPrice === undefined) {
      return null;
    }
    return this.price - this.costPrice;
  }

  get hasGoodMargin(): boolean {
    const margin = this.calculatedProfitMargin;
    return margin !== null && margin !== undefined && margin >= 30;
  }

  get hasPoorMargin(): boolean {
    const margin = this.calculatedProfitMargin;
    return margin !== null && margin !== undefined && margin < 10;
  }

  get displayCode(): string {
    return this.props.fullCode ?? this.props.sku ?? this.props.id.toString();
  }

  // Business Methods
  activate(): void {
    this.props.isActive = true;
    this.touch();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.touch();
  }

  updatePrice(newPrice: number): void {
    this.price = newPrice;
  }

  updateCostPrice(newCostPrice: number): void {
    this.costPrice = newCostPrice;
  }

  updateStockLevels(
    minStock?: number,
    maxStock?: number,
    reorderPoint?: number,
    reorderQuantity?: number,
  ): void {
    if (minStock !== undefined) this.minStock = minStock;
    if (maxStock !== undefined) this.maxStock = maxStock;
    if (reorderPoint !== undefined) this.reorderPoint = reorderPoint;
    if (reorderQuantity !== undefined) this.reorderQuantity = reorderQuantity;
  }

  delete(): void {
    this.props.deletedAt = new Date();
    this.touch();
  }

  restore(): void {
    this.props.deletedAt = undefined;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      VariantProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
      | 'attributes'
      | 'price'
      | 'isActive'
      | 'outOfLine'
    >,
    id?: UniqueEntityID,
  ): Variant {
    const variant = new Variant(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        attributes: props.attributes ?? {},
        price: props.price ?? 0,
        isActive: props.isActive ?? true,
        outOfLine: props.outOfLine ?? false,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
      },
      id,
    );

    return variant;
  }
}
