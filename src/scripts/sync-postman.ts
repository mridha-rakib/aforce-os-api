import { env } from '../config/env';
import { apiModuleRegistry } from '../modules';
import { syncPostmanCollection, type PostmanSyncOptions } from '../integrations/postman/postman-collection';

async function main(): Promise<void> {
  const routes = apiModuleRegistry.getRouteDefinitions(env.API_PREFIX);
  const syncOptions: PostmanSyncOptions = {
    baseUrl: '{{baseUrl}}',
    collectionName: process.env.POSTMAN_COLLECTION_NAME ?? 'AForce API',
    ...(process.env.POSTMAN_API_KEY ? { apiKey: process.env.POSTMAN_API_KEY } : {}),
    ...(process.env.POSTMAN_COLLECTION_UID ? { collectionUid: process.env.POSTMAN_COLLECTION_UID } : {}),
    ...(process.env.POSTMAN_EXPORT_PATH ? { exportPath: process.env.POSTMAN_EXPORT_PATH } : {}),
    ...(process.env.POSTMAN_WORKSPACE_ID ? { workspaceId: process.env.POSTMAN_WORKSPACE_ID } : {}),
  };

  const result = await syncPostmanCollection(routes, syncOptions);

  console.log(
    JSON.stringify(
      {
        ...result,
        message:
          result.action === 'exported'
            ? 'Postman collection exported locally. Set POSTMAN_API_KEY to sync it to Postman.'
            : 'Postman collection synced.',
      },
      null,
      2,
    ),
  );
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
