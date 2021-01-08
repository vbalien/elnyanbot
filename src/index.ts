import "reflect-metadata";
import {
  CountDown,
  Memo as MemoCommand,
  Select,
  Anitable,
  DeleteMemoCommand,
  SchoolFood,
} from "./command";
import { initApp } from "./initApp";

(async () => {
  const bot = await initApp();
  bot.command("cnt", CountDown);
  bot.command("sel", Select);
  bot.command("anitable", Anitable);
  bot.command("schoolfood", SchoolFood);
  bot.command("memodel", DeleteMemoCommand);
  bot.action(/^\/anitable \d$/, Anitable);
  bot.action(/^\/schoolfood \d$/, SchoolFood);
  bot.hears(/^\/.*/, MemoCommand);
  bot.launch();
})();
