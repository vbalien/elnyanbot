import { AppContext } from "../App";
import { command, middleware } from "../decorators";

@middleware()
export default class Select {
  @command("sel")
  command(ctx: AppContext) {
    const len = ctx.command.splitArgs.length;
    if (len <= 0) return;
    const rndVal = Math.floor(Math.random() * len);
    ctx.reply(`${ctx.command.splitArgs[rndVal]}`);
  }
}
