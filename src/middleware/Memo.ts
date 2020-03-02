import { Middleware } from "telegraf";
import { ContextMessageUpdateWithState } from "./CommandParser";
import { getManager } from "typeorm";
import { Memo } from "../entity";

const MemoCommand: Middleware<ContextMessageUpdateWithState> = async ctx => {
  const name = ctx.message.text.slice(1);
  let memo = await getManager().findOne(Memo, {
    chat_id: ctx.message.chat.id,
    name
  });

  if (!ctx.message.reply_to_message) {
    if (!memo) return;
    try {
      await ctx.telegram.forwardMessage(
        ctx.chat.id,
        ctx.chat.id,
        memo.message_id
      );
    } catch (e) {
      console.log(e.description);
    }
  } else {
    if (!memo) {
      memo = new Memo();
    }
    memo.chat_id = ctx.chat.id;
    memo.message_id = ctx.message.reply_to_message.message_id;
    memo.name = name;
    await getManager().save(memo);
    ctx.reply("저장하였습니다.", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "메시지 지우기",
              callback_data: "delmsg"
            }
          ]
        ]
      }
    });
  }
};

export default MemoCommand;
