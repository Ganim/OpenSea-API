import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface SkillPricingProps {
  id: UniqueEntityID;
  skillCode: string;
  pricingType: string;
  flatPrice: number | null;
  unitPrice: number | null;
  unitMetric: string | null;
  unitMetricLabel: string | null;
  freeQuota: number | null;
  usageMetric: string | null;
  usageIncluded: number | null;
  usagePrice: number | null;
  usageMetricLabel: string | null;
  annualDiscount: number | null;
  isActive: boolean;
  tiers: unknown[];
  createdAt: Date;
  updatedAt: Date | null;
}

export class SkillPricing extends Entity<SkillPricingProps> {
  get skillPricingId(): UniqueEntityID {
    return this.props.id;
  }
  get skillCode(): string {
    return this.props.skillCode;
  }
  get pricingType(): string {
    return this.props.pricingType;
  }
  get flatPrice(): number | null {
    return this.props.flatPrice;
  }
  get unitPrice(): number | null {
    return this.props.unitPrice;
  }
  get unitMetric(): string | null {
    return this.props.unitMetric;
  }
  get unitMetricLabel(): string | null {
    return this.props.unitMetricLabel;
  }
  get freeQuota(): number | null {
    return this.props.freeQuota;
  }
  get usageMetric(): string | null {
    return this.props.usageMetric;
  }
  get usageIncluded(): number | null {
    return this.props.usageIncluded;
  }
  get usagePrice(): number | null {
    return this.props.usagePrice;
  }
  get usageMetricLabel(): string | null {
    return this.props.usageMetricLabel;
  }
  get annualDiscount(): number | null {
    return this.props.annualDiscount;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get tiers(): unknown[] {
    return this.props.tiers;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date | null {
    return this.props.updatedAt;
  }

  set pricingType(pricingType: string) {
    this.props.pricingType = pricingType;
    this.touch();
  }
  set flatPrice(flatPrice: number | null) {
    this.props.flatPrice = flatPrice;
    this.touch();
  }
  set unitPrice(unitPrice: number | null) {
    this.props.unitPrice = unitPrice;
    this.touch();
  }
  set unitMetric(unitMetric: string | null) {
    this.props.unitMetric = unitMetric;
    this.touch();
  }
  set unitMetricLabel(unitMetricLabel: string | null) {
    this.props.unitMetricLabel = unitMetricLabel;
    this.touch();
  }
  set freeQuota(freeQuota: number | null) {
    this.props.freeQuota = freeQuota;
    this.touch();
  }
  set usageMetric(usageMetric: string | null) {
    this.props.usageMetric = usageMetric;
    this.touch();
  }
  set usageIncluded(usageIncluded: number | null) {
    this.props.usageIncluded = usageIncluded;
    this.touch();
  }
  set usagePrice(usagePrice: number | null) {
    this.props.usagePrice = usagePrice;
    this.touch();
  }
  set usageMetricLabel(usageMetricLabel: string | null) {
    this.props.usageMetricLabel = usageMetricLabel;
    this.touch();
  }
  set annualDiscount(annualDiscount: number | null) {
    this.props.annualDiscount = annualDiscount;
    this.touch();
  }
  set isActive(isActive: boolean) {
    this.props.isActive = isActive;
    this.touch();
  }
  set tiers(tiers: unknown[]) {
    this.props.tiers = tiers;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      SkillPricingProps,
      | 'id'
      | 'flatPrice'
      | 'unitPrice'
      | 'unitMetric'
      | 'unitMetricLabel'
      | 'freeQuota'
      | 'usageMetric'
      | 'usageIncluded'
      | 'usagePrice'
      | 'usageMetricLabel'
      | 'annualDiscount'
      | 'isActive'
      | 'tiers'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: UniqueEntityID,
  ): SkillPricing {
    const pricingId = id ?? props.id ?? new UniqueEntityID();
    return new SkillPricing(
      {
        ...props,
        id: pricingId,
        flatPrice: props.flatPrice ?? null,
        unitPrice: props.unitPrice ?? null,
        unitMetric: props.unitMetric ?? null,
        unitMetricLabel: props.unitMetricLabel ?? null,
        freeQuota: props.freeQuota ?? null,
        usageMetric: props.usageMetric ?? null,
        usageIncluded: props.usageIncluded ?? null,
        usagePrice: props.usagePrice ?? null,
        usageMetricLabel: props.usageMetricLabel ?? null,
        annualDiscount: props.annualDiscount ?? 0,
        isActive: props.isActive ?? true,
        tiers: props.tiers ?? [],
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? null,
      },
      pricingId,
    );
  }
}
