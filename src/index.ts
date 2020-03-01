import Telegraf from "telegraf";
import { CommandParser, CountDown } from "./middleware";

const bot = new Telegraf(process.env.BOT_TOKEN, {
  username: process.env.BOT_NAME
});
bot.use(CommandParser());
bot.start(ctx => ctx.reply("Welcome"));
bot.command("cnt", CountDown);
bot.launch();
