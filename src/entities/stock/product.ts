import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import type { Organization } from '../hr/organization/organization';
import type { Category } from './category';
import type { Manufacturer } from './manufacturer';
import type { Supplier } from './supplier';
import type { Tag } from './tag';
import type { Template } from './template';
import { CareInstructions } from './value-objects/care-instructions';
import { ProductStatus } from './value-objects/product-status';
import { Slug } from './value-objects/slug';
import type { Variant } from './variant';

export interface ProductProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  slug: Slug; // Slug gerado automaticamente - IMUTÁVEL
  fullCode: string; // Código completo gerado automaticamente (ex: 001.001.0001) - IMUTÁVEL
  sequentialCode?: number; // Código sequencial do produto
  barcode: string; // Code128 gerado do fullCode - IMUTÁVEL
  eanCode: string; // EAN-13 gerado do fullCode - IMUTÁVEL
  upcCode: string; // UPC gerado do fullCode - IMUTÁVEL
  qrCode?: string; // QR Code editável
  description?: string;
  status: ProductStatus;
  outOfLine: boolean; // Indica se o produto está fora de linha
  attributes: Record<string, unknown>;
  careInstructions: CareInstructions; // ISO 3758 care instruction IDs
  templateId: UniqueEntityID;
  template?: Template; // Relação com o template
  supplierId?: UniqueEntityID;
  supplier?: Supplier | null; // Relação com o fornecedor
  manufacturerId?: UniqueEntityID;
  manufacturer?: Manufacturer | null; // Relação com o fabricante
  organizationId?: UniqueEntityID;
  organization?: Organization | null; // Relação com a organização
  variants?: Variant[]; // Variantes do produto
  productCategories?: Array<{ category: Category }>; // Categorias
  productTags?: Array<{ tag: Tag }>; // Tags
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Product extends Entity<ProductProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  set name(name: string) {
    this.props.name = name;
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

  get description(): string | undefined {
    return this.props.description;
  }

  set description(description: string | undefined) {
    this.props.description = description;
    this.touch();
  }

  get status(): ProductStatus {
    return this.props.status;
  }

  set status(status: ProductStatus) {
    this.props.status = status;
    this.touch();
  }

  get attributes(): Record<string, unknown> {
    return this.props.attributes;
  }

  set attributes(attributes: Record<string, unknown>) {
    this.props.attributes = attributes;
    this.touch();
  }

  get outOfLine(): boolean {
    return this.props.outOfLine;
  }

  set outOfLine(outOfLine: boolean) {
    this.props.outOfLine = outOfLine;
    this.touch();
  }

  get careInstructions(): CareInstructions {
    return this.props.careInstructions;
  }

  set careInstructions(careInstructions: CareInstructions) {
    this.props.careInstructions = careInstructions;
    this.touch();
  }

  get careInstructionIds(): string[] {
    return this.props.careInstructions.toArray();
  }

  get templateId(): UniqueEntityID {
    return this.props.templateId;
  }

  get template(): Template | undefined {
    return this.props.template;
  }

  get supplierId(): UniqueEntityID | undefined {
    return this.props.supplierId;
  }

  set supplierId(supplierId: UniqueEntityID | undefined) {
    this.props.supplierId = supplierId;
    this.touch();
  }

  get supplier(): Supplier | null | undefined {
    return this.props.supplier;
  }

  set supplier(supplier: Supplier | null | undefined) {
    this.props.supplier = supplier ?? undefined;
    this.touch();
  }

  get manufacturerId(): UniqueEntityID | undefined {
    return this.props.manufacturerId;
  }

  set manufacturerId(manufacturerId: UniqueEntityID | undefined) {
    this.props.manufacturerId = manufacturerId;
    this.touch();
  }

  get manufacturer(): Manufacturer | null | undefined {
    return this.props.manufacturer;
  }

  set manufacturer(manufacturer: Manufacturer | null | undefined) {
    this.props.manufacturer = manufacturer ?? undefined;
    this.touch();
  }

  get organizationId(): UniqueEntityID | undefined {
    return this.props.organizationId;
  }

  set organizationId(organizationId: UniqueEntityID | undefined) {
    this.props.organizationId = organizationId;
    this.touch();
  }

  get organization(): Organization | null | undefined {
    return this.props.organization;
  }

  set organization(organization: Organization | null | undefined) {
    this.props.organization = organization ?? undefined;
    this.touch();
  }

  get variants(): Variant[] | undefined {
    return this.props.variants;
  }

  set variants(variants: Variant[] | undefined) {
    this.props.variants = variants;
    this.touch();
  }

  get productCategories(): Array<{ category: Category }> | undefined {
    return this.props.productCategories;
  }

  set productCategories(
    productCategories: Array<{ category: Category }> | undefined,
  ) {
    this.props.productCategories = productCategories;
    this.touch();
  }

  get categories(): Category[] | undefined {
    return this.props.productCategories?.map((pc) => pc.category);
  }

  get productTags(): Array<{ tag: Tag }> | undefined {
    return this.props.productTags;
  }

  set productTags(productTags: Array<{ tag: Tag }> | undefined) {
    this.props.productTags = productTags;
    this.touch();
  }

  get tags(): Tag[] | undefined {
    return this.props.productTags?.map((pt) => pt.tag);
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

  get hasSupplier(): boolean {
    return !!this.props.supplierId;
  }

  get hasManufacturer(): boolean {
    return !!this.props.manufacturerId;
  }

  get hasCareInstructions(): boolean {
    return !this.props.careInstructions.isEmpty;
  }

  get canBeSold(): boolean {
    return this.props.status.canBeSold && !this.isDeleted;
  }

  get isPublishable(): boolean {
    return this.props.status.canBePublished && !this.isDeleted;
  }

  get displayCode(): string {
    return this.props.fullCode ?? this.props.id.toString();
  }

  // Business Methods
  activate(): void {
    this.status = ProductStatus.create('ACTIVE');
  }

  deactivate(): void {
    this.status = ProductStatus.create('INACTIVE');
  }

  markAsOutOfStock(): void {
    this.status = ProductStatus.create('OUT_OF_STOCK');
  }

  discontinue(): void {
    this.status = ProductStatus.create('DISCONTINUED');
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
      ProductProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
      | 'attributes'
      | 'status'
      | 'careInstructions'
      | 'outOfLine'
    >,
    id?: UniqueEntityID,
  ): Product {
    const product = new Product(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        attributes: props.attributes ?? {},
        careInstructions: props.careInstructions ?? CareInstructions.empty(),
        status: props.status ?? ProductStatus.create('ACTIVE'),
        outOfLine: props.outOfLine ?? false,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
      },
      id,
    );

    return product;
  }
}
