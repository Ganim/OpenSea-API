/**
 * One-off script to generate a VAPID key pair for Web Push.
 * Run with: `npx tsx scripts/generate-vapid-keys.ts`
 * Copy the output to your .env files (API + APP).
 */

async function main() {
  const mod = await import('web-push').catch(() => null);
  if (!mod) {
    console.error(
      'web-push package not installed. Run `npm install web-push @types/web-push` first.',
    );
    process.exit(1);
  }
  const webpush = (mod as { default?: unknown }).default ?? mod;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const keys = (webpush as any).generateVAPIDKeys();
  console.log('# Add to OpenSea-API/.env');
  console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
  console.log('VAPID_SUBJECT=mailto:admin@opensea.app');
  console.log('');
  console.log('# Add to OpenSea-APP/.env.local');
  console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
}

main();
