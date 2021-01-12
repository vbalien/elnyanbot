import {
  getModelForClass,
  modelOptions,
  prop,
  ReturnModelType,
} from "@typegoose/typegoose";
import { AppContext } from "../App";
import { command, middleware } from "../decorators";
import { KeyboardBuilder } from "../util";

class User {
  @prop()
  id?: number;

  @prop({ required: true })
  text!: string;
}

@modelOptions({
  options: {
    customName: "Everyone",
  },
})
class EveryoneModel {
  @prop({ required: true, unique: true })
  chat_id!: number;

  @prop({ type: () => [User] })
  users: User[];
}

@middleware()
export default class Everyone {
  private _everyoneModel: ReturnModelType<typeof EveryoneModel>;

  constructor() {
    this._everyoneModel = getModelForClass(EveryoneModel);
  }

  @command("everyone")
  async sendEveryone(ctx: AppContext) {
    try {
      const everyoneData = await this._everyoneModel.findOne({
        chat_id: ctx.chat.id,
      });
      if (!everyoneData) return;
      let message = "";
      for (const user of everyoneData.users) {
        if (user.id)
          message += `<a href="tg://user?id=${user.id}" >${user.text}</a>`;
        else message += `${user.text}`;
        message += " ";
      }
      await ctx.reply(message, {
        parse_mode: "HTML",
      });
    } catch (err) {
      console.log(err);
    }
    return;
  }

  @command("everyone_add")
  async addUser(ctx: AppContext) {
    try {
      let everyoneData = await this._everyoneModel.findOne({
        chat_id: ctx.chat.id,
      });
      if (!everyoneData)
        everyoneData = await this._everyoneModel.create({
          chat_id: ctx.chat.id,
          users: [],
        });
      console.log(ctx.message.entities);
      for (const entity of ctx.message.entities.filter(
        (el) => el.type === "text_mention" || el.type === "mention"
      )) {
        if (entity.type === "text_mention") {
          if (everyoneData.users.find((el) => el.id === entity.user.id))
            continue;
          const user = new User();
          user.id = entity.user.id;
          user.text = entity.user.first_name;
          if (entity.user?.last_name) user.text += entity.user.last_name;
          everyoneData.users.push(user);
        } else {
          const user = new User();
          user.text = ctx.message.text.substr(entity.offset, entity.length);
          everyoneData.users.push(user);
        }
      }
      await everyoneData.save();
      await ctx.reply("저장하였습니다.", {
        reply_markup: new KeyboardBuilder()
          .addRow([["메시지 지우기", "delmsg"]])
          .build(),
      });
    } catch (err) {
      console.log(err);
    }
  }

  @command("everyone_del")
  async deleteUser(ctx: AppContext) {
    try {
      let everyoneData = await this._everyoneModel.findOne({
        chat_id: ctx.chat.id,
      });
      if (!everyoneData)
        everyoneData = await this._everyoneModel.create({
          chat_id: ctx.chat.id,
          users: [],
        });
      for (const entity of ctx.message.entities.filter(
        (el) => el.type === "text_mention" || el.type === "mention"
      )) {
        if (entity.type == "text_mention") {
          if (entity.user?.id)
            everyoneData.users = everyoneData.users.filter(
              (el) => el.id !== entity.user.id
            );
        } else {
          everyoneData.users = everyoneData.users.filter(
            (el) =>
              el.text !== ctx.message.text.substr(entity.offset, entity.length)
          );
        }
      }
      await everyoneData.save();
      await ctx.reply("삭제하였습니다.", {
        reply_markup: new KeyboardBuilder()
          .addRow([["메시지 지우기", "delmsg"]])
          .build(),
      });
    } catch (err) {
      console.log(err);
    }
    return;
  }
}
