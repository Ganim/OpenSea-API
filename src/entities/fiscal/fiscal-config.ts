import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type FiscalProvider =
  | 'NUVEM_FISCAL'
  | 'FOCUS_NFE'
  | 'WEBMANIABR'
  | 'NFEWIZARD';

export type FiscalEnvironment = 'HOMOLOGATION' | 'PRODUCTION';

export type TaxRegime =
  | 'SIMPLES_NACIONAL'
  | 'SIMPLES_NACIONAL_EXCESSO'
  | 'LUCRO_PRESUMIDO'
  | 'LUCRO_REAL'
  | 'MEI';

export interface FiscalConfigProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  provider: FiscalProvider;
  environment: FiscalEnvironment;
  apiKey: string;
  apiSecret?: string;
  defaultSeries: number;
  lastNfeNumber: number;
  lastNfceNumber: number;
  defaultCfop: string;
  defaultNaturezaOperacao: string;
  taxRegime: TaxRegime;
  nfceEnabled: boolean;
  nfceCscId?: string;
  nfceCscToken?: string;
  certificateId?: UniqueEntityID;
  contingencyMode: boolean;
  contingencyReason?: string;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt?: Date;
}

export class FiscalConfig extends Entity<FiscalConfigProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get provider(): FiscalProvider {
    return this.props.provider;
  }

  set provider(provider: FiscalProvider) {
    this.props.provider = provider;
    this.touch();
  }

  get environment(): FiscalEnvironment {
    return this.props.environment;
  }

  set environment(environment: FiscalEnvironment) {
    this.props.environment = environment;
    this.touch();
  }

  get apiKey(): string {
    return this.props.apiKey;
  }

  set apiKey(apiKey: string) {
    this.props.apiKey = apiKey;
    this.touch();
  }

  get apiSecret(): string | undefined {
    return this.props.apiSecret;
  }

  set apiSecret(apiSecret: string | undefined) {
    this.props.apiSecret = apiSecret;
    this.touch();
  }

  get defaultSeries(): number {
    return this.props.defaultSeries;
  }

  set defaultSeries(defaultSeries: number) {
    this.props.defaultSeries = defaultSeries;
    this.touch();
  }

  get lastNfeNumber(): number {
    return this.props.lastNfeNumber;
  }

  set lastNfeNumber(lastNfeNumber: number) {
    this.props.lastNfeNumber = lastNfeNumber;
    this.touch();
  }

  get lastNfceNumber(): number {
    return this.props.lastNfceNumber;
  }

  set lastNfceNumber(lastNfceNumber: number) {
    this.props.lastNfceNumber = lastNfceNumber;
    this.touch();
  }

  get defaultCfop(): string {
    return this.props.defaultCfop;
  }

  set defaultCfop(defaultCfop: string) {
    this.props.defaultCfop = defaultCfop;
    this.touch();
  }

  get defaultNaturezaOperacao(): string {
    return this.props.defaultNaturezaOperacao;
  }

  set defaultNaturezaOperacao(defaultNaturezaOperacao: string) {
    this.props.defaultNaturezaOperacao = defaultNaturezaOperacao;
    this.touch();
  }

  get taxRegime(): TaxRegime {
    return this.props.taxRegime;
  }

  set taxRegime(taxRegime: TaxRegime) {
    this.props.taxRegime = taxRegime;
    this.touch();
  }

  get nfceEnabled(): boolean {
    return this.props.nfceEnabled;
  }

  set nfceEnabled(nfceEnabled: boolean) {
    this.props.nfceEnabled = nfceEnabled;
    this.touch();
  }

  get nfceCscId(): string | undefined {
    return this.props.nfceCscId;
  }

  set nfceCscId(nfceCscId: string | undefined) {
    this.props.nfceCscId = nfceCscId;
    this.touch();
  }

  get nfceCscToken(): string | undefined {
    return this.props.nfceCscToken;
  }

  set nfceCscToken(nfceCscToken: string | undefined) {
    this.props.nfceCscToken = nfceCscToken;
    this.touch();
  }

  get certificateId(): UniqueEntityID | undefined {
    return this.props.certificateId;
  }

  set certificateId(certificateId: UniqueEntityID | undefined) {
    this.props.certificateId = certificateId;
    this.touch();
  }

  get contingencyMode(): boolean {
    return this.props.contingencyMode;
  }

  set contingencyMode(contingencyMode: boolean) {
    this.props.contingencyMode = contingencyMode;
    this.touch();
  }

  get contingencyReason(): string | undefined {
    return this.props.contingencyReason;
  }

  set contingencyReason(contingencyReason: string | undefined) {
    this.props.contingencyReason = contingencyReason;
    this.touch();
  }

  get settings(): Record<string, unknown> {
    return this.props.settings;
  }

  set settings(settings: Record<string, unknown>) {
    this.props.settings = settings;
    this.touch();
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

  static create(
    props: Optional<
      FiscalConfigProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'defaultSeries'
      | 'lastNfeNumber'
      | 'lastNfceNumber'
      | 'nfceEnabled'
      | 'contingencyMode'
      | 'settings'
    >,
    id?: UniqueEntityID,
  ): FiscalConfig {
    return new FiscalConfig(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        defaultSeries: props.defaultSeries ?? 1,
        lastNfeNumber: props.lastNfeNumber ?? 0,
        lastNfceNumber: props.lastNfceNumber ?? 0,
        nfceEnabled: props.nfceEnabled ?? false,
        contingencyMode: props.contingencyMode ?? false,
        settings: props.settings ?? {},
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
      },
      id,
    );
  }
}
