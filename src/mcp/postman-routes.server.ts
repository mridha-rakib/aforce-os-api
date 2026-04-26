import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { env } from '../config/env';
import { buildPostmanCollection, syncPostmanCollection, type PostmanSyncOptions } from '../integrations/postman/postman-collection';
import { apiModuleRegistry } from '../modules';

const server = new McpServer({
  name: 'aforce-postman-routes',
  version: '1.0.0',
});

const postmanOptionsSchema = {
  apiKey: z.string().min(1).optional().describe('Postman API key. Defaults to POSTMAN_API_KEY.'),
  baseUrl: z.string().min(1).optional().describe('Collection base URL variable or concrete URL.'),
  collectionName: z.string().min(1).optional().describe('Postman collection name.'),
  collectionUid: z
    .string()
    .min(1)
    .optional()
    .describe('Existing Postman collection UID. Defaults to POSTMAN_COLLECTION_UID.'),
  exportPath: z.string().min(1).optional().describe('Local path to write the generated collection JSON.'),
  workspaceId: z
    .string()
    .min(1)
    .optional()
    .describe('Postman workspace ID for new collections. Defaults to POSTMAN_WORKSPACE_ID.'),
};

type PostmanOptionsInput = {
  readonly apiKey?: string | undefined;
  readonly baseUrl?: string | undefined;
  readonly collectionName?: string | undefined;
  readonly collectionUid?: string | undefined;
  readonly exportPath?: string | undefined;
  readonly workspaceId?: string | undefined;
};

server.registerTool(
  'list_api_routes',
  {
    title: 'List API routes',
    description: 'List all Express routes registered through the AForce route registry.',
    inputSchema: {
      apiPrefix: z.string().min(1).optional().describe('API prefix. Defaults to the API_PREFIX env value.'),
    },
  },
  ({ apiPrefix }) => {
    const routes = apiModuleRegistry.getRouteDefinitions(apiPrefix ?? env.API_PREFIX);

    return jsonToolResult({
      routeCount: routes.length,
      routes,
    });
  },
);

server.registerTool(
  'export_postman_collection',
  {
    title: 'Export Postman collection',
    description: 'Generate a local Postman collection JSON file from the current Express route registry.',
    inputSchema: postmanOptionsSchema,
  },
  async (input: PostmanOptionsInput) => {
    const routes = apiModuleRegistry.getRouteDefinitions(env.API_PREFIX);
    const result = await syncPostmanCollection(routes, buildExportOptions(input));

    return jsonToolResult(result);
  },
);

server.registerTool(
  'sync_postman_collection',
  {
    title: 'Sync Postman collection',
    description:
      'Generate a Postman collection from registered Express routes, write it locally, and create or update it in Postman.',
    inputSchema: postmanOptionsSchema,
  },
  async (input: PostmanOptionsInput) => {
    const routes = apiModuleRegistry.getRouteDefinitions(env.API_PREFIX);
    const result = await syncPostmanCollection(routes, buildSyncOptions(input));

    return jsonToolResult(result);
  },
);

server.registerResource(
  'postman_collection',
  'postman://aforce-api/collection',
  {
    title: 'Generated AForce Postman collection',
    description: 'A generated Postman v2.1 collection built from the current route registry.',
    mimeType: 'application/json',
  },
  () => {
    const routes = apiModuleRegistry.getRouteDefinitions(env.API_PREFIX);
    const collection = buildPostmanCollection(routes, {
      baseUrl: '{{baseUrl}}',
      collectionName: process.env.POSTMAN_COLLECTION_NAME ?? 'AForce API',
    });

    return {
      contents: [
        {
          uri: 'postman://aforce-api/collection',
          mimeType: 'application/json',
          text: JSON.stringify(collection, null, 2),
        },
      ],
    };
  },
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

function buildSyncOptions(input: PostmanOptionsInput): PostmanSyncOptions {
  const apiKey = input.apiKey ?? process.env.POSTMAN_API_KEY;
  const collectionUid = input.collectionUid ?? process.env.POSTMAN_COLLECTION_UID;
  const workspaceId = input.workspaceId ?? process.env.POSTMAN_WORKSPACE_ID;

  return {
    baseUrl: input.baseUrl ?? '{{baseUrl}}',
    collectionName: input.collectionName ?? process.env.POSTMAN_COLLECTION_NAME ?? 'AForce API',
    ...(apiKey ? { apiKey } : {}),
    ...(collectionUid ? { collectionUid } : {}),
    ...(input.exportPath ? { exportPath: input.exportPath } : {}),
    ...(workspaceId ? { workspaceId } : {}),
  };
}

function buildExportOptions(input: PostmanOptionsInput): PostmanSyncOptions {
  return {
    baseUrl: input.baseUrl ?? '{{baseUrl}}',
    collectionName: input.collectionName ?? process.env.POSTMAN_COLLECTION_NAME ?? 'AForce API',
    ...(input.exportPath ? { exportPath: input.exportPath } : {}),
  };
}

function jsonToolResult(value: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
