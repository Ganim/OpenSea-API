import { ValueObject } from './cpf';

export enum ContractTypeEnum {
  CLT = 'CLT',
  PJ = 'PJ',
  INTERN = 'INTERN',
  TEMPORARY = 'TEMPORARY',
  APPRENTICE = 'APPRENTICE',
}

export class ContractType extends ValueObject<ContractTypeEnum> {
  private constructor(value: ContractTypeEnum) {
    super(value);
  }

  static create(type: ContractTypeEnum | string): ContractType {
    // If it's already an enum value, use it directly
    if (Object.values(ContractTypeEnum).includes(type as ContractTypeEnum)) {
      return new ContractType(type as ContractTypeEnum);
    }
    // If it's a string, try to match it to an enum value
    const enumValue = Object.values(ContractTypeEnum).find(v => v === type);
    if (!enumValue) {
      throw new Error(`Invalid contract type: ${type}`);
    }
    return new ContractType(enumValue);
  }

  static CLT(): ContractType {
    return new ContractType(ContractTypeEnum.CLT);
  }

  static PJ(): ContractType {
    return new ContractType(ContractTypeEnum.PJ);
  }

  static INTERN(): ContractType {
    return new ContractType(ContractTypeEnum.INTERN);
  }

  static TEMPORARY(): ContractType {
    return new ContractType(ContractTypeEnum.TEMPORARY);
  }

  static APPRENTICE(): ContractType {
    return new ContractType(ContractTypeEnum.APPRENTICE);
  }

  get value(): ContractTypeEnum {
    return this._value;
  }

  isCLT(): boolean {
    return this._value === ContractTypeEnum.CLT;
  }

  isPJ(): boolean {
    return this._value === ContractTypeEnum.PJ;
  }

  isIntern(): boolean {
    return this._value === ContractTypeEnum.INTERN;
  }

  isTemporary(): boolean {
    return this._value === ContractTypeEnum.TEMPORARY;
  }

  isApprentice(): boolean {
    return this._value === ContractTypeEnum.APPRENTICE;
  }

  hasEmploymentRights(): boolean {
    return this.isCLT() || this.isIntern() || this.isApprentice();
  }

  hasLaborLaws(): boolean {
    return this.isCLT() || this.isIntern() || this.isApprentice();
  }

  equals(other: ValueObject<ContractTypeEnum>): boolean {
    if (!(other instanceof ContractType)) return false;
    return super.equals(other);
  }
}
