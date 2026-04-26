import { Router, type RequestHandler } from 'express';

export type HttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';

export interface ModuleRouteDefinition {
  readonly method: HttpMethod;
  readonly path: string;
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

  protected constructor(public readonly basePath: string) {
    this.router = Router();
    this.routeDefinitions = [];
  }

  public getRouteDefinitions(): ModuleRouteDefinition[] {
    return [...this.routeDefinitions];
  }

  protected delete(path: string, ...handlers: RequestHandler[]): void {
    this.recordRoute('DELETE', path);
    this.router.delete(path, ...handlers);
  }

  protected get(path: string, ...handlers: RequestHandler[]): void {
    this.recordRoute('GET', path);
    this.router.get(path, ...handlers);
  }

  protected patch(path: string, ...handlers: RequestHandler[]): void {
    this.recordRoute('PATCH', path);
    this.router.patch(path, ...handlers);
  }

  protected post(path: string, ...handlers: RequestHandler[]): void {
    this.recordRoute('POST', path);
    this.router.post(path, ...handlers);
  }

  protected put(path: string, ...handlers: RequestHandler[]): void {
    this.recordRoute('PUT', path);
    this.router.put(path, ...handlers);
  }

  private recordRoute(method: HttpMethod, path: string): void {
    this.routeDefinitions.push({ method, path });
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
