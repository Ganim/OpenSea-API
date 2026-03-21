import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface SystemSkillDefinitionProps {
  id: UniqueEntityID;
  code: string;
  name: string;
  description: string | null;
  module: string | null;
  parentSkillCode: string | null;
  category: string;
  isCore: boolean;
  isVisible: boolean;
  iconUrl: string | null;
  requiresSetup: boolean;
  setupUrl: string | null;
  sortOrder: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date | null;
}

export class SystemSkillDefinition extends Entity<SystemSkillDefinitionProps> {
  get systemSkillDefinitionId(): UniqueEntityID {
    return this.props.id;
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
  get module(): string | null {
    return this.props.module;
  }
  get parentSkillCode(): string | null {
    return this.props.parentSkillCode;
  }
  get category(): string {
    return this.props.category;
  }
  get isCore(): boolean {
    return this.props.isCore;
  }
  get isVisible(): boolean {
    return this.props.isVisible;
  }
  get iconUrl(): string | null {
    return this.props.iconUrl;
  }
  get requiresSetup(): boolean {
    return this.props.requiresSetup;
  }
  get setupUrl(): string | null {
    return this.props.setupUrl;
  }
  get sortOrder(): number {
    return this.props.sortOrder;
  }
  get metadata(): Record<string, unknown> {
    return this.props.metadata;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date | null {
    return this.props.updatedAt;
  }

  set name(name: string) {
    this.props.name = name;
    this.touch();
  }
  set description(description: string | null) {
    this.props.description = description;
    this.touch();
  }
  set module(module: string | null) {
    this.props.module = module;
    this.touch();
  }
  set parentSkillCode(parentSkillCode: string | null) {
    this.props.parentSkillCode = parentSkillCode;
    this.touch();
  }
  set category(category: string) {
    this.props.category = category;
    this.touch();
  }
  set isCore(isCore: boolean) {
    this.props.isCore = isCore;
    this.touch();
  }
  set isVisible(isVisible: boolean) {
    this.props.isVisible = isVisible;
    this.touch();
  }
  set iconUrl(iconUrl: string | null) {
    this.props.iconUrl = iconUrl;
    this.touch();
  }
  set requiresSetup(requiresSetup: boolean) {
    this.props.requiresSetup = requiresSetup;
    this.touch();
  }
  set setupUrl(setupUrl: string | null) {
    this.props.setupUrl = setupUrl;
    this.touch();
  }
  set sortOrder(sortOrder: number) {
    this.props.sortOrder = sortOrder;
    this.touch();
  }
  set metadata(metadata: Record<string, unknown>) {
    this.props.metadata = metadata;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      SystemSkillDefinitionProps,
      | 'id'
      | 'description'
      | 'module'
      | 'parentSkillCode'
      | 'isCore'
      | 'isVisible'
      | 'iconUrl'
      | 'requiresSetup'
      | 'setupUrl'
      | 'sortOrder'
      | 'metadata'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: UniqueEntityID,
  ): SystemSkillDefinition {
    const skillId = id ?? props.id ?? new UniqueEntityID();
    return new SystemSkillDefinition(
      {
        ...props,
        id: skillId,
        description: props.description ?? null,
        module: props.module ?? null,
        parentSkillCode: props.parentSkillCode ?? null,
        isCore: props.isCore ?? false,
        isVisible: props.isVisible ?? true,
        iconUrl: props.iconUrl ?? null,
        requiresSetup: props.requiresSetup ?? false,
        setupUrl: props.setupUrl ?? null,
        sortOrder: props.sortOrder ?? 0,
        metadata: props.metadata ?? {},
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? null,
      },
      skillId,
    );
  }
}
