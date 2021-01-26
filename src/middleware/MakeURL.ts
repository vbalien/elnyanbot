import { AppContext } from "../App";
import { middleware, command } from "../decorators";
import { prop, getModelForClass, ReturnModelType } from "@typegoose/typegoose";
import { KeyboardBuilder } from "../util";

class URLPattern {
  @prop({ required: true, unique: true })
  name!: string;
  @prop({ unique: true })
  pattern: string;
  @prop()
  username?: string;
  @prop()
  password?: string;
}

@middleware()
export default class MakeURL {
  private _urlPatternModel: ReturnModelType<typeof URLPattern>;

  constructor() {
    this._urlPatternModel = getModelForClass(URLPattern);
  }

  @command("makeurl")
  async command(ctx: AppContext) {
    const patterns = await this._urlPatternModel.find({});
    const origUrl = ctx.state.command.args;

    try {
      for (const pattern of patterns) {
        const re = new RegExp(pattern.pattern);
        const OK = re.exec(origUrl);
        if (!OK) continue;
        const url = new URL(origUrl);
        url.username = pattern.username;
        url.password = pattern.password;
        await ctx.reply(url.href);
      }
    } catch (err) {
      console.log(err);
    }
  }

  @command("makeurl_add")
  async add(ctx: AppContext) {
    try {
      if (ctx.state.command.splitArgs.length !== 4) return;
      const pattern = await this._urlPatternModel.create({
        name: ctx.state.command.splitArgs[0],
        pattern: ctx.state.command.splitArgs[1],
        username: ctx.state.command.splitArgs[2],
        password: ctx.state.command.splitArgs[3],
      });
      await pattern.save();
      await ctx.reply("저장하였습니다.", {
        reply_markup: new KeyboardBuilder()
          .addRow([["메시지 지우기", "delmsg"]])
          .build(),
      });
    } catch (err) {
      console.log(err);
    }
  }

  @command("makeurl_del")
  async delete(ctx: AppContext) {
    try {
      const pattern = await this._urlPatternModel.findOne({
        name: ctx.state.command.splitArgs[0],
      });
      if (!pattern) return;
      await pattern.remove();
      await ctx.reply("삭제하였습니다.", {
        reply_markup: new KeyboardBuilder()
          .addRow([["메시지 지우기", "delmsg"]])
          .build(),
      });
    } catch (err) {
      console.log(err);
    }
  }
}
