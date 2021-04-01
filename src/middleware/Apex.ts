import axios from "axios";
import { AppContext } from "../App";
import { command, middleware } from "../decorators";

interface ServerStatusApiResponse {
  ApexOauth_Steam: {
    Asia: {
      Status: "UP" | "DOWN" | "NO DATA" | "SLOW";
      HTTPCode: number;
      ResponseTime: number;
      QueryTimestamp: number;
    };
  };
}

@middleware()
export default class Apex {
  @command("apex")
  async command(ctx: AppContext) {
    try {
      const res = await axios.get<ServerStatusApiResponse>(
        `https://api.mozambiquehe.re/servers?auth=${process.env.APEX_API_KEY}`
      );
      if (res.status !== 200) throw Error("Apex API 호출 오류");

      const status = res.data.ApexOauth_Steam.Asia.Status;
      await ctx.reply(`**APEX 레게노**\n현재 서버상태: **${status}**`, {
        parse_mode: "MarkdownV2",
      });
    } catch (err) {
      console.error(err);
    }
  }
}
