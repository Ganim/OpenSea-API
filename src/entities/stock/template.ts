import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { UnitOfMeasure } from './value-objects/unit-of-measure';

/**
 * Tipos de dados suportados para atributos de template
 */
export type TemplateAttributeType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'select';

/**
 * Definição de um atributo de template
 * Usado para definir a estrutura de atributos em productAttributes, variantAttributes e itemAttributes
 */
export interface TemplateAttribute {
  /** Tipo do dado do atributo */
  type: TemplateAttributeType;
  /** Rótulo de exibição do atributo (ex: "Marca", "Cor", "Tamanho") */
  label?: string;
  /** Se o atributo é obrigatório */
  required?: boolean;
  /** Valor padrão do atributo */
  defaultValue?: unknown;
  /** Unidade de medida (ex: "kg", "cm", "m²", "un") */
  unitOfMeasure?: string;
  /** Se o atributo deve ser incluído na impressão/etiqueta */
  enablePrint?: boolean;
  /** Se o atributo deve ser exibido na visualização */
  enableView?: boolean;
  /** Opções disponíveis (apenas para type: 'select') */
  options?: string[];
  /** Descrição do atributo */
  description?: string;
  /** Máscara de entrada (ex: "###.###.###-##" para CPF, "(##) #####-####" para telefone) */
  mask?: string;
  /** Texto de placeholder para o campo de entrada */
  placeholder?: string;
}

/**
 * Mapa de atributos do template
 * Chave: nome do atributo, Valor: definição do atributo
 */
export type TemplateAttributesMap = Record<string, TemplateAttribute>;

export interface CareLabelInfo {
  washing?: string; // Símbolo/instrução de lavagem
  drying?: string; // Símbolo/instrução de secagem
  ironing?: string; // Símbolo/instrução de passadoria
  bleaching?: string; // Símbolo/instrução de alvejante
  dryClean?: string; // Símbolo/instrução de lavagem a seco
  composition?: { fiber: string; percentage: number }[]; // Composição do tecido
}

export interface TemplateProps {
  id: UniqueEntityID;
  code?: string; // Código hierárquico manual ou auto-gerado (3 dígitos: 001)
  sequentialCode?: number; // Para fallback na geração do code
  name: string;
  iconUrl?: string;
  unitOfMeasure: UnitOfMeasure;
  productAttributes: TemplateAttributesMap;
  variantAttributes: TemplateAttributesMap;
  itemAttributes: TemplateAttributesMap;
  careLabel?: CareLabelInfo;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Template extends Entity<TemplateProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get code(): string | undefined {
    return this.props.code;
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

  get iconUrl(): string | undefined {
    return this.props.iconUrl;
  }

  set iconUrl(iconUrl: string | undefined) {
    this.props.iconUrl = iconUrl;
    this.touch();
  }

  get unitOfMeasure(): UnitOfMeasure {
    return this.props.unitOfMeasure;
  }

  set unitOfMeasure(unit: UnitOfMeasure) {
    this.props.unitOfMeasure = unit;
    this.touch();
  }

  get productAttributes(): TemplateAttributesMap {
    return this.props.productAttributes;
  }

  set productAttributes(attributes: TemplateAttributesMap) {
    this.props.productAttributes = attributes;
    this.touch();
  }

  get variantAttributes(): TemplateAttributesMap {
    return this.props.variantAttributes;
  }

  set variantAttributes(attributes: TemplateAttributesMap) {
    this.props.variantAttributes = attributes;
    this.touch();
  }

  get itemAttributes(): TemplateAttributesMap {
    return this.props.itemAttributes;
  }

  set itemAttributes(attributes: TemplateAttributesMap) {
    this.props.itemAttributes = attributes;
    this.touch();
  }

  // Métodos auxiliares para obter apenas atributos com enablePrint/enableView
  get printableProductAttributes(): TemplateAttributesMap {
    return this.filterAttributesByFlag(
      this.props.productAttributes,
      'enablePrint',
    );
  }

  get printableVariantAttributes(): TemplateAttributesMap {
    return this.filterAttributesByFlag(
      this.props.variantAttributes,
      'enablePrint',
    );
  }

  get printableItemAttributes(): TemplateAttributesMap {
    return this.filterAttributesByFlag(
      this.props.itemAttributes,
      'enablePrint',
    );
  }

  get viewableProductAttributes(): TemplateAttributesMap {
    return this.filterAttributesByFlag(
      this.props.productAttributes,
      'enableView',
    );
  }

  get viewableVariantAttributes(): TemplateAttributesMap {
    return this.filterAttributesByFlag(
      this.props.variantAttributes,
      'enableView',
    );
  }

  get viewableItemAttributes(): TemplateAttributesMap {
    return this.filterAttributesByFlag(this.props.itemAttributes, 'enableView');
  }

  private filterAttributesByFlag(
    attributes: TemplateAttributesMap,
    flag: 'enablePrint' | 'enableView',
  ): TemplateAttributesMap {
    return Object.entries(attributes).reduce((acc, [key, attr]) => {
      if (attr[flag] === true) {
        acc[key] = attr;
      }
      return acc;
    }, {} as TemplateAttributesMap);
  }

  get careLabel(): CareLabelInfo | undefined {
    return this.props.careLabel;
  }

  set careLabel(careLabel: CareLabelInfo | undefined) {
    this.props.careLabel = careLabel;
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

  get hasProductAttributes(): boolean {
    return Object.keys(this.props.productAttributes).length > 0;
  }

  get hasVariantAttributes(): boolean {
    return Object.keys(this.props.variantAttributes).length > 0;
  }

  get hasItemAttributes(): boolean {
    return Object.keys(this.props.itemAttributes).length > 0;
  }

  get hasCareLabel(): boolean {
    return (
      !!this.props.careLabel && Object.keys(this.props.careLabel).length > 0
    );
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
      TemplateProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
      | 'isActive'
      | 'iconUrl'
      | 'productAttributes'
      | 'variantAttributes'
      | 'itemAttributes'
    >,
    id?: UniqueEntityID,
  ): Template {
    const template = new Template(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        iconUrl: props.iconUrl,
        productAttributes: props.productAttributes ?? {},
        variantAttributes: props.variantAttributes ?? {},
        itemAttributes: props.itemAttributes ?? {},
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
      },
      id,
    );

    return template;
  }
}
