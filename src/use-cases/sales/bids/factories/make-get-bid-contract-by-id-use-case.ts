import { GetBidContractByIdUseCase } from '../get-bid-contract-by-id';
export function makeGetBidContractByIdUseCase() {
  return new GetBidContractByIdUseCase();
}
