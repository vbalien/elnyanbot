import { HearsTriggers } from "telegraf/typings/composer";
import { TelegrafContext } from "telegraf/typings/context";

declare global {
  interface MiddlewareMetadata {
    target: Function;
  }

  interface MiddlewareHearsMetadata {
    key: string | symbol;
    triggers: HearsTriggers<TelegrafContext>;
    target: Object;
  }

  interface MiddlewareCommandMetadata {
    key: string | symbol;
    command: string | string[];
    target: Object;
  }

  interface MiddlewareConstructor {
    new (): void;
  }
}
