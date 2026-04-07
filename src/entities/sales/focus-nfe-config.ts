import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface FocusNfeConfigProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  apiKey: string; // Deve estar encriptado no banco
  productionMode: boolean;
  isEnabled: boolean;
  defaultSeries: string;
  autoIssueOnConfirm: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export class FocusNfeConfig extends Entity<FocusNfeConfigProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get apiKey(): string {
    return this.props.apiKey;
  }

  set apiKey(value: string) {
    this.props.apiKey = value;
    this.touch();
  }

  get productionMode(): boolean {
    return this.props.productionMode;
  }

  set productionMode(value: boolean) {
    this.props.productionMode = value;
    this.touch();
  }

  get isEnabled(): boolean {
    return this.props.isEnabled;
  }

  set isEnabled(value: boolean) {
    this.props.isEnabled = value;
    this.touch();
  }

  get defaultSeries(): string {
    return this.props.defaultSeries;
  }

  set defaultSeries(value: string) {
    this.props.defaultSeries = value;
    this.touch();
  }

  get autoIssueOnConfirm(): boolean {
    return this.props.autoIssueOnConfirm;
  }

  set autoIssueOnConfirm(value: boolean) {
    this.props.autoIssueOnConfirm = value;
    this.touch();
  }

  get createdBy(): string | undefined {
    return this.props.createdBy;
  }

  get updatedBy(): string | undefined {
    return this.props.updatedBy;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  /**
   * Ativa ou desativa a configuração
   */
  toggleEnabled(): void {
    this.props.isEnabled = !this.props.isEnabled;
    this.touch();
  }

  /**
   * Alterna modo produção/sandbox
   */
  toggleProductionMode(): void {
    this.props.productionMode = !this.props.productionMode;
    this.touch();
  }

  /**
   * Cria uma nova FocusNfeConfig
   */
  static create(
    props: Optional<FocusNfeConfigProps, 'createdAt' | 'id'>,
    id?: UniqueEntityID,
  ): FocusNfeConfig {
    const config = new FocusNfeConfig(
      {
        ...props,
        id: props.id ?? id ?? new UniqueEntityID(),
        createdAt: props.createdAt ?? new Date(),
      },
      id ?? props.id,
    );
    return config;
  }
}
