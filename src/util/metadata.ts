import { METADATA_KEY } from "../constants";

export function getMiddlewaresFromMetadata() {
  const arrayOfMiddlewareMetadata: MiddlewareMetadata[] =
    Reflect.getMetadata(METADATA_KEY.middleware, Reflect) || [];
  return arrayOfMiddlewareMetadata.map((metadata) => metadata.target);
}

export function getMiddlewareCommandMetadata(middleware: Function) {
  const methodMetadata: MiddlewareCommandMetadata[] =
    Reflect.getMetadata(METADATA_KEY.middlewareCommand, middleware) || [];
  return methodMetadata;
}

export function getMiddlewareActionMetadata(middleware: Function) {
  const methodMetadata: MiddlewareHearsMetadata[] =
    Reflect.getMetadata(METADATA_KEY.middlewareAction, middleware) || [];
  return methodMetadata;
}

export function getMiddlewareHearsMetadata(middleware: Function) {
  const methodMetadata: MiddlewareHearsMetadata[] =
    Reflect.getMetadata(METADATA_KEY.middlewareHears, middleware) || [];
  return methodMetadata;
}

export function getMiddlewareMetadata(middleware: Function) {
  const MiddlewareMetadata: MiddlewareMetadata = Reflect.getMetadata(
    METADATA_KEY.middleware,
    middleware
  );
  return MiddlewareMetadata;
}
