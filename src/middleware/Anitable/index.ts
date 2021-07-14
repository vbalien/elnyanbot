import Api, { AnimeEntity } from "./Api";
import { DateTime } from "luxon";
import { KeyboardBuilder } from "../../util";
import { AppContext } from "../../App";
import { action, command, middleware } from "../../decorators";

@middleware()
export default class Anitable {
  private _weekTable = ["일", "월", "화", "수", "목", "금", "토"];

  @command("anitable")
  @action(/^\/anitable \d$/)
  async command(ctx: AppContext) {
    let currentWeek = Number.parseInt(ctx.command.args);
    if (Number.isNaN(currentWeek))
      currentWeek = DateTime.local().setZone("Asia/Seoul").weekday % 7;
    const data = await Api.list(currentWeek);
    const options = {
      reply_markup: new KeyboardBuilder()
        .addRow([
          ["이전", `/anitable ${(((currentWeek - 1) % 7) + 7) % 7}`],
          ["다음", `/anitable ${(currentWeek + 1) % 7}`],
        ])
        .addRow(
          this._weekTable.map((w, i) => [
            i === currentWeek ? `*${w}` : w,
            `/anitable ${i}`,
          ])
        )
        .addRow([["메시지 지우기", "delmsg"]])
        .build(),
    };
    try {
      const send = !ctx.callbackQuery ? ctx.reply : ctx.editMessageText;
      await send(this._makeText(data, currentWeek), options);
    } catch (e) {
      console.log(e);
    }
  }

  private _makeText(data: AnimeEntity[], weekNum: number) {
    return data.length == 0
      ? "데이터가 존재하지 않습니다."
      : `${this._weekTable[weekNum]}요일 애니 편성표\n\n${data.reduce(
          (acc, cur) =>
            acc + `${cur.time.toFormat("HH:mm")} │ ${cur.subject}\n`,
          ""
        )}`;
  }
}
