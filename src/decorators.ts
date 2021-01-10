import { decorate, injectable } from "inversify";
import { HearsTriggers } from "telegraf/typings/composer";
import { TelegrafContext } from "telegraf/typings/context";
import { METADATA_KEY } from "./constants";

export function middleware(): ClassDecorator {
  return function (target) {
    const currentMetadata: MiddlewareMetadata = {
      target,
    };

    decorate(injectable(), target);
    Reflect.defineMetadata(METADATA_KEY.middleware, currentMetadata, target);

    const previousMetadata: MiddlewareMetadata[] =
      Reflect.getMetadata(METADATA_KEY.middleware, Reflect) || [];

    const newMetadata = [currentMetadata, ...previousMetadata];

    Reflect.defineMetadata(METADATA_KEY.middleware, newMetadata, Reflect);
  };
}

export function hears(
  triggers: HearsTriggers<TelegrafContext>
): MethodDecorator {
  return function (target, key) {
    const metadata: MiddlewareHearsMetadata = {
      key,
      triggers,
      target,
    };
    let metadataList: MiddlewareHearsMetadata[] = [];

    if (
      !Reflect.hasMetadata(METADATA_KEY.middlewareHears, target.constructor)
    ) {
      Reflect.defineMetadata(
        METADATA_KEY.middlewareHears,
        metadataList,
        target.constructor
      );
    } else {
      metadataList = Reflect.getMetadata(
        METADATA_KEY.middlewareHears,
        target.constructor
      );
    }

    metadataList.push(metadata);
  };
}

export function action(
  triggers: HearsTriggers<TelegrafContext>
): MethodDecorator {
  return function (target, key) {
    const metadata: MiddlewareHearsMetadata = {
      key,
      triggers,
      target,
    };

    let metadataList: MiddlewareHearsMetadata[] = [];

    if (
      !Reflect.hasMetadata(METADATA_KEY.middlewareAction, target.constructor)
    ) {
      Reflect.defineMetadata(
        METADATA_KEY.middlewareAction,
        metadataList,
        target.constructor
      );
    } else {
      metadataList = Reflect.getMetadata(
        METADATA_KEY.middlewareAction,
        target.constructor
      );
    }

    metadataList.push(metadata);
  };
}

export function command(command: string | string[]): MethodDecorator {
  return function (target, key) {
    const metadata: MiddlewareCommandMetadata = {
      key,
      command,
      target,
    };

    let metadataList: MiddlewareCommandMetadata[] = [];

    if (
      !Reflect.hasMetadata(METADATA_KEY.middlewareCommand, target.constructor)
    ) {
      Reflect.defineMetadata(
        METADATA_KEY.middlewareCommand,
        metadataList,
        target.constructor
      );
    } else {
      metadataList = Reflect.getMetadata(
        METADATA_KEY.middlewareCommand,
        target.constructor
      );
    }

    metadataList.push(metadata);
  };
}
