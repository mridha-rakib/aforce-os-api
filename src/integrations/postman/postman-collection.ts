import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { ApiRouteDefinition, HttpMethod, RouteAudience } from '../../common/http/base-route';

const POSTMAN_COLLECTION_SCHEMA =
  'https://schema.getpostman.com/json/collection/v2.1.0/collection.json';
const DEFAULT_EXPORT_PATH = path.resolve(process.cwd(), 'postman', 'aforce-api.collection.json');
const ROUTE_AUDIENCE_ORDER: RouteAudience[] = ['admin', 'user', 'public'];

interface PostmanUrl {
  readonly raw: string;
  readonly host: string[];
  readonly path: string[];
}

interface PostmanRequestBody {
  readonly mode: 'raw';
  readonly raw: string;
  readonly options: {
    readonly raw: {
      readonly language: 'json';
    };
  };
}

interface PostmanRequest {
  readonly method: HttpMethod;
  readonly header: Array<{
    readonly key: string;
    readonly value: string;
  }>;
  readonly url: PostmanUrl;
  readonly body?: PostmanRequestBody;
}

interface PostmanItem {
  readonly name: string;
  readonly item?: PostmanItem[];
  readonly request?: PostmanRequest;
}

export interface PostmanCollection {
  readonly info: {
    readonly name: string;
    readonly schema: string;
    readonly description: string;
    readonly _postman_id?: string;
  };
  readonly variable: Array<{
    readonly key: string;
    readonly value: string;
    readonly type: 'string';
  }>;
  readonly item: PostmanItem[];
}

export interface BuildPostmanCollectionOptions {
  readonly baseUrl?: string;
  readonly collectionId?: string;
  readonly collectionName?: string;
}

export interface PostmanSyncOptions extends BuildPostmanCollectionOptions {
  readonly apiKey?: string;
  readonly collectionUid?: string;
  readonly exportPath?: string;
  readonly workspaceId?: string;
}

export interface PostmanSyncResult {
  readonly action: 'created' | 'exported' | 'updated';
  readonly collectionUid?: string;
  readonly exportPath: string;
  readonly routeCount: number;
}

export function buildPostmanCollection(
  routes: ApiRouteDefinition[],
  options: BuildPostmanCollectionOptions = {},
): PostmanCollection {
  const baseUrl = options.baseUrl ?? '{{baseUrl}}';
  const collectionName = options.collectionName ?? 'AForce API';
  const foldersByAudience = new Map<RouteAudience, { name: string; item: PostmanItem[] }>();
  const moduleFoldersByAudience = new Map<
    RouteAudience,
    Map<string, { name: string; item: PostmanItem[] }>
  >();

  routes.forEach((route) => {
    let audienceFolder = foldersByAudience.get(route.audience);

    if (!audienceFolder) {
      audienceFolder = {
        name: formatAudienceFolderName(route.audience),
        item: [],
      };
      foldersByAudience.set(route.audience, audienceFolder);
      moduleFoldersByAudience.set(route.audience, new Map());
    }

    const moduleFolders = moduleFoldersByAudience.get(route.audience);

    if (!moduleFolders) {
      return;
    }

    let moduleFolder = moduleFolders.get(route.basePath);

    if (!moduleFolder) {
      moduleFolder = {
        name: formatFolderName(route.basePath),
        item: [],
      };
      moduleFolders.set(route.basePath, moduleFolder);
      audienceFolder.item.push(moduleFolder);
    }

    moduleFolder.item.push(buildRequestItem(route, baseUrl));
  });

  const info: PostmanCollection['info'] = {
    name: collectionName,
    schema: POSTMAN_COLLECTION_SCHEMA,
    description: 'Generated from the AForce Express route registry.',
  };

  const collection: PostmanCollection = {
    info: options.collectionId ? { ...info, _postman_id: options.collectionId } : info,
    variable: [
      {
        key: 'baseUrl',
        value: 'http://localhost:4000',
        type: 'string',
      },
      {
        key: 'appleIdentityToken',
        value: 'paste-apple-identity-token-here',
        type: 'string',
      },
      {
        key: 'emailVerificationToken',
        value: 'paste-email-verification-token-here',
        type: 'string',
      },
      {
        key: 'googleIdToken',
        value: 'paste-google-id-token-here',
        type: 'string',
      },
      {
        key: 'refreshToken',
        value: 'paste-refresh-token-here',
        type: 'string',
      },
      {
        key: 'userId',
        value: 'paste-user-id-here',
        type: 'string',
      },
    ],
    item: ROUTE_AUDIENCE_ORDER.flatMap((audience) => {
      const folder = foldersByAudience.get(audience);

      return folder ? [folder] : [];
    }),
  };

  return collection;
}

