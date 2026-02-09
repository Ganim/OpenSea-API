import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { app } from '../src/app';

async function main() {
  const outputPath =
    process.argv[2] ||
    resolve(process.cwd(), '../OpenSea-APP/swagger/swagger.json');

  await app.ready();
  writeFileSync(outputPath, JSON.stringify(app.swagger(), null, 2));
  await app.close();
}

main();
