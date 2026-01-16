export interface AddressComponents {
  warehouseCode: string;
  zoneCode: string;
  aisle: number;
  shelf: number;
  bin: string;
  separator: string;
}

interface ParseAddressUseCaseRequest {
  address: string;
}

interface ParseAddressUseCaseResponse {
  valid: boolean;
  components: AddressComponents | null;
  originalAddress: string;
  normalizedAddress: string | null;
  error?: string;
}

export class ParseAddressUseCase {
  async execute(
    input: ParseAddressUseCaseRequest,
  ): Promise<ParseAddressUseCaseResponse> {
    const { address } = input;
    const trimmedAddress = address.trim().toUpperCase();

    // Try to detect separator
    const separators = ['-', '.', '_'];
    let detectedSeparator = '';
    let parts: string[] = [];

    for (const sep of separators) {
      if (trimmedAddress.includes(sep)) {
        detectedSeparator = sep;
        parts = trimmedAddress.split(sep);
        break;
      }
    }

    // If no separator found, try to parse without separator (not supported for now)
    if (!detectedSeparator) {
      return {
        valid: false,
        components: null,
        originalAddress: address,
        normalizedAddress: null,
        error:
          'Endereço inválido: nenhum separador encontrado (esperado: -, . ou _)',
      };
    }

    // Expected format: WAREHOUSE-ZONE-POSITION-BIN
    // Example: FAB-EST-102-B
    if (parts.length !== 4) {
      return {
        valid: false,
        components: null,
        originalAddress: address,
        normalizedAddress: null,
        error: `Endereço inválido: esperado 4 partes, encontrado ${parts.length}`,
      };
    }

    const [warehouseCode, zoneCode, position, bin] = parts;

    // Validate warehouse code (2-5 alphanumeric characters)
    if (!/^[A-Z0-9]{2,5}$/.test(warehouseCode)) {
      return {
        valid: false,
        components: null,
        originalAddress: address,
        normalizedAddress: null,
        error:
          'Código do armazém inválido: deve ter 2-5 caracteres alfanuméricos',
      };
    }

    // Validate zone code (2-5 alphanumeric characters)
    if (!/^[A-Z0-9]{2,5}$/.test(zoneCode)) {
      return {
        valid: false,
        components: null,
        originalAddress: address,
        normalizedAddress: null,
        error: 'Código da zona inválido: deve ter 2-5 caracteres alfanuméricos',
      };
    }

    // Parse position (AISLE + SHELF combined, e.g., "102" = aisle 1, shelf 02)
    // Assume first digit(s) is aisle, rest is shelf
    if (!/^\d+$/.test(position)) {
      return {
        valid: false,
        components: null,
        originalAddress: address,
        normalizedAddress: null,
        error: 'Posição inválida: deve conter apenas números',
      };
    }

    // Determine aisle and shelf from position
    // For positions like "102" → aisle=1, shelf=02
    // For positions like "1502" → aisle=15, shelf=02
    let aisle: number;
    let shelf: number;

    if (position.length <= 2) {
      // "12" → aisle=1, shelf=2
      aisle = parseInt(position[0], 10);
      shelf = parseInt(position.slice(1) || '0', 10);
    } else if (position.length === 3) {
      // "102" → aisle=1, shelf=02
      aisle = parseInt(position[0], 10);
      shelf = parseInt(position.slice(1), 10);
    } else if (position.length === 4) {
      // "1502" → aisle=15, shelf=02 or aisle=1, shelf=502
      // Default: first 2 digits = aisle, last 2 = shelf
      aisle = parseInt(position.slice(0, 2), 10);
      shelf = parseInt(position.slice(2), 10);
    } else {
      // For longer positions, use first 2 as aisle
      aisle = parseInt(position.slice(0, 2), 10);
      shelf = parseInt(position.slice(2), 10);
    }

    // Validate bin (1-2 alphanumeric characters)
    if (!/^[A-Z0-9]{1,2}$/.test(bin)) {
      return {
        valid: false,
        components: null,
        originalAddress: address,
        normalizedAddress: null,
        error:
          'Código do nicho inválido: deve ter 1-2 caracteres alfanuméricos',
      };
    }

    const components: AddressComponents = {
      warehouseCode,
      zoneCode,
      aisle,
      shelf,
      bin,
      separator: detectedSeparator,
    };

    // Generate normalized address
    const normalizedAddress = `${warehouseCode}${detectedSeparator}${zoneCode}${detectedSeparator}${position}${detectedSeparator}${bin}`;

    return {
      valid: true,
      components,
      originalAddress: address,
      normalizedAddress,
    };
  }
}
