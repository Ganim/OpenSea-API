import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type MaterialReservationStatus =
  | 'RESERVED'
  | 'PARTIALLY_ISSUED'
  | 'FULLY_ISSUED'
  | 'CANCELLED';

export interface ProductionMaterialReservationProps {
  id: UniqueEntityID;
  productionOrderId: UniqueEntityID;
  materialId: UniqueEntityID;
  warehouseId: UniqueEntityID;
  quantityReserved: number;
  quantityIssued: number;
  status: MaterialReservationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductionMaterialReservation extends Entity<ProductionMaterialReservationProps> {
  get materialReservationId(): UniqueEntityID {
    return this.props.id;
  }

  get productionOrderId(): UniqueEntityID {
    return this.props.productionOrderId;
  }

  get materialId(): UniqueEntityID {
    return this.props.materialId;
  }

  get warehouseId(): UniqueEntityID {
    return this.props.warehouseId;
  }

  get quantityReserved(): number {
    return this.props.quantityReserved;
  }

  get quantityIssued(): number {
    return this.props.quantityIssued;
  }

  get status(): MaterialReservationStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Setters
  set quantityIssued(quantityIssued: number) {
    this.props.quantityIssued = quantityIssued;
  }

  set status(status: MaterialReservationStatus) {
    this.props.status = status;
  }

  // Business methods
  cancel(): void {
    this.props.status = 'CANCELLED';
  }

  static create(
    props: Optional<
      ProductionMaterialReservationProps,
      'id' | 'createdAt' | 'updatedAt' | 'quantityIssued' | 'status'
    >,
    id?: UniqueEntityID,
  ): ProductionMaterialReservation {
    const reservationId = id ?? props.id ?? new UniqueEntityID();

    const reservation = new ProductionMaterialReservation(
      {
        ...props,
        id: reservationId,
        quantityIssued: props.quantityIssued ?? 0,
        status: props.status ?? 'RESERVED',
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      reservationId,
    );

    return reservation;
  }
}
