import { Router, type RequestHandler } from 'express';

export type HttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';
export type RouteAudience = 'admin' | 'public' | 'user';

export interface RouteOptions {
  readonly audience?: RouteAudience;
  readonly name?: string;
}

export interface ModuleRouteDefinition {
  readonly method: HttpMethod;
  readonly path: string;
  readonly audience: RouteAudience;
  readonly name?: string;
}

export interface ApiRouteDefinition extends ModuleRouteDefinition {
  readonly basePath: string;
  readonly fullPath: string;
}

export interface RouteModule {
  readonly basePath: string;
  readonly router: Router;
  getRouteDefinitions(): ModuleRouteDefinition[];
}

export abstract class BaseRoute implements RouteModule {
  public readonly router: Router;
  private readonly routeDefinitions: ModuleRouteDefinition[];

  protected constructor(
    public readonly basePath: string,
    private readonly defaultAudience: RouteAudience = 'user',
  ) {
    this.router = Router();
    this.routeDefinitions = [];
  }

  public getRouteDefinitions(): ModuleRouteDefinition[] {
    return [...this.routeDefinitions];
  }

  protected delete(path: string, ...handlers: RequestHandler[]): void;
  protected delete(path: string, options: RouteOptions, ...handlers: RequestHandler[]): void;
  protected delete(path: string, ...handlersOrOptions: Array<RequestHandler | RouteOptions>): void {
    const { handlers, options } = this.normalizeRouteArguments(handlersOrOptions);
    this.recordRoute('DELETE', path, options);
    this.router.delete(path, ...handlers);
  }

  protected get(path: string, ...handlers: RequestHandler[]): void;
  protected get(path: string, options: RouteOptions, ...handlers: RequestHandler[]): void;
  protected get(path: string, ...handlersOrOptions: Array<RequestHandler | RouteOptions>): void {
    const { handlers, options } = this.normalizeRouteArguments(handlersOrOptions);
    this.recordRoute('GET', path, options);
    this.router.get(path, ...handlers);
  }

  protected patch(path: string, ...handlers: RequestHandler[]): void;
  protected patch(path: string, options: RouteOptions, ...handlers: RequestHandler[]): void;
  protected patch(path: string, ...handlersOrOptions: Array<RequestHandler | RouteOptions>): void {
    const { handlers, options } = this.normalizeRouteArguments(handlersOrOptions);
    this.recordRoute('PATCH', path, options);
    this.router.patch(path, ...handlers);
  }

  protected post(path: string, ...handlers: RequestHandler[]): void;
  protected post(path: string, options: RouteOptions, ...handlers: RequestHandler[]): void;
  protected post(path: string, ...handlersOrOptions: Array<RequestHandler | RouteOptions>): void {
    const { handlers, options } = this.normalizeRouteArguments(handlersOrOptions);
    this.recordRoute('POST', path, options);
    this.router.post(path, ...handlers);
  }

  protected put(path: string, ...handlers: RequestHandler[]): void;
  protected put(path: string, options: RouteOptions, ...handlers: RequestHandler[]): void;
  protected put(path: string, ...handlersOrOptions: Array<RequestHandler | RouteOptions>): void {
    const { handlers, options } = this.normalizeRouteArguments(handlersOrOptions);
    this.recordRoute('PUT', path, options);
    this.router.put(path, ...handlers);
  }

  private normalizeRouteArguments(handlersOrOptions: Array<RequestHandler | RouteOptions>): {
    handlers: RequestHandler[];
    options: RouteOptions;
  } {
    const maybeOptions = handlersOrOptions[0];

    if (typeof maybeOptions === 'object' && maybeOptions !== null) {
      return {
        handlers: handlersOrOptions.slice(1) as RequestHandler[],
        options: maybeOptions,
      };
    }

    return {
      handlers: handlersOrOptions as RequestHandler[],
      options: {},
    };
  }

  private recordRoute(method: HttpMethod, path: string, options: RouteOptions): void {
    this.routeDefinitions.push({
      audience: options.audience ?? this.defaultAudience,
      method,
      ...(options.name ? { name: options.name } : {}),
      path,
    });
  }

  protected abstract registerRoutes(): void;
}

export function joinRoutePaths(...parts: string[]): string {
  const path = parts
    .flatMap((part) => part.split('/'))
    .map((part) => part.trim())
    .filter(Boolean)
    .join('/');

  return path.length > 0 ? `/${path}` : '/';
}
