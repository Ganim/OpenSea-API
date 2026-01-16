export class VolumeAlreadyExistsError extends Error {
  constructor(code: string) {
    super(`Volume com código "${code}" já existe`);
  }
}

export class VolumeNotFoundError extends Error {
  constructor(id: string) {
    super(`Volume com ID "${id}" não encontrado`);
  }
}

export class VolumeCannotBeClosed extends Error {
  constructor() {
    super('O volume não pode ser fechado em seu status atual');
  }
}

export class VolumeItemAlreadyExistsError extends Error {
  constructor(volumeId: string, itemId: string) {
    super(`O item "${itemId}" já existe no volume "${volumeId}"`);
  }
}

export class VolumeItemNotFoundError extends Error {
  constructor(volumeId: string, itemId: string) {
    super(`O item "${itemId}" não foi encontrado no volume "${volumeId}"`);
  }
}

export class InvalidVolumeStatusError extends Error {
  constructor(status: string) {
    super(`Status de volume inválido: "${status}"`);
  }
}
