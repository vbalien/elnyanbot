import { Middleware } from "telegraf";
import { Message } from "telegraf/typings/telegram-types";
import { AppContext } from "../initApp";

const CountDown: Middleware<AppContext> = async (ctx) => {
  let startCount = Number.parseInt(ctx.state.command.splitArgs[0]);
  if (Number.isNaN(startCount)) startCount = 5;
  const lastMessage: string = ctx.state.command.splitArgs[1] || "ㄱㄱ";
  const msgs: Message[] = [];
  const delMsgs = (msgs: Message[]) => {
    for (const msg of msgs) {
      ctx.telegram.deleteMessage(msg.chat.id, msg.message_id);
    }
  };
  const tick = async (count: number) => {
    msgs.push(
      await ctx.telegram.sendMessage(ctx.chat.id, `${count || lastMessage}`)
    );
    if (count <= 0) {
      setTimeout(delMsgs, 3000, msgs);
    } else {
      setTimeout(tick, 1000, count - 1);
    }
  };
  await tick(startCount);
};

export default CountDown;
