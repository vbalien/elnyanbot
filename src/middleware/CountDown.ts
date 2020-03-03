import { Middleware } from "telegraf";
import { ContextMessageUpdateWithState } from "./CommandParser";
import { Message } from "telegraf/typings/telegram-types";
import { KeyboardBuilder } from "../util";

const CountDown: Middleware<ContextMessageUpdateWithState> = async ctx => {
  let startCount = Number.parseInt(ctx.state.command.splitArgs[0]);
  if (Number.isNaN(startCount)) startCount = 5;
  const lastMessage: string = ctx.state.command.splitArgs[1] || "ㄱㄱ";
  const tick = async (count: number) => {
    const msg = await ctx.telegram.sendMessage(
      ctx.chat.id,
      `${count || lastMessage}`,
      {
        reply_markup: count
          ? undefined
          : new KeyboardBuilder().addRow([["메시지 지우기", "delmsg"]]).build()
      }
    );
    if (count > 0) {
      setTimeout(
        () => ctx.telegram.deleteMessage(msg.chat.id, msg.message_id),
        2000
      );
      setTimeout(tick, 1000, count - 1);
    }
  };
  await tick(startCount);
};

export default CountDown;
