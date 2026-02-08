import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface LabelTemplateProps {
  id: UniqueEntityID;
  name: string;
  description?: string;
  isSystem: boolean;
  width: number;
  height: number;
  grapesJsData: string;
  compiledHtml?: string;
  compiledCss?: string;
  thumbnailUrl?: string;
  tenantId: UniqueEntityID;
  createdById: UniqueEntityID;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class LabelTemplate extends Entity<LabelTemplateProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  set name(name: string) {
    this.props.name = name;
    this.touch();
  }

  get description(): string | undefined {
    return this.props.description;
  }

  set description(description: string | undefined) {
    this.props.description = description;
    this.touch();
  }

  get isSystem(): boolean {
    return this.props.isSystem;
  }

  get width(): number {
    return this.props.width;
  }

  set width(width: number) {
    if (width < 10 || width > 300) {
      throw new Error('Width must be between 10 and 300 mm');
    }
    this.props.width = width;
    this.touch();
  }

  get height(): number {
    return this.props.height;
  }

  set height(height: number) {
    if (height < 10 || height > 300) {
      throw new Error('Height must be between 10 and 300 mm');
    }
    this.props.height = height;
    this.touch();
  }

  get grapesJsData(): string {
    return this.props.grapesJsData;
  }

  set grapesJsData(grapesJsData: string) {
    this.props.grapesJsData = grapesJsData;
    this.touch();
  }

  get compiledHtml(): string | undefined {
    return this.props.compiledHtml;
  }

  set compiledHtml(compiledHtml: string | undefined) {
    this.props.compiledHtml = compiledHtml;
    this.touch();
  }

  get compiledCss(): string | undefined {
    return this.props.compiledCss;
  }

  set compiledCss(compiledCss: string | undefined) {
    this.props.compiledCss = compiledCss;
    this.touch();
  }

  get thumbnailUrl(): string | undefined {
    return this.props.thumbnailUrl;
  }

  set thumbnailUrl(thumbnailUrl: string | undefined) {
    this.props.thumbnailUrl = thumbnailUrl;
    this.touch();
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get createdById(): UniqueEntityID {
    return this.props.createdById;
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

  get dimensions(): string {
    return `${this.props.width}x${this.props.height}mm`;
  }

  get hasCompiledContent(): boolean {
    return !!this.props.compiledHtml || !!this.props.compiledCss;
  }

  get hasThumbnail(): boolean {
    return !!this.props.thumbnailUrl;
  }

  // Business Methods
  canBeEdited(): boolean {
    return !this.props.isSystem && !this.props.deletedAt;
  }

  canBeDeleted(): boolean {
    return !this.props.isSystem && !this.props.deletedAt;
  }

  delete(): void {
    if (this.props.isSystem) {
      throw new Error('Cannot delete system template');
    }
    this.props.deletedAt = new Date();
    this.touch();
  }

  restore(): void {
    this.props.deletedAt = undefined;
    this.touch();
  }

  updateCompiledContent(html?: string, css?: string): void {
    this.props.compiledHtml = html;
    this.props.compiledCss = css;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      LabelTemplateProps,
      'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'isSystem'
    >,
    id?: UniqueEntityID,
  ): LabelTemplate {
    const labelTemplate = new LabelTemplate(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        isSystem: props.isSystem ?? false,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
      },
      id,
    );

    return labelTemplate;
  }
}
