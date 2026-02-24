export class StoragePath {
  public readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): StoragePath {
    const normalized = StoragePath.normalize(value);
    return new StoragePath(normalized);
  }

  static join(...parts: string[]): StoragePath {
    const combined = parts
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .join('/');

    return StoragePath.create(combined);
  }

  parent(): StoragePath | null {
    if (this.value === '/') {
      return null;
    }

    const lastSlashIndex = this.value.lastIndexOf('/');
    if (lastSlashIndex <= 0) {
      return new StoragePath('/');
    }

    return new StoragePath(this.value.substring(0, lastSlashIndex));
  }

  basename(): string {
    if (this.value === '/') {
      return '/';
    }

    const lastSlashIndex = this.value.lastIndexOf('/');
    return this.value.substring(lastSlashIndex + 1);
  }

  depth(): number {
    if (this.value === '/') {
      return 0;
    }

    return this.value.split('/').filter((segment) => segment.length > 0).length;
  }

  isRoot(): boolean {
    return this.value === '/';
  }

  isChildOf(parentPath: StoragePath): boolean {
    if (this.value === parentPath.value) {
      return false;
    }

    const parentPrefix =
      parentPath.value === '/' ? '/' : `${parentPath.value}/`;
    return this.value.startsWith(parentPrefix);
  }

  isDirectChildOf(parentPath: StoragePath): boolean {
    return (
      this.isChildOf(parentPath) && this.depth() === parentPath.depth() + 1
    );
  }

  append(segment: string): StoragePath {
    const sanitizedSegment = segment
      .toLowerCase()
      .trim()
      .replace(/\/+/g, '')
      .replace(/\s+/g, '-');

    if (this.value === '/') {
      return new StoragePath(`/${sanitizedSegment}`);
    }

    return new StoragePath(`${this.value}/${sanitizedSegment}`);
  }

  equals(other: StoragePath): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  private static normalize(path: string): string {
    let normalized = path.toLowerCase().trim();

    // Replace backslashes with forward slashes
    normalized = normalized.replace(/\\/g, '/');

    // Remove duplicate slashes
    normalized = normalized.replace(/\/+/g, '/');

    // Ensure starts with /
    if (!normalized.startsWith('/')) {
      normalized = `/${normalized}`;
    }

    // Remove trailing slash (unless it's the root)
    if (normalized.length > 1 && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  }
}
