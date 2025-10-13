import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface CategoryProps {
  id: UniqueEntityID;
  name: string;
  slug: string;
  description: string | null;
  parentId: UniqueEntityID | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class Category extends Entity<CategoryProps> {
  // Getters
  get categoryId(): UniqueEntityID {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get description(): string | null {
    return this.props.description;
  }

  get parentId(): UniqueEntityID | null {
    return this.props.parentId;
  }

  get displayOrder(): number {
    return this.props.displayOrder;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  // Setters
  set name(name: string) {
    this.props.name = name;
    this.touch();
  }

  set slug(slug: string) {
    this.props.slug = slug;
    this.touch();
  }

  set description(description: string | null) {
    this.props.description = description;
    this.touch();
  }

  set parentId(parentId: UniqueEntityID | null) {
    this.props.parentId = parentId;
    this.touch();
  }

  set displayOrder(displayOrder: number) {
    if (displayOrder < 0) {
      throw new Error('Display order must be non-negative');
    }
    this.props.displayOrder = displayOrder;
    this.touch();
  }

  set isActive(isActive: boolean) {
    this.props.isActive = isActive;
    this.touch();
  }

  set deletedAt(deletedAt: Date | null) {
    this.props.deletedAt = deletedAt;
    this.touch();
  }

  // Computed Properties
  get hasParent(): boolean {
    return this.parentId !== null;
  }

  get isRootCategory(): boolean {
    return this.parentId === null;
  }

  get hasDescription(): boolean {
    return (
      this.description !== null &&
      this.description !== undefined &&
      this.description.trim().length > 0
    );
  }

  // Business Methods
  activate(): void {
    this.isActive = true;
  }

  deactivate(): void {
    this.isActive = false;
  }

  updateDisplayOrder(newOrder: number): void {
    this.displayOrder = newOrder;
  }

  moveToParent(parentId: UniqueEntityID | null): void {
    this.parentId = parentId;
  }

  makeRoot(): void {
    this.parentId = null;
  }

  updateSlug(newSlug: string): void {
    this.slug = newSlug;
  }

  delete(): void {
    this.deletedAt = new Date();
  }

  restore(): void {
    this.deletedAt = null;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      CategoryProps,
      'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
    >,
    id?: UniqueEntityID,
  ): Category {
    const categoryId = id ?? props.id ?? new UniqueEntityID();

    const category = new Category(
      {
        ...props,
        id: categoryId,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
        deletedAt: props.deletedAt ?? null,
      },
      categoryId,
    );

    return category;
  }

  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}
