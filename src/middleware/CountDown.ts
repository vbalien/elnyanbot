import { Middleware } from "telegraf";
import { ContextMessageUpdateWithState } from "./CommandParser";

const CountDown: Middleware<ContextMessageUpdateWithState> = async ctx => {
  let startCount = Number.parseInt(ctx.state.command.splitArgs[0]);
  if (Number.isNaN(startCount)) startCount = 5;
  const lastMessage: string = ctx.state.command.splitArgs[1] || "ㄱㄱ";
  const tick = async (count: number) => {
    await ctx.telegram.sendMessage(ctx.chat.id, `${count || lastMessage}`);
    if (count > 0) {
      setTimeout(tick, 1000, count - 1);
    }
  };
  await tick(startCount);
};

export default CountDown;
