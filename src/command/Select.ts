import { Middleware } from "telegraf";
import { AppContext } from "../initApp";

const Select: Middleware<AppContext> = (ctx) => {
  const len = ctx.state.command.splitArgs.length;
  if (len <= 0) return;
  const rndVal = Math.floor(Math.random() * len);
  ctx.reply(`${ctx.state.command.splitArgs[rndVal]}`);
};

export default Select;
