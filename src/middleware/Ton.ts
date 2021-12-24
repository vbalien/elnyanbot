import {
  getModelForClass,
  modelOptions,
  prop,
  ReturnModelType,
} from "@typegoose/typegoose";
import axios from "axios";
import TonWeb from "tonweb";
import { AppContext } from "../App";
import { command, middleware } from "../decorators";

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
  balance: number;
  estimated: number;
  wallet_address: string;
  exchange_krw: number;
};

@middleware()
export default class Ton {
  private _tonModel: ReturnModelType<typeof TonModel>;
  private tonweb = new TonWeb();

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
    const unpaid_balance = Number.parseFloat(
      this.tonweb.utils.fromNano(props.balance)
    );
    const wallet_balance = Number.parseFloat(
      this.tonweb.utils.fromNano(
        await this.tonweb.getBalance(props.wallet_address)
      )
    );
    const printTon = (amount: number) =>
      `${amount} TON ≈ ${this.wonFormat(amount * props.exchange_krw)}`;

    return `
○ Wallet Address
<code>${props.wallet_address}</code>

○ Wallet Balance
  <b>${printTon(wallet_balance)}</b>

○ Unpaid Balance
  <b>${printTon(unpaid_balance)}</b>

○ Total Balance
  <b>${printTon(wallet_balance + unpaid_balance)}</b>

○ Estimated Earnings
  ${printTon(tonDay)} / day
  ${printTon(tonWeek)} / week
  ${printTon(tonMonth)} / month

  <a href="https://tonwhales.com/mining/stats/${props.wallet_address}">more</a>
  `;
  };

  constructor() {
    this._tonModel = getModelForClass(TonModel);
  }

  @command("ton")
  async get_balance(ctx: AppContext) {
    let wallet_address = ctx.command.splitArgs[0];
    const msg = await ctx.reply("계산중...");

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

      const balance = res[0].data.balance;
      const profit = res[1].data.pool_mined / res[1].data.pool_hashrate;
      const estimated = profit * res[1].data.day_hashrate * 0.9;
      const exchange_krw = res[2].data.market_data.current_price.krw;

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        msg.message_id,
        null,
        await this.template({
          balance,
          estimated,
          wallet_address,
          exchange_krw,
        }),
        {
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }
      );
    } catch (err) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        msg.message_id,
        null,
        `에러가 발생하였습니다.\n${err.message}`
      );
    }
  }

  @command("ton_set")
  async setWallet(ctx: AppContext) {
    const walletAddress = ctx.command.splitArgs[0];

    if (!walletAddress) {
      ctx.reply("지갑을 지정해주세요.");
      return;
    }

    await this._tonModel.updateOne(
      {
        user_id: ctx.from.id,
      },
      {
        wallet_address: walletAddress,
      },
      { upsert: true }
    );
    ctx.reply("지갑이 등록되었습니다.");
  }
}
