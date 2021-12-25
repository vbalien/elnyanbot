import {
  getModelForClass,
  modelOptions,
  prop,
  ReturnModelType,
} from "@typegoose/typegoose";
import axios from "axios";
import BN from "bn.js";
import { Address, fromNano, TonClient } from "ton";
import { AppContext } from "../App";
import { action, command, middleware } from "../decorators";
import { KeyboardBuilder } from "../util";

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
  pool_balance: number | BN;
  estimated: number;
  wallet_address: string;
  exchange_krw: number;
};

@middleware()
export default class Ton {
  private _tonModel: ReturnModelType<typeof TonModel>;
  private ton = new TonClient({
    endpoint: "https://toncenter.com/api/v2/jsonRPC",
  });

  private wonFormat(won: number) {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(Math.floor(won));
  }

  private round(value: number, decimals: number) {
    return Number(
      Math.round(
        Number.parseFloat(value.toString() + "e" + decimals.toString())
      ) +
        "e-" +
        decimals.toString()
    );
  }

  private template = async (props: TemplateProps) => {
    const tonDay = this.round(props.estimated, 2);
    const tonWeek = this.round(props.estimated * 7, 2);
    const tonMonth = this.round(props.estimated * 30, 2);
    const unpaid_balance = Number.parseFloat(fromNano(props.pool_balance));
    const wallet_balance =
      props.wallet_balance !== null
        ? Number.parseFloat(fromNano(props.wallet_balance))
        : null;
    const printTon = (amount: number) =>
      `${amount} TON ≈ ${this.wonFormat(amount * props.exchange_krw)}`;

    return `
○ Wallet Address
<code>${props.wallet_address}</code>

○ Wallet Balance
  <b>${wallet_balance !== null ? printTon(wallet_balance) : "error"}</b>

○ Unpaid Balance
  <b>${printTon(unpaid_balance)}</b>

○ Total Balance
  <b>${
    wallet_balance !== null
      ? printTon(
          Number.parseFloat((wallet_balance + unpaid_balance).toFixed(9))
        )
      : "error"
  }</b>

○ Estimated Earnings
  ${printTon(tonDay)} / day
  ${printTon(tonWeek)} / week
  ${printTon(tonMonth)} / month
  `;
  };

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

      const res = await Promise.all([
        axios.get(`https://server1.whalestonpool.com/wallet/${wallet_address}`),
        axios.get(
          `https://tonminingpool.info/api/getHashrate?address=${wallet_address}`
        ),
        axios.get("https://api.coingecko.com/api/v3/coins/the-open-network"),
      ]);
      let wallet_balance: BN = null;
      try {
        wallet_balance = await this.ton.getBalance(
          Address.parse(wallet_address)
        );
      } catch (err) {
        wallet_balance = null;
      }
      const pool_balance = res[0].data.balance;
      const profit = res[1].data.pool_mined / res[1].data.pool_hashrate;
      const estimated = profit * res[1].data.day_hashrate * 0.9;
      const exchange_krw = res[2].data.market_data.current_price.krw;

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        msg.message_id,
        null,
        await this.template({
          wallet_balance,
          pool_balance,
          estimated,
          wallet_address,
          exchange_krw,
        }),
        {
          parse_mode: "HTML",
          disable_web_page_preview: true,
          reply_markup: new KeyboardBuilder()
            .addRow([
              ["🔄 Refresh", `/ton ${wallet_address}`],
              [
                "ℹ️ more",
                `https://tonwhales.com/mining/stats/${wallet_address}`,
              ],
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
              [
                "ℹ️ more",
                `https://tonwhales.com/mining/stats/${wallet_address}`,
              ],
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
