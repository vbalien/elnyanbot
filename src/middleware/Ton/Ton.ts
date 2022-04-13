import {
  getModelForClass,
  modelOptions,
  prop,
  ReturnModelType,
} from "@typegoose/typegoose";
import axios from "axios";
import BN from "bn.js";
import { Address, fromNano, TonClient } from "ton";
import { AppContext } from "../../App";
import { action, command, middleware } from "../../decorators";
import { KeyboardBuilder } from "../../util";
import TonPoolProviders from "./pool-providers";

@modelOptions({
  options: {
    customName: "Ton",
  },
})
class TonModel {
  @prop({ required: true, unique: true })
  user_id!: number;

  @prop({ required: true })
  wallet_address!: string;
}

type TemplateProps = {
  wallet_balance: number | BN;
  wallet_address: string;
  exchange_krw: number;
};

@middleware()
export default class Ton {
  private _tonModel: ReturnModelType<typeof TonModel>;
  private ton = new TonClient({
    endpoint: "https://node-1.servers.tonwhales.com/jsonRPC",
  });

  private wonFormat(won: number) {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(Math.floor(won));
  }

  private async template(props: TemplateProps) {
    const wallet_balance =
      props.wallet_balance !== null
        ? Number.parseFloat(fromNano(props.wallet_balance))
        : null;
    let total_balance = wallet_balance;
    const printTon = (amount: number) =>
      `${amount} TON ≈ ${this.wonFormat(amount * props.exchange_krw)}`;

    let pool_text = "";
    for (const pool of TonPoolProviders) {
      const pool_balance = await pool.balance(props.wallet_address);
      total_balance += pool_balance;
      pool_text += `  <b><a href="${pool.stat(props.wallet_address)}">${
        pool.name
      }</a></b>
      Unpaid Balance
        <b>${printTon(pool_balance)}</b>\n\n`;
    }
    pool_text = pool_text.trim();

    return `
○ Wallet Address
<code>${props.wallet_address}</code>

○ Wallet Balance
  <b>${wallet_balance !== null ? printTon(wallet_balance) : "error"}</b>

○ Pool
  ${pool_text}

○ Total Balance
  <b>${
    wallet_balance !== null
      ? printTon(Number.parseFloat(total_balance.toFixed(9)))
      : "error"
  }</b>
  `;
  }

  constructor() {
    this._tonModel = getModelForClass(TonModel);
  }

  @action(/^\/ton .+$/)
  @command("ton")
  async get_balance(ctx: AppContext) {
    let wallet_address = ctx.command.splitArgs[0];
    const send = !ctx.callbackQuery ? ctx.reply : ctx.editMessageText;
    const msg = await send("계산중...");

    if (typeof msg === "boolean") return;

    try {
      if (!wallet_address) {
        const walletData = await this._tonModel.findOne({
          user_id: ctx.from.id,
        });
        if (!walletData) {
          await ctx.telegram.editMessageText(
            ctx.chat.id,
            msg.message_id,
            null,
            "지갑이 등록되어 있지 않습니다. /ton_set 명령어를 사용하여 등록해주세요."
          );
          return;
        }
        wallet_address = walletData.wallet_address;
      }

      let wallet_balance: BN = null;
      try {
        wallet_balance = await this.ton.getBalance(
          Address.parse(wallet_address)
        );
      } catch (err) {
        wallet_balance = null;
      }

      const res = await axios.get(
        "https://api.coingecko.com/api/v3/coins/the-open-network"
      );
      const exchange_krw = res.data.market_data.current_price.krw;

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        msg.message_id,
        null,
        await this.template({
          wallet_balance,
          wallet_address,
          exchange_krw,
        }),
        {
          parse_mode: "HTML",
          disable_web_page_preview: true,
          reply_markup: new KeyboardBuilder()
            .addRow([
              ["🔄 Refresh", `/ton ${wallet_address}`],
              ["❌ Delete", "delmsg"],
            ])
            .build(),
        }
      );
    } catch (err) {
      console.error(err);
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        msg.message_id,
        null,
        `에러가 발생하였습니다.\n지갑주소: <code>${wallet_address}</code>\n${err.message}`,
        {
          parse_mode: "HTML",
          reply_markup: new KeyboardBuilder()
            .addRow([
              ["🔄 Refresh", `/ton ${wallet_address}`],
              ["❌ Delete", "delmsg"],
            ])
            .build(),
        }
      );
    }
  }

  @command("ton_set")
  async setWallet(ctx: AppContext) {
    const wallet_address = ctx.command.splitArgs[0];

    if (!wallet_address) {
      ctx.reply("지갑을 지정해주세요.", {
        reply_markup: new KeyboardBuilder()
          .addRow([["메시지 지우기", "delmsg"]])
          .build(),
      });
      return;
    }

    await this._tonModel.updateOne(
      {
        user_id: ctx.from.id,
      },
      {
        wallet_address,
      },
      { upsert: true }
    );
    ctx.reply("지갑이 등록되었습니다.", {
      reply_markup: new KeyboardBuilder()
        .addRow([["메시지 지우기", "delmsg"]])
        .build(),
    });
  }
}
