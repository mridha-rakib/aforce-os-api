import { Router, type RequestHandler } from 'express';

export interface RouteModule {
  readonly basePath: string;
  readonly router: Router;
}

export abstract class BaseRoute implements RouteModule {
  public readonly router: Router;

  protected constructor(public readonly basePath: string) {
    this.router = Router();
  }

  protected delete(path: string, ...handlers: RequestHandler[]): void {
    this.router.delete(path, ...handlers);
  }

  protected get(path: string, ...handlers: RequestHandler[]): void {
    this.router.get(path, ...handlers);
  }

  protected patch(path: string, ...handlers: RequestHandler[]): void {
    this.router.patch(path, ...handlers);
  }

  protected post(path: string, ...handlers: RequestHandler[]): void {
    this.router.post(path, ...handlers);
  }

  protected put(path: string, ...handlers: RequestHandler[]): void {
    this.router.put(path, ...handlers);
  }

  protected abstract registerRoutes(): void;
}
