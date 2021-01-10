import { Memo } from "../entity";
import { KeyboardBuilder } from "../util";
import { AppContext } from "../App";
import { command, hears, middleware } from "../decorators";
import { Connection, Repository } from "typeorm";
import { inject } from "inversify";
import { TYPE } from "../constants";

@middleware()
export default class MemoCommand {
  private readonly _memoRepo: Repository<Memo>;

  public constructor(@inject(TYPE.MongoDBClient) conn: Connection) {
    this._memoRepo = conn.getRepository(Memo);
  }

  @hears(/^\/.*/)
  async addMemo(ctx: AppContext) {
    const name = ctx.message.text.slice(1);
    let memo = await this._memoRepo.findOne({
      chat_id: ctx.message.chat.id,
      name,
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
      await this._memoRepo.save(memo);
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
  }

  @command("memodel")
  async deleteMemo(ctx: AppContext) {
    const name = ctx.state.command.args;
    const memo = await this._memoRepo.findOne({
      chat_id: ctx.message.chat.id,
      name,
    });
    let msg = "없는 메모입니다.";
    if (memo) {
      await this._memoRepo.delete(memo);
      msg = "메모를 지웠습니다.";
    }
    await ctx.reply(msg, {
      reply_markup: new KeyboardBuilder()
        .addRow([["메시지 지우기", "delmsg"]])
        .build(),
    });
  }
}