export async function writePostmanCollection(
  collection: PostmanCollection,
  exportPath = DEFAULT_EXPORT_PATH,
): Promise<string> {
  await mkdir(path.dirname(exportPath), { recursive: true });
  await writeFile(exportPath, `${JSON.stringify(collection, null, 2)}\n`, 'utf8');

  return exportPath;
}

export async function syncPostmanCollection(
  routes: ApiRouteDefinition[],
  options: PostmanSyncOptions = {},
): Promise<PostmanSyncResult> {
  const collection = buildPostmanCollection(routes, {
    ...(options.baseUrl ? { baseUrl: options.baseUrl } : {}),
    ...(options.collectionUid ? { collectionId: options.collectionUid } : {}),
    ...(options.collectionName ? { collectionName: options.collectionName } : {}),
  });
  const exportPath = await writePostmanCollection(collection, options.exportPath);

  if (!options.apiKey) {
    return {
      action: 'exported',
      exportPath,
      routeCount: routes.length,
    };
  }

  const syncedCollectionUid = options.collectionUid
    ? await updatePostmanCollection(options.apiKey, options.collectionUid, collection)
    : await createPostmanCollection(options.apiKey, collection, options.workspaceId);

  const result: PostmanSyncResult = {
    action: options.collectionUid ? 'updated' : 'created',
    exportPath,
    routeCount: routes.length,
  };

  return syncedCollectionUid ? { ...result, collectionUid: syncedCollectionUid } : result;
}

function buildRequestItem(route: ApiRouteDefinition, baseUrl: string): PostmanItem {
  const exampleBody = getRequestBodyExample(route);

  return {
    name: route.name ?? `${route.method} ${route.fullPath}`,
    request: {
      method: route.method,
      header: needsRequestBody(route.method)
        ? [
            {
              key: 'Content-Type',
              value: 'application/json',
            },
          ]
        : [],
      url: {
        raw: `${baseUrl}${route.fullPath}`,
        host: [baseUrl],
        path: route.fullPath.split('/').filter(Boolean),
      },
      ...(needsRequestBody(route.method)
        ? {
            body: {
              mode: 'raw',
              raw: JSON.stringify(exampleBody, null, 2),
              options: {
                raw: {
                  language: 'json',
                },
              },
            },
          }
        : {}),
    },
  };
}

function needsRequestBody(method: HttpMethod): boolean {
  return method === 'PATCH' || method === 'POST' || method === 'PUT';
}

