import { Middleware } from "telegraf";
import { ContextMessageUpdateWithState } from "../CommandParser";
import Api from "./Api";
import { DateTime } from "luxon";
import { KeyboardBuilder } from "../../util";

const Anitable: Middleware<ContextMessageUpdateWithState> = async ctx => {
  const now = DateTime.local().setLocale("ko-KR");
  const data = await Api.list(now.weekday % 7);
  ctx.reply(
    `${now.weekdayLong} 애니 편성표\n\n${data.reduce(
      (acc, cur) => acc + `${cur.time.toFormat("HH:mm")} │ ${cur.subtitle}\n`,
      ""
    )}
  `,
    {
      reply_markup: new KeyboardBuilder()
        .addRow([["메시지 지우기", "delmsg"]])
        .build()
    }
  );
};

export default Anitable;
