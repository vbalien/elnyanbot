import { Container } from "inversify";
import Telegraf from "telegraf";
import { MiddlewareFn } from "telegraf/typings/composer";
import { TYPE } from "./constants";
import CommandParser, { TelegrafContextWithState } from "./util/CommandParser";
import {
  getMiddlewareActionMetadata,
  getMiddlewareCommandMetadata,
  getMiddlewareHearsMetadata,
  getMiddlewareMetadata,
  getMiddlewaresFromMetadata,
} from "./util/metadata";

export interface AppContext extends TelegrafContextWithState {
  container: Container;
}

export default class App {
  private _bot: Telegraf<AppContext>;
  private _container: Container;

  constructor(botToken: string, username: string, container: Container) {
    this._container = container;
    this._bot = new Telegraf<AppContext>(botToken, {
      username,
    });
    this._container
      .bind<Telegraf<AppContext>>(TYPE.BotInstance)
      .toConstantValue(this._bot);
  }

  private registerCommands() {
    const constructors = getMiddlewaresFromMetadata();

    for (const constructor of constructors) {
      const name = constructor.name;

      if (this._container.isBoundNamed(TYPE.Middleware, name)) {
        throw new Error(
          `미들웨어는 같은 이름을 두개 이상 사용 할 수 없습니다: ${name}`
        );
      }

      this._container
        .bind(TYPE.Middleware)
        .to(constructor as MiddlewareConstructor)
        .whenTargetNamed(name);
    }

    if (this._container.isBound(TYPE.Middleware)) {
      const middlewares = this._container.getAll<Function>(TYPE.Middleware);
      for (const middleware of middlewares) {
        const MiddlewareMetadata = getMiddlewareMetadata(
          middleware.constructor
        );
        const commandMetadata = getMiddlewareCommandMetadata(
          middleware.constructor
        );
        for (const metadata of commandMetadata) {
          const handler = this.handlerFactory(
            MiddlewareMetadata.target.name,
            metadata.key
          );
          this._bot.command(metadata.command, handler);
        }
      }

      for (const middleware of middlewares) {
        const MiddlewareMetadata = getMiddlewareMetadata(
          middleware.constructor
        );
        const actionMetadata = getMiddlewareActionMetadata(
          middleware.constructor
        );
        for (const metadata of actionMetadata) {
          const handler = this.handlerFactory(
            MiddlewareMetadata.target.name,
            metadata.key
          );
          this._bot.action(metadata.triggers, handler);
        }
      }

      for (const middleware of middlewares) {
        const MiddlewareMetadata = getMiddlewareMetadata(
          middleware.constructor
        );
        const hearsMetadata = getMiddlewareHearsMetadata(
          middleware.constructor
        );
        for (const metadata of hearsMetadata) {
          const handler = this.handlerFactory(
            MiddlewareMetadata.target.name,
            metadata.key
          );
          this._bot.hears(metadata.triggers, handler);
        }
      }
    }
  }

  private handlerFactory(
    middlewareName: string,
    key: string | symbol
  ): MiddlewareFn<AppContext> {
    return async (ctx) => {
      if (typeof key === "string")
        await ctx.container
          .getNamed<Record<string, Function>>(TYPE.Middleware, middlewareName)
          [key](ctx);
    };
  }

  build() {
    this._bot.use((ctx, next) => {
      ctx.container = this._container.createChild();
      return next();
    });
    this._bot.use(CommandParser());
    this._bot.action("delmsg", async (ctx) => {
      try {
        await ctx.deleteMessage();
      } catch (e) {
        console.log(e.description);
      }
    });
    this.registerCommands();
    return this._bot;
  }
}
