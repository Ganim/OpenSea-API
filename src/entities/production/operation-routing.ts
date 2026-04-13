import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface ProductionOperationRoutingProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  bomId: UniqueEntityID;
  workstationId: UniqueEntityID | null;
  sequence: number;
  operationName: string;
  description: string | null;
  setupTime: number;
  executionTime: number;
  waitTime: number;
  moveTime: number;
  isQualityCheck: boolean;
  isOptional: boolean;
  skillRequired: string | null;
  instructions: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductionOperationRouting extends Entity<ProductionOperationRoutingProps> {
  // Getters
  get operationRoutingId(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get bomId(): UniqueEntityID {
    return this.props.bomId;
  }

  get workstationId(): UniqueEntityID | null {
    return this.props.workstationId;
  }

  get sequence(): number {
    return this.props.sequence;
  }

  get operationName(): string {
    return this.props.operationName;
  }

  get description(): string | null {
    return this.props.description;
  }

  get setupTime(): number {
    return this.props.setupTime;
  }

  get executionTime(): number {
    return this.props.executionTime;
  }

  get waitTime(): number {
    return this.props.waitTime;
  }

  get moveTime(): number {
    return this.props.moveTime;
  }

  get isQualityCheck(): boolean {
    return this.props.isQualityCheck;
  }

  get isOptional(): boolean {
    return this.props.isOptional;
  }

  get skillRequired(): string | null {
    return this.props.skillRequired;
  }

  get instructions(): string | null {
    return this.props.instructions;
  }

  get imageUrl(): string | null {
    return this.props.imageUrl;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Computed Properties
  get totalTime(): number {
    return this.setupTime + this.executionTime + this.waitTime + this.moveTime;
  }

  // Setters
  set bomId(bomId: UniqueEntityID) {
    this.props.bomId = bomId;
    this.touch();
  }

  set workstationId(workstationId: UniqueEntityID | null) {
    this.props.workstationId = workstationId;
    this.touch();
  }

  set sequence(sequence: number) {
    this.props.sequence = sequence;
    this.touch();
  }

  set operationName(operationName: string) {
    this.props.operationName = operationName;
    this.touch();
  }

  set description(description: string | null) {
    this.props.description = description;
    this.touch();
  }

  set setupTime(setupTime: number) {
    this.props.setupTime = setupTime;
    this.touch();
  }

  set executionTime(executionTime: number) {
    this.props.executionTime = executionTime;
    this.touch();
  }

  set waitTime(waitTime: number) {
    this.props.waitTime = waitTime;
    this.touch();
  }

  set moveTime(moveTime: number) {
    this.props.moveTime = moveTime;
    this.touch();
  }

  set isQualityCheck(isQualityCheck: boolean) {
    this.props.isQualityCheck = isQualityCheck;
    this.touch();
  }

  set isOptional(isOptional: boolean) {
    this.props.isOptional = isOptional;
    this.touch();
  }

  set skillRequired(skillRequired: string | null) {
    this.props.skillRequired = skillRequired;
    this.touch();
  }

  set instructions(instructions: string | null) {
    this.props.instructions = instructions;
    this.touch();
  }

  set imageUrl(imageUrl: string | null) {
    this.props.imageUrl = imageUrl;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      ProductionOperationRoutingProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'workstationId'
      | 'description'
      | 'isQualityCheck'
      | 'isOptional'
      | 'skillRequired'
      | 'instructions'
      | 'imageUrl'
    >,
    id?: UniqueEntityID,
  ): ProductionOperationRouting {
    const operationRoutingId = id ?? props.id ?? new UniqueEntityID();

    const operationRouting = new ProductionOperationRouting(
      {
        ...props,
        id: operationRoutingId,
        workstationId: props.workstationId ?? null,
        description: props.description ?? null,
        isQualityCheck: props.isQualityCheck ?? false,
        isOptional: props.isOptional ?? false,
        skillRequired: props.skillRequired ?? null,
        instructions: props.instructions ?? null,
        imageUrl: props.imageUrl ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      operationRoutingId,
    );

    return operationRouting;
  }
}
