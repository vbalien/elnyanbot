import Telegraf from "telegraf";
import { Connection as DBConn, createConnection } from "typeorm";
import { Memo } from "./entity";
import CommandParser, {
  TelegrafContextWithState,
} from "./middleware/CommandParser";

export interface AppContext extends TelegrafContextWithState {
  dbConn: DBConn;
}

export const initApp = async (): Promise<Telegraf<AppContext>> => {
  const app = new Telegraf<AppContext>(process.env.BOT_TOKEN, {
    username: process.env.BOT_NAME,
  });
  app.context.dbConn = await createConnection({
    type: "mongodb",
    host: process.env.MONGO_HOST || "localhost",
    database: "elnyan",
    entities: [Memo],
    synchronize: true,
    logging: false,
  });

  app.use(CommandParser());
  app.action("delmsg", async (ctx) => {
    try {
      await ctx.deleteMessage();
    } catch (e) {
      console.log(e.description);
    }
  });

  return app;
};
