import { Middleware } from "telegraf";
import { TelegrafContextWithState } from "./CommandParser";

const Select: Middleware<TelegrafContextWithState> = ctx => {
  const len = ctx.state.command.splitArgs.length;
  if (len <= 0) return;
  const rndVal = Math.floor(Math.random() * len);
  ctx.reply(`${ctx.state.command.splitArgs[rndVal]}`);
};

export default Select;
