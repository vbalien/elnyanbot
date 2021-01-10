import { AppContext } from "../App";
import { command, middleware } from "../decorators";

@middleware()
export default class Select {
  @command("sel")
  command(ctx: AppContext) {
    const len = ctx.state.command.splitArgs.length;
    if (len <= 0) return;
    const rndVal = Math.floor(Math.random() * len);
    ctx.reply(`${ctx.state.command.splitArgs[rndVal]}`);
  }
}
