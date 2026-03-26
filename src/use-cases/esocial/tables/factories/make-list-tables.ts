import { ListTablesUseCase } from '../list-tables';

export function makeListTablesUseCase(): ListTablesUseCase {
  return new ListTablesUseCase();
}
