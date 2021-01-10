/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-namespace */
import { HearsTriggers } from "telegraf/typings/composer";
import { TelegrafContext } from "telegraf/typings/context";

namespace interfaces {
  export interface MiddlewareMetadata {
    target: Function;
  }
  export interface MiddlewareHearsMetadata {
    key: string | symbol;
    triggers: HearsTriggers<TelegrafContext>;
    target: Object;
  }
  export interface MiddlewareCommandMetadata {
    key: string | symbol;
    command: string | string[];
    target: Object;
  }
}

export { interfaces };
