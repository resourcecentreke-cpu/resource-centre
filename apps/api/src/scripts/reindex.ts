/* Reindex all products into Meilisearch. Run: pnpm --filter @rc/api search:reindex */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { SearchService } from '../search/search.service';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['warn', 'error'] });
  const search = app.get(SearchService);
  await search.ensureIndex();
  const n = await search.reindexAll();
  Logger.log(`Reindex complete: ${n} products`, 'Reindex');
  await app.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
