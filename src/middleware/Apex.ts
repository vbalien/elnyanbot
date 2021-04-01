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

      let statusMsg = "";
      switch (res.data.ApexOauth_Steam.Asia.Status) {
        case "DOWN":
          statusMsg = "응~ 못해~";
          break;
        case "UP":
          statusMsg = "쌉가능~";
          break;
        case "SLOW":
          statusMsg = "???: 될수도 있고 안될수도 있습니다.";
          break;
        default:
          statusMsg = "아몰랑";
      }
      await ctx.reply(`APEX 레게노 가능?\n${statusMsg}`, {
        parse_mode: "MarkdownV2",
      });
    } catch (err) {
      console.error(err);
    }
  }
}
