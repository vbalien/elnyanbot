import { Middleware } from "telegraf";
import { getManager } from "typeorm";
import { Memo } from "../entity";
import { KeyboardBuilder } from "../util";
import { TelegrafContextWithState } from "./CommandParser";

const MemoCommand: Middleware<TelegrafContextWithState> = async ctx => {
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
    try {
      await ctx.reply("저장하였습니다.", {
        reply_markup: new KeyboardBuilder()
          .addRow([["메시지 지우기", "delmsg"]])
          .build(),
      });
    } catch (e) {
      console.log(e.description);
    }
  }
};

export const DeleteMemoCommand: Middleware<TelegrafContextWithState> = async ctx => {
  const name = ctx.state.command.args;
  const manager = await getManager();
  const memo = await manager.findOne(Memo, {
    chat_id: ctx.message.chat.id,
    name
  });
  let msg = "없는 메모입니다.";
  if (memo) {
    await manager.delete(Memo, memo);
    msg = "메모를 지웠습니다.";
  }
  await ctx.reply(msg, {
    reply_markup: new KeyboardBuilder()
      .addRow([["메시지 지우기", "delmsg"]])
      .build()
  });
};

export default MemoCommand;
