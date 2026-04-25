import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { ZoneStructure } from './value-objects/zone-structure';
import { ZoneLayout } from './value-objects/zone-layout';

export interface ZoneProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  warehouseId: UniqueEntityID;
  code: string;
  name: string;
  description: string | null;
  structure: ZoneStructure;
  layout: ZoneLayout | null;
  isActive: boolean;
  // Fase 1 (Emporion) — fractional sale config
  allowsFractionalSale: boolean;
  minFractionalSale?: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class Zone extends Entity<ZoneProps> {
  // Getters
  get zoneId(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get warehouseId(): UniqueEntityID {
    return this.props.warehouseId;
  }

  get code(): string {
    return this.props.code;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | null {
    return this.props.description;
  }

  get structure(): ZoneStructure {
    return this.props.structure;
  }

  get layout(): ZoneLayout | null {
    return this.props.layout;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  // Fase 1 (Emporion) — fractional sale config
  get allowsFractionalSale(): boolean {
    return this.props.allowsFractionalSale;
  }

  set allowsFractionalSale(value: boolean) {
    this.props.allowsFractionalSale = value;
    this.touch();
  }

  get minFractionalSale(): number | null | undefined {
    return this.props.minFractionalSale;
  }

  set minFractionalSale(value: number | null | undefined) {
    this.props.minFractionalSale = value;
    this.touch();
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
  set code(code: string) {
    if (code.length < 2 || code.length > 5) {
      throw new Error('Zone code must be between 2 and 5 characters');
    }
    this.props.code = code.toUpperCase();
    this.touch();
  }

  set name(name: string) {
    this.props.name = name;
    this.touch();
  }

  set description(description: string | null) {
    this.props.description = description;
    this.touch();
  }

  set structure(structure: ZoneStructure) {
    this.props.structure = structure;
    this.touch();
  }

  set layout(layout: ZoneLayout | null) {
    this.props.layout = layout;
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
  get hasDescription(): boolean {
    return this.description !== null && this.description.trim().length > 0;
  }

  get hasCustomLayout(): boolean {
    return this.layout !== null;
  }

  get totalBins(): number {
    return this.structure.totalBins;
  }

  get isConfigured(): boolean {
    return this.structure.isConfigured;
  }

  // Business Methods
  activate(): void {
    this.isActive = true;
  }

  deactivate(): void {
    this.isActive = false;
  }

  configureStructure(structure: ZoneStructure): void {
    this.structure = structure;
  }

  setCustomLayout(layout: ZoneLayout): void {
    this.layout = layout;
  }

  resetLayout(): void {
    this.layout = null;
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
      ZoneProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
      | 'isActive'
      | 'layout'
      | 'allowsFractionalSale'
      | 'minFractionalSale'
    >,
    id?: UniqueEntityID,
  ): Zone {
    const zoneId = id ?? props.id ?? new UniqueEntityID();

    const zone = new Zone(
      {
        ...props,
        id: zoneId,
        code: props.code.toUpperCase(),
        layout: props.layout ?? null,
        isActive: props.isActive ?? true,
        allowsFractionalSale: props.allowsFractionalSale ?? false,
        minFractionalSale: props.minFractionalSale ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
        deletedAt: props.deletedAt ?? null,
      },
      zoneId,
    );

    return zone;
  }
}
