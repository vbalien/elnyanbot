import "reflect-metadata";
import { createConnection } from "typeorm";
import Telegraf from "telegraf";
import {
  CommandParser,
  CountDown,
  Memo as MemoCommand,
  Select,
  Anitable,
  DeleteMemoCommand
} from "./middleware";
import { Memo } from "./entity";

createConnection({
  type: "mongodb",
  host: process.env.MONGO_HOST || "localhost",
  database: "elnyan",
  entities: [Memo],
  synchronize: true,
  logging: false
})
  .then(() => {
    console.log("MongoDB Connected.");
  })
  .catch(error => console.log(error));

const bot = new Telegraf(process.env.BOT_TOKEN, {
  username: process.env.BOT_NAME
});
bot.use(CommandParser());
bot.action("delmsg", async ctx => {
  try {
    await ctx.deleteMessage();
  } catch (e) {
    console.log(e.description);
  }
});
bot.command("cnt", CountDown);
bot.command("sel", Select);
bot.command("anitable", Anitable);
bot.command("memodel", DeleteMemoCommand);
bot.action(/^\/anitable \d$/, Anitable);
bot.hears(/^\/.*/, MemoCommand);
bot.launch();
