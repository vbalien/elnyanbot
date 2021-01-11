import { KeyboardBuilder } from "../util";
import { AppContext } from "../App";
import { command, hears, middleware } from "../decorators";
import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import { ReturnModelType } from "@typegoose/typegoose/lib/types";

@modelOptions({ options: { customName: "Memo" } })
class MemoModel {
  @prop()
  message_id: number;

  @prop()
  chat_id: number;

  @prop()
  name: string;
}

@middleware()
export default class MemoCommand {
  private readonly _memoModel: ReturnModelType<typeof MemoModel>;

  public constructor() {
    this._memoModel = getModelForClass(MemoModel);
  }

  @hears(/^\/.*/)
  async addMemo(ctx: AppContext, next: () => Promise<void>) {
    const name = ctx.message.text.slice(1);
    let memo = await this._memoModel.findOne({
      chat_id: ctx.message.chat.id,
      name,
    });

    if (!ctx.message.reply_to_message) {
      if (!memo) return next();
      try {
        await ctx.telegram.forwardMessage(
          ctx.chat.id,
          ctx.chat.id,
          memo.message_id
        );
      } catch (e) {
        console.log(e.description);
        return next();
      }
    } else {
      if (!memo) {
        memo = await this._memoModel.create({
          chat_id: ctx.chat.id,
          message_id: ctx.message.reply_to_message.message_id,
          name,
        });
        await memo.save();
      }
      try {
        await ctx.reply("저장하였습니다.", {
          reply_markup: new KeyboardBuilder()
            .addRow([["메시지 지우기", "delmsg"]])
            .build(),
        });
      } catch (e) {
        console.log(e.description);
        return next();
      }
    }
  }

  @command("memodel")
  async deleteMemo(ctx: AppContext) {
    const name = ctx.state.command.args;
    const memo = await this._memoModel.findOne({
      chat_id: ctx.message.chat.id,
      name,
    });
    let msg = "없는 메모입니다.";
    if (memo) {
      await memo.remove();
      msg = "메모를 지웠습니다.";
    }
    await ctx.reply(msg, {
      reply_markup: new KeyboardBuilder()
        .addRow([["메시지 지우기", "delmsg"]])
        .build(),
    });
  }
}
