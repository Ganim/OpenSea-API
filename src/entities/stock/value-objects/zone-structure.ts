import { CodePattern, CodePatternProps } from './code-pattern';

export interface ZoneDimensions {
  aisleWidth?: number;
  aisleSpacing?: number;
  shelfWidth?: number;
  shelfHeight?: number;
  binHeight?: number;
}

export interface AisleConfig {
  aisleNumber: number;
  shelvesCount: number;
  binsPerShelf: number;
}

export interface ZoneStructureProps {
  aisles: number;
  shelvesPerAisle: number;
  binsPerShelf: number;
  aisleConfigs?: AisleConfig[];
  codePattern?: CodePatternProps;
  dimensions?: ZoneDimensions;
}

type NormalizedZoneStructureProps = ZoneStructureProps & {
  codePattern: CodePatternProps;
};

export class ZoneStructure {
  private readonly props: NormalizedZoneStructureProps;
  private readonly _codePattern: CodePattern;

  private constructor(props: Partial<ZoneStructureProps>) {
    this.props = ZoneStructure.normalizeProps(props);
    this._codePattern = CodePattern.fromJSON(this.props.codePattern);
  }

  private static normalizeProps(
    props: Partial<ZoneStructureProps>,
  ): NormalizedZoneStructureProps {
    const normalizedAisleConfigs = (props.aisleConfigs ?? [])
      .map((config) => ({
        aisleNumber: config.aisleNumber,
        shelvesCount: config.shelvesCount,
        binsPerShelf: config.binsPerShelf,
      }))
      .sort((a, b) => a.aisleNumber - b.aisleNumber);

    const hasConfigs = normalizedAisleConfigs.length > 0;
    const maxAisleNumber = hasConfigs
      ? Math.max(...normalizedAisleConfigs.map((config) => config.aisleNumber))
      : 0;
    const derivedAisles = hasConfigs
      ? Math.max(normalizedAisleConfigs.length, maxAisleNumber)
      : 0;
    const derivedShelves = hasConfigs
      ? Math.max(...normalizedAisleConfigs.map((config) => config.shelvesCount))
      : 0;
    const derivedBinsPerShelf = hasConfigs
      ? Math.max(...normalizedAisleConfigs.map((config) => config.binsPerShelf))
      : 0;

    return {
      aisles: hasConfigs
        ? Math.max(props.aisles ?? 0, derivedAisles)
        : props.aisles ?? 0,
      shelvesPerAisle: hasConfigs
        ? Math.max(props.shelvesPerAisle ?? 0, derivedShelves)
        : props.shelvesPerAisle ?? 0,
      binsPerShelf: hasConfigs
        ? Math.max(props.binsPerShelf ?? 0, derivedBinsPerShelf)
        : props.binsPerShelf ?? 0,
      aisleConfigs: hasConfigs ? normalizedAisleConfigs : undefined,
      codePattern: props.codePattern ?? CodePattern.default().toJSON(),
      dimensions: props.dimensions,
    };
  }

  get aisles(): number {
    return this.props.aisles;
  }

  get shelvesPerAisle(): number {
    return this.props.shelvesPerAisle;
  }

  get binsPerShelf(): number {
    return this.props.binsPerShelf;
  }

  get aisleConfigs(): AisleConfig[] | undefined {
    return this.props.aisleConfigs;
  }

  get codePattern(): CodePattern {
    return this._codePattern;
  }

  get dimensions(): ZoneDimensions | undefined {
    return this.props.dimensions;
  }

  get totalBins(): number {
    if (this.aisleConfigs?.length) {
      return this.aisleConfigs.reduce(
        (total, config) => total + config.shelvesCount * config.binsPerShelf,
        0,
      );
    }

    return this.aisles * this.shelvesPerAisle * this.binsPerShelf;
  }

  get totalShelves(): number {
    if (this.aisleConfigs?.length) {
      return this.aisleConfigs.reduce(
        (total, config) => total + config.shelvesCount,
        0,
      );
    }

    return this.aisles * this.shelvesPerAisle;
  }

  get isConfigured(): boolean {
    if (this.aisleConfigs?.length) {
      return this.aisleConfigs.some(
        (config) => config.shelvesCount > 0 && config.binsPerShelf > 0,
      );
    }

    return this.aisles > 0 && this.shelvesPerAisle > 0 && this.binsPerShelf > 0;
  }

  generateAllAddresses(warehouseCode: string, zoneCode: string): string[] {
    return this.generateBinData(warehouseCode, zoneCode).map(
      (bin) => bin.address,
    );
  }

  generateBinData(
    warehouseCode: string,
    zoneCode: string,
  ): Array<{
    address: string;
    aisle: number;
    shelf: number;
    position: string;
  }> {
    const bins: Array<{
      address: string;
      aisle: number;
      shelf: number;
      position: string;
    }> = [];

    if (this.aisleConfigs?.length) {
      for (const config of this.aisleConfigs) {
        for (let shelf = 1; shelf <= config.shelvesCount; shelf++) {
          for (let bin = 0; bin < config.binsPerShelf; bin++) {
            const position = this.codePattern.formatPosition(
              bin,
              config.binsPerShelf,
            );
            const address = this.codePattern.generateAddress(
              warehouseCode,
              zoneCode,
              config.aisleNumber,
              shelf,
              bin,
              config.binsPerShelf,
            );

            bins.push({
              address,
              aisle: config.aisleNumber,
              shelf,
              position,
            });
          }
        }
      }

      return bins;
    }

    for (let aisle = 1; aisle <= this.aisles; aisle++) {
      for (let shelf = 1; shelf <= this.shelvesPerAisle; shelf++) {
        for (let bin = 0; bin < this.binsPerShelf; bin++) {
          const position = this.codePattern.formatPosition(
            bin,
            this.binsPerShelf,
          );
          const address = this.codePattern.generateAddress(
            warehouseCode,
            zoneCode,
            aisle,
            shelf,
            bin,
            this.binsPerShelf,
          );

          bins.push({
            address,
            aisle,
            shelf,
            position,
          });
        }
      }
    }

    return bins;
  }

  toJSON(): ZoneStructureProps {
    return {
      ...this.props,
      codePattern: this.codePattern.toJSON(),
    };
  }

  equals(other: ZoneStructure): boolean {
    const configsMatch = (() => {
      if (!this.aisleConfigs?.length && !other.aisleConfigs?.length) {
        return true;
      }

      if ((this.aisleConfigs?.length ?? 0) !== (other.aisleConfigs?.length ?? 0)) {
        return false;
      }

      return (this.aisleConfigs ?? []).every((config, index) => {
        const otherConfig = other.aisleConfigs?.[index];
        if (!otherConfig) return false;

        return (
          config.aisleNumber === otherConfig.aisleNumber &&
          config.shelvesCount === otherConfig.shelvesCount &&
          config.binsPerShelf === otherConfig.binsPerShelf
        );
      });
    })();

    return (
      this.aisles === other.aisles &&
      this.shelvesPerAisle === other.shelvesPerAisle &&
      this.binsPerShelf === other.binsPerShelf &&
      configsMatch &&
      this.codePattern.equals(other.codePattern)
    );
  }

  static create(props: Partial<ZoneStructureProps> = {}): ZoneStructure {
    return new ZoneStructure(props);
  }

  static fromJSON(json: ZoneStructureProps): ZoneStructure {
    return new ZoneStructure(json);
  }

  static empty(): ZoneStructure {
    return ZoneStructure.create();
  }
}
