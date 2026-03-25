import { EfiPixProvider } from './efi-pix.provider';
import type { PixProvider } from './pix-provider.interface';

const providers = new Map<string, PixProvider>();

export function getPixProvider(providerName: string = 'EFI'): PixProvider {
  const normalizedName = providerName.toUpperCase();

  const cachedProvider = providers.get(normalizedName);
  if (cachedProvider) {
    return cachedProvider;
  }

  let provider: PixProvider;

  switch (normalizedName) {
    case 'EFI':
      provider = new EfiPixProvider();
      break;
    default:
      throw new Error(`Unsupported PIX provider: ${providerName}`);
  }

  providers.set(normalizedName, provider);
  return provider;
}
