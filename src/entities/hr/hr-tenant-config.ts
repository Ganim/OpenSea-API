import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface HrTenantConfigProps {
  tenantId: string;

  // Empresa Cidadã (Lei 11.770/08)
  empresaCidadaEnabled: boolean;
  maternityLeaveDays: number; // 120 or 180
  paternityLeaveDays: number; // 5 or 20

  // Contribuição Sindical
  unionContributionEnabled: boolean;
  unionContributionRate: number | null; // e.g., 0.0333 = 1 day salary

  // PAT (Programa de Alimentação do Trabalhador)
  patEnabled: boolean;
  patMonthlyValuePerEmployee: number | null;

  // Banco de Horas
  timeBankIndividualMonths: number; // 6 months individual agreement
  timeBankCollectiveMonths: number; // 12 months collective agreement

  // GPS — Contribuição Patronal
  ratPercent: number; // 1, 2, or 3
  fapFactor: number; // 0.500 to 2.000
  terceirosPercent: number; // ~5.8%

  // Audit
  createdAt: Date;
  updatedAt: Date;
}

export class HrTenantConfig extends Entity<HrTenantConfigProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }

  get empresaCidadaEnabled(): boolean {
    return this.props.empresaCidadaEnabled;
  }

  get maternityLeaveDays(): number {
    return this.props.maternityLeaveDays;
  }

  get paternityLeaveDays(): number {
    return this.props.paternityLeaveDays;
  }

  get unionContributionEnabled(): boolean {
    return this.props.unionContributionEnabled;
  }

  get unionContributionRate(): number | null {
    return this.props.unionContributionRate;
  }

  get patEnabled(): boolean {
    return this.props.patEnabled;
  }

  get patMonthlyValuePerEmployee(): number | null {
    return this.props.patMonthlyValuePerEmployee;
  }

  get timeBankIndividualMonths(): number {
    return this.props.timeBankIndividualMonths;
  }

  get timeBankCollectiveMonths(): number {
    return this.props.timeBankCollectiveMonths;
  }

  get ratPercent(): number {
    return this.props.ratPercent;
  }

  get fapFactor(): number {
    return this.props.fapFactor;
  }

  get terceirosPercent(): number {
    return this.props.terceirosPercent;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private constructor(props: HrTenantConfigProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<HrTenantConfigProps, 'createdAt' | 'updatedAt'> &
      Partial<Pick<HrTenantConfigProps, 'createdAt' | 'updatedAt'>>,
    id?: UniqueEntityID,
  ): HrTenantConfig {
    return new HrTenantConfig(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }
}
