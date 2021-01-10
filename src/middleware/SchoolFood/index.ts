import { Middleware } from "telegraf";
import Api, { MenuKind, Menu, MenuString } from "./Api";
import { KeyboardBuilder } from "../../util";
import { action, command, middleware } from "../../decorators";
import { AppContext } from "../../App";

@middleware()
export default class SchoolFood {
  private _makeText(data: Menu) {
    return `<b>${data.name}</b>\n${data.foods.reduce(
      (acc, cur) => acc + `${cur}\n`,
      ""
    )}\n`;
  }

  @command("schoolfood")
  @action(/^\/schoolfood \d$/)
  async command(ctx: AppContext) {
    let restaurant = Number.parseInt(ctx.state.command.args);
    if (Number.isNaN(restaurant)) restaurant = MenuKind.STUDENT;
    const menus = await Api.getMenu(restaurant);
    let result = `<b>${MenuString[restaurant]}</b>\n\n`;
    for (const menu of menus) {
      result += this._makeText(menu);
    }
    const send = !ctx.callbackQuery ? ctx.reply : ctx.editMessageText;
    send(result, {
      reply_markup: new KeyboardBuilder()
        .addRow(
          MenuString.slice(1, 3).map((e, i) => [e, `/schoolfood ${i + 1}`])
        )
        .addRow(MenuString.slice(3).map((e, i) => [e, `/schoolfood ${i + 3}`]))
        .addRow([["메시지 지우기", "delmsg"]])
        .build(),
      parse_mode: "HTML",
    });
  }
}
