import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type OrderType = 'QUOTE' | 'ORDER';

export type OrderChannel =
  | 'PDV'
  | 'WEB'
  | 'WHATSAPP'
  | 'MARKETPLACE'
  | 'BID'
  | 'MANUAL'
  | 'API';

export type DeliveryMethodType = 'PICKUP' | 'OWN_FLEET' | 'CARRIER' | 'PARTIAL';

export interface OrderProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  orderNumber: string;
  type: OrderType;
  customerId: UniqueEntityID;
  contactId?: UniqueEntityID;
  pipelineId: UniqueEntityID;
  stageId: UniqueEntityID;
  channel: OrderChannel;

  // Pricing
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingTotal: number;
  grandTotal: number;
  currency: string;
  priceTableId?: UniqueEntityID;

  // Payment
  paymentConditionId?: UniqueEntityID;
  creditUsed: number;
  paidAmount: number;
  remainingAmount: number;

  // Delivery
  deliveryMethod?: DeliveryMethodType;
  deliveryAddress?: Record<string, unknown>;
  trackingCode?: string;
  carrierName?: string;
  estimatedDelivery?: Date;
  deliveredAt?: Date;

  // Approval
  needsApproval: boolean;
  approvedByUserId?: UniqueEntityID;
  approvedAt?: Date;
  approvalNotes?: string;
  rejectedReason?: string;

  // External References
  dealId?: UniqueEntityID;
  quoteId?: UniqueEntityID;
  returnOriginId?: UniqueEntityID;
  couponId?: UniqueEntityID;

  // Warehouse
  sourceWarehouseId?: UniqueEntityID;

  // Assignment
  assignedToUserId?: UniqueEntityID;

  // Metadata
  notes?: string;
  internalNotes?: string;
  tags: string[];
  customFields?: Record<string, unknown>;
  stageEnteredAt: Date;
  confirmedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  expiresAt?: Date;

  deletedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export class Order extends Entity<OrderProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get orderNumber(): string {
    return this.props.orderNumber;
  }

  get type(): OrderType {
    return this.props.type;
  }

  set type(value: OrderType) {
    this.props.type = value;
    this.touch();
  }

  get customerId(): UniqueEntityID {
    return this.props.customerId;
  }

  get contactId(): UniqueEntityID | undefined {
    return this.props.contactId;
  }

  set contactId(value: UniqueEntityID | undefined) {
    this.props.contactId = value;
    this.touch();
  }

  get pipelineId(): UniqueEntityID {
    return this.props.pipelineId;
  }

  get stageId(): UniqueEntityID {
    return this.props.stageId;
  }

  set stageId(value: UniqueEntityID) {
    this.props.stageId = value;
    this.props.stageEnteredAt = new Date();
    this.touch();
  }

  get channel(): OrderChannel {
    return this.props.channel;
  }

  get subtotal(): number {
    return this.props.subtotal;
  }

  set subtotal(value: number) {
    this.props.subtotal = value;
    this.recalculateGrandTotal();
  }

  get discountTotal(): number {
    return this.props.discountTotal;
  }

  set discountTotal(value: number) {
    this.props.discountTotal = value;
    this.recalculateGrandTotal();
  }

  get taxTotal(): number {
    return this.props.taxTotal;
  }

  set taxTotal(value: number) {
    this.props.taxTotal = value;
    this.recalculateGrandTotal();
  }

  get shippingTotal(): number {
    return this.props.shippingTotal;
  }

  set shippingTotal(value: number) {
    this.props.shippingTotal = value;
    this.recalculateGrandTotal();
  }

  get grandTotal(): number {
    return this.props.grandTotal;
  }

  get currency(): string {
    return this.props.currency;
  }

  get priceTableId(): UniqueEntityID | undefined {
    return this.props.priceTableId;
  }

  get paymentConditionId(): UniqueEntityID | undefined {
    return this.props.paymentConditionId;
  }

  set paymentConditionId(value: UniqueEntityID | undefined) {
    this.props.paymentConditionId = value;
    this.touch();
  }

  get creditUsed(): number {
    return this.props.creditUsed;
  }

  set creditUsed(value: number) {
    this.props.creditUsed = value;
    this.recalculateRemainingAmount();
  }

  get paidAmount(): number {
    return this.props.paidAmount;
  }

  set paidAmount(value: number) {
    this.props.paidAmount = value;
    this.recalculateRemainingAmount();
  }

  get remainingAmount(): number {
    return this.props.remainingAmount;
  }

  get deliveryMethod(): DeliveryMethodType | undefined {
    return this.props.deliveryMethod;
  }

  set deliveryMethod(value: DeliveryMethodType | undefined) {
    this.props.deliveryMethod = value;
    this.touch();
  }

  get deliveryAddress(): Record<string, unknown> | undefined {
    return this.props.deliveryAddress;
  }

  get trackingCode(): string | undefined {
    return this.props.trackingCode;
  }

  get carrierName(): string | undefined {
    return this.props.carrierName;
  }

  get estimatedDelivery(): Date | undefined {
    return this.props.estimatedDelivery;
  }

  get deliveredAt(): Date | undefined {
    return this.props.deliveredAt;
  }

  get needsApproval(): boolean {
    return this.props.needsApproval;
  }

  set needsApproval(value: boolean) {
    this.props.needsApproval = value;
    this.touch();
  }

  get approvedByUserId(): UniqueEntityID | undefined {
    return this.props.approvedByUserId;
  }

  get approvedAt(): Date | undefined {
    return this.props.approvedAt;
  }

  get approvalNotes(): string | undefined {
    return this.props.approvalNotes;
  }

  get rejectedReason(): string | undefined {
    return this.props.rejectedReason;
  }

  get dealId(): UniqueEntityID | undefined {
    return this.props.dealId;
  }

  get quoteId(): UniqueEntityID | undefined {
    return this.props.quoteId;
  }

  get returnOriginId(): UniqueEntityID | undefined {
    return this.props.returnOriginId;
  }

  get couponId(): UniqueEntityID | undefined {
    return this.props.couponId;
  }

  get sourceWarehouseId(): UniqueEntityID | undefined {
    return this.props.sourceWarehouseId;
  }

  get assignedToUserId(): UniqueEntityID | undefined {
    return this.props.assignedToUserId;
  }

  set assignedToUserId(value: UniqueEntityID | undefined) {
    this.props.assignedToUserId = value;
    this.touch();
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  set notes(value: string | undefined) {
    this.props.notes = value;
    this.touch();
  }

  get internalNotes(): string | undefined {
    return this.props.internalNotes;
  }

  set internalNotes(value: string | undefined) {
    this.props.internalNotes = value;
    this.touch();
  }

  get tags(): string[] {
    return this.props.tags;
  }

  set tags(value: string[]) {
    this.props.tags = value;
    this.touch();
  }

  get customFields(): Record<string, unknown> | undefined {
    return this.props.customFields;
  }

  get stageEnteredAt(): Date {
    return this.props.stageEnteredAt;
  }

  get confirmedAt(): Date | undefined {
    return this.props.confirmedAt;
  }

  get cancelledAt(): Date | undefined {
    return this.props.cancelledAt;
  }

  get cancelReason(): string | undefined {
    return this.props.cancelReason;
  }

  get expiresAt(): Date | undefined {
    return this.props.expiresAt;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  confirm(approvedByUserId?: UniqueEntityID): void {
    this.props.confirmedAt = new Date();
    if (approvedByUserId) {
      this.props.approvedByUserId = approvedByUserId;
      this.props.approvedAt = new Date();
    }
    this.touch();
  }

  cancel(reason?: string): void {
    this.props.cancelledAt = new Date();
    this.props.cancelReason = reason;
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

  private recalculateGrandTotal(): void {
    this.props.grandTotal =
      this.props.subtotal -
      this.props.discountTotal +
      this.props.taxTotal +
      this.props.shippingTotal;
    this.recalculateRemainingAmount();
  }

  private recalculateRemainingAmount(): void {
    this.props.remainingAmount =
      this.props.grandTotal - this.props.paidAmount - this.props.creditUsed;
    this.touch();
  }

  static create(
    props: Optional<
      OrderProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
      | 'discountTotal'
      | 'taxTotal'
      | 'shippingTotal'
      | 'creditUsed'
      | 'paidAmount'
      | 'remainingAmount'
      | 'grandTotal'
      | 'currency'
      | 'tags'
      | 'needsApproval'
      | 'stageEnteredAt'
    >,
    id?: UniqueEntityID,
  ): Order {
    const discountTotal = props.discountTotal ?? 0;
    const taxTotal = props.taxTotal ?? 0;
    const shippingTotal = props.shippingTotal ?? 0;
    const grandTotal =
      props.grandTotal ??
      props.subtotal - discountTotal + taxTotal + shippingTotal;
    const creditUsed = props.creditUsed ?? 0;
    const paidAmount = props.paidAmount ?? 0;
    const remainingAmount =
      props.remainingAmount ?? grandTotal - paidAmount - creditUsed;

    return new Order(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        discountTotal,
        taxTotal,
        shippingTotal,
        grandTotal,
        currency: props.currency ?? 'BRL',
        creditUsed,
        paidAmount,
        remainingAmount,
        tags: props.tags ?? [],
        needsApproval: props.needsApproval ?? false,
        stageEnteredAt: props.stageEnteredAt ?? new Date(),
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
      },
      id,
    );
  }
}
