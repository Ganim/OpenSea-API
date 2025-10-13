import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import type { UniqueEntityID } from '../domain/unique-entity-id';

export interface TagProps {
  id: UniqueEntityID;
  name: string;
  slug: string;
  color: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class Tag extends Entity<TagProps> {
  // Getters
  get tagId(): UniqueEntityID {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get color(): string | null {
    return this.props.color;
  }

  get description(): string | null {
    return this.props.description;
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

  set color(color: string | null) {
    if (color !== null && !this.isValidHexColor(color)) {
      throw new Error('Color must be a valid hex color code (e.g., #FF5733)');
    }
    this.props.color = color;
    this.touch();
  }

  set description(description: string | null) {
    this.props.description = description;
    this.touch();
  }

  set deletedAt(deletedAt: Date | null) {
    this.props.deletedAt = deletedAt;
    this.touch();
  }

  // Computed Properties
  get hasColor(): boolean {
    return this.color !== null;
  }

  get hasDescription(): boolean {
    return (
      this.description !== null &&
      this.description !== undefined &&
      this.description.trim().length > 0
    );
  }

  // Business Methods
  updateColor(newColor: string | null): void {
    this.color = newColor;
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

  private isValidHexColor(color: string): boolean {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexColorRegex.test(color);
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<TagProps, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
    id?: UniqueEntityID,
  ): Tag {
    const tag = new Tag(
      {
        ...props,
        id: props.id ?? id!,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
        deletedAt: props.deletedAt ?? null,
      },
      id,
    );

    return tag;
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
