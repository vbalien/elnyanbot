import { KeyboardBuilder } from "../../util";
import { action, command, middleware } from "../../decorators";
import { AppContext } from "../../App";
import Api, { places } from "./Api";
import { ExtraReplyMessage } from "telegraf/typings/telegram-types";

@middleware()
export default class SchoolFood {
  @command("schoolfood")
  @action(/^\/schoolfood \d$/)
  async command(ctx: AppContext) {
    const placeId =
      Number.parseInt(ctx.state.command.splitArgs[0]) || places[0].id;
    const place = places.find((p) => p.id === placeId);
    const menus = await Api.getMenu(place);

    const replyMarkup = new KeyboardBuilder();
    const col = 2;
    for (let i = 0; i < places.length; i += col) {
      replyMarkup.addRow(
        places.slice(i, i + col).map((p) => [p.name, `/schoolfood ${p.id}`])
      );
    }
    replyMarkup.addRow([["메시지 지우기", "delmsg"]]);

    const options: ExtraReplyMessage = {
      reply_markup: replyMarkup.build(),
      parse_mode: "HTML",
      disable_web_page_preview: true,
    };

    try {
      const send = !ctx.callbackQuery ? ctx.reply : ctx.editMessageText;
      if (menus.length !== 0)
        send(
          menus.reduce(
            (prev, curr) =>
              prev +
              `<b>${curr.kind}` +
              (curr.price ? ` - ${curr.price}` : "") +
              (curr.image ? ` <a href="${curr.image}">사진</a>` : "") +
              `</b>\n${curr.foods}\n\n`,
            `<b>${place.name}</b>\n`
          ),
          options
        );
      else send(`<b>${place.name}</b>\n<b>오늘은 쉽니다.</b>`, options);
    } catch (e) {
      console.log(e);
    }
  }
}
