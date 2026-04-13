import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type ProductionJobCardStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'ON_HOLD'
  | 'CANCELLED';

export interface ProductionJobCardProps {
  id: UniqueEntityID;
  productionOrderId: UniqueEntityID;
  operationRoutingId: UniqueEntityID;
  workstationId: UniqueEntityID | null;
  status: ProductionJobCardStatus;
  quantityPlanned: number;
  quantityCompleted: number;
  quantityScrapped: number;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  actualStart: Date | null;
  actualEnd: Date | null;
  barcode: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductionJobCard extends Entity<ProductionJobCardProps> {
  // Getters
  get jobCardId(): UniqueEntityID {
    return this.props.id;
  }

  get productionOrderId(): UniqueEntityID {
    return this.props.productionOrderId;
  }

  get operationRoutingId(): UniqueEntityID {
    return this.props.operationRoutingId;
  }

  get workstationId(): UniqueEntityID | null {
    return this.props.workstationId;
  }

  get status(): ProductionJobCardStatus {
    return this.props.status;
  }

  get quantityPlanned(): number {
    return this.props.quantityPlanned;
  }

  get quantityCompleted(): number {
    return this.props.quantityCompleted;
  }

  get quantityScrapped(): number {
    return this.props.quantityScrapped;
  }

  get scheduledStart(): Date | null {
    return this.props.scheduledStart;
  }

  get scheduledEnd(): Date | null {
    return this.props.scheduledEnd;
  }

  get actualStart(): Date | null {
    return this.props.actualStart;
  }

  get actualEnd(): Date | null {
    return this.props.actualEnd;
  }

  get barcode(): string | null {
    return this.props.barcode;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Setters
  set productionOrderId(productionOrderId: UniqueEntityID) {
    this.props.productionOrderId = productionOrderId;
    this.touch();
  }

  set operationRoutingId(operationRoutingId: UniqueEntityID) {
    this.props.operationRoutingId = operationRoutingId;
    this.touch();
  }

  set workstationId(workstationId: UniqueEntityID | null) {
    this.props.workstationId = workstationId;
    this.touch();
  }

  set status(status: ProductionJobCardStatus) {
    this.props.status = status;
    this.touch();
  }

  set quantityPlanned(quantityPlanned: number) {
    this.props.quantityPlanned = quantityPlanned;
    this.touch();
  }

  set quantityCompleted(quantityCompleted: number) {
    this.props.quantityCompleted = quantityCompleted;
    this.touch();
  }

  set quantityScrapped(quantityScrapped: number) {
    this.props.quantityScrapped = quantityScrapped;
    this.touch();
  }

  set scheduledStart(scheduledStart: Date | null) {
    this.props.scheduledStart = scheduledStart;
    this.touch();
  }

  set scheduledEnd(scheduledEnd: Date | null) {
    this.props.scheduledEnd = scheduledEnd;
    this.touch();
  }

  set actualStart(actualStart: Date | null) {
    this.props.actualStart = actualStart;
    this.touch();
  }

  set actualEnd(actualEnd: Date | null) {
    this.props.actualEnd = actualEnd;
    this.touch();
  }

  set barcode(barcode: string | null) {
    this.props.barcode = barcode;
    this.touch();
  }

  // Business Methods
  start(): void {
    this.props.actualStart = new Date();
    this.status = 'IN_PROGRESS';
  }

  complete(): void {
    this.props.actualEnd = new Date();
    this.status = 'COMPLETED';
  }

  hold(): void {
    this.status = 'ON_HOLD';
  }

  resume(): void {
    this.status = 'IN_PROGRESS';
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      ProductionJobCardProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'workstationId'
      | 'status'
      | 'quantityCompleted'
      | 'quantityScrapped'
      | 'scheduledStart'
      | 'scheduledEnd'
      | 'actualStart'
      | 'actualEnd'
      | 'barcode'
    >,
    id?: UniqueEntityID,
  ): ProductionJobCard {
    const jobCardId = id ?? props.id ?? new UniqueEntityID();

    const jobCard = new ProductionJobCard(
      {
        ...props,
        id: jobCardId,
        workstationId: props.workstationId ?? null,
        status: props.status ?? 'PENDING',
        quantityCompleted: props.quantityCompleted ?? 0,
        quantityScrapped: props.quantityScrapped ?? 0,
        scheduledStart: props.scheduledStart ?? null,
        scheduledEnd: props.scheduledEnd ?? null,
        actualStart: props.actualStart ?? null,
        actualEnd: props.actualEnd ?? null,
        barcode: props.barcode ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      jobCardId,
    );

    return jobCard;
  }
}
