import { ParseAddressUseCase } from '../parse-address';

export function makeParseAddressUseCase(): ParseAddressUseCase {
  return new ParseAddressUseCase();
}
