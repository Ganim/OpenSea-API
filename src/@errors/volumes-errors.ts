export class VolumeAlreadyExistsError extends Error {
  constructor(code: string) {
    super(`Volume with code "${code}" already exists`);
  }
}

export class VolumeNotFoundError extends Error {
  constructor(id: string) {
    super(`Volume with ID "${id}" not found`);
  }
}

export class VolumeCannotBeClosed extends Error {
  constructor() {
    super('Volume cannot be closed in its current status');
  }
}

export class VolumeItemAlreadyExistsError extends Error {
  constructor(volumeId: string, itemId: string) {
    super(`Item "${itemId}" already exists in volume "${volumeId}"`);
  }
}

export class VolumeItemNotFoundError extends Error {
  constructor(volumeId: string, itemId: string) {
    super(`Item "${itemId}" not found in volume "${volumeId}"`);
  }
}

export class InvalidVolumeStatusError extends Error {
  constructor(status: string) {
    super(`Invalid volume status: "${status}"`);
  }
}
