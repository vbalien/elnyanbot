import { Middleware } from "telegraf";
import { ContextMessageUpdateWithState } from "./CommandParser";

const Select: Middleware<ContextMessageUpdateWithState> = ctx => {
  const len = ctx.state.command.splitArgs.length;
  const rndVal = Math.floor(Math.random() * len);
  ctx.reply(`${ctx.state.command.splitArgs[rndVal]}`);
};

export default Select;