function getRequestBodyExample(route: ApiRouteDefinition): Record<string, unknown> {
  const routeKey = `${route.method} ${normalizeRoutePath(route.basePath, route.path)}`;
  const examples: Record<string, Record<string, unknown>> = {
    'POST /auth/register': {
      displayName: 'Alex Rivera',
      email: 'alex.rivera@example.com',
      firstName: 'Alex',
      lastName: 'Rivera',
      password: 'Password123',
    },
    'POST /auth/login': {
      email: 'alex.rivera@example.com',
      password: 'Password123',
    },
    'POST /auth/verify-email': {
      token: '{{emailVerificationToken}}',
    },
    'POST /auth/resend-verification': {
      email: 'alex.rivera@example.com',
    },
    'POST /auth/refresh': {
      refreshToken: '{{refreshToken}}',
    },
    'POST /auth/logout': {
      refreshToken: '{{refreshToken}}',
    },
    'POST /auth/google': {
      idToken: '{{googleIdToken}}',
    },
    'POST /auth/apple': {
      displayName: 'Alex Rivera',
      identityToken: '{{appleIdentityToken}}',
    },
    'POST /ai/hydration-decision': {
      context: {
        ambientTempC: 29,
        humidityPct: 68,
        sleepHours: 7.5,
        steps: 8200,
        workoutMinutes: 45,
      },
      intakeToday: {
        electrolyteMl: 500,
        waterMl: 1200,
      },
      profile: {
        activityLevel: 'moderate',
        goal: 'performance',
        weightKg: 75,
      },
      signals: {
        heartRateBpm: 82,
        sweatRateDeltaPct: 12,
        thirstLevel: 3,
        urineColorScore: 4,
      },
      userId: '{{userId}}',
    },
    'POST /hydration-plans/generate': {
      context: {
        ambientTempC: 29,
        humidityPct: 68,
        sleepHours: 7.5,
        steps: 8200,
        wakeHour: 7,
        workoutMinutes: 45,
        workoutStartHour: 18,
      },
      intakeToday: {
        electrolyteMl: 500,
        waterMl: 1200,
      },
      profile: {
        activityLevel: 'moderate',
        goal: 'performance',
        weightKg: 75,
      },
      userId: '{{userId}}',
    },
    'POST /intake-logs': {
      amountMl: 500,
      consumedAt: new Date('2026-04-27T09:30:00.000Z').toISOString(),
      electrolyteStrength: 'medium',
      hydrationScoreDelta: 8,
      notes: 'Morning hydration stick after workout.',
      productName: 'AForce Hydration Stick',
      productSku: 'AF-HYDRATION-STICK-LIME',
      source: 'electrolyte',
      userId: '{{userId}}',
    },
    'POST /nfc-tags/register': {
      batchCode: 'BATCH-2026-04',
      electrolyteBoost: 12,
      flavor: 'Lime',
      hydrationBoost: 20,
      productName: 'AForce Hydration Stick',
      productSku: 'AF-HYDRATION-STICK-LIME',
      status: 'active',
      tagUid: '04A1B2C3D4E5F6',
      volumeMl: 500,
    },
    'POST /nfc-tags/scan': {
      deviceId: 'device-iphone-14-pro-max',
      scannedAt: new Date('2026-04-27T09:35:00.000Z').toISOString(),
      tagUid: '04A1B2C3D4E5F6',
      userId: '{{userId}}',
    },
  };

  return examples[routeKey] ?? {};
}

function normalizeRoutePath(basePath: string, routePath: string): string {
  const normalized = `${basePath}/${routePath}`
    .replace(/\/+/g, '/')
    .replace(/\/$/, '');

  return normalized || '/';
}

function formatFolderName(basePath: string): string {
  const normalized = basePath.replace(/^\/+|\/+$/g, '');

  if (!normalized) {
    return 'Root';
  }

  return normalized
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatAudienceFolderName(audience: RouteAudience): string {
  switch (audience) {
    case 'admin':
      return 'Admin Routes';
    case 'public':
      return 'Public Routes';
    case 'user':
      return 'User Routes';
  }
}

async function createPostmanCollection(
  apiKey: string,
  collection: PostmanCollection,
  workspaceId?: string,
): Promise<string | undefined> {
  const url = new URL('https://api.getpostman.com/collections');

  if (workspaceId) {
    url.searchParams.set('workspace', workspaceId);
  }

  const payload = await sendPostmanRequest(apiKey, url, 'POST', collection);

  return readCollectionUid(payload);
}

async function updatePostmanCollection(
  apiKey: string,
  collectionUid: string,
  collection: PostmanCollection,
): Promise<string> {
  const url = new URL(`https://api.getpostman.com/collections/${collectionUid}`);

  await sendPostmanRequest(apiKey, url, 'PUT', collection);

  return collectionUid;
}

async function sendPostmanRequest(
  apiKey: string,
  url: URL,
  method: 'POST' | 'PUT',
  collection: PostmanCollection,
): Promise<unknown> {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
    body: JSON.stringify({ collection }),
  });
  const payload: unknown = await response.json().catch(() => undefined);

  if (!response.ok) {
    throw new Error(
      `Postman API ${method} ${url.pathname} failed with ${response.status}: ${JSON.stringify(payload)}`,
    );
  }

  return payload;
}

function readCollectionUid(payload: unknown): string | undefined {
  if (!isRecord(payload)) {
    return undefined;
  }

  const collection = payload.collection;

  if (!isRecord(collection)) {
    return undefined;
  }

  const uid = collection.uid;

  return typeof uid === 'string' ? uid : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
