import { Middleware } from "telegraf";
import { ContextMessageUpdateWithState } from "../CommandParser";
import Api from "./Api";
import { DateTime } from "luxon";

const Anitable: Middleware<ContextMessageUpdateWithState> = async ctx => {
  const now = DateTime.local().setLocale("ko-KR");
  const data = await Api.list(now.weekday % 7);
  ctx.reply(
    `\`${now.weekdayLong} 애니 편성표\`\n\n${data.reduce(
      (acc, cur) =>
        acc + `\`${cur.time.toFormat("HH:mm")} │ ${cur.subtitle}\`\n`,
      ""
    )}
  `,
    {
      parse_mode: "Markdown"
    }
  );
};

export default Anitable;
