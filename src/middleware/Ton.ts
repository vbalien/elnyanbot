import {
  getModelForClass,
  modelOptions,
  prop,
  ReturnModelType,
} from "@typegoose/typegoose";
import axios from "axios";
import BN from "bn.js";
import { AppContext } from "../App";
import { command, middleware } from "../decorators";

import ethUnit from "ethjs-unit";

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

  private template = (props: TemplateProps) => {
    const tonDay = this.round(props.estimated, 2);
    const tonWeek = this.round(props.estimated * 7, 2);
    const tonMonth = this.round(props.estimated * 30, 2);
    return `
○ Wallet Address
<code>${props.wallet_address}</code>

○ Unpaid Balance
  <b>${this._fromNano(props.balance)} TON</b>

○ Estimated Earnings
  ${tonDay} TON ≈ ${this.wonFormat(tonDay * props.exchange_krw)} / day
  ${tonWeek} TON ≈ ${this.wonFormat(tonWeek * props.exchange_krw)} / week
  ${tonMonth} TON ≈ ${this.wonFormat(tonMonth * props.exchange_krw)} / month

  <a href="https://tonminingpool.info/miner/${props.wallet_address}">more</a>
  `;
  };

  private _fromNano(src: BN | number | string) {
    return ethUnit.fromWei(src, "gwei") as string;
  }

  constructor() {
    this._tonModel = getModelForClass(TonModel);
  }

  @command("ton")
  async get_balance(ctx: AppContext) {
    const msg = await ctx.reply("계산중...");

    try {
      const walletData = await this._tonModel.findOne({ user_id: ctx.from.id });
      if (!walletData) {
        await ctx.telegram.editMessageText(
          ctx.chat.id,
          msg.message_id,
          null,
          "지갑이 등록되어 있지 않습니다. /ton_set 명령어를 사용하여 등록해주세요."
        );
        return;
      }

      let res = await axios.get(
        `https://server1.whalestonpool.com/wallet/${walletData.wallet_address}`
      );
      const balance = res.data.balance;

      res = await axios.get(
        `https://tonminingpool.info/api/getHashrate?address=${walletData.wallet_address}`
      );
      const profit = res.data.pool_mined / res.data.pool_hashrate;
      const estimated = profit * res.data.day_hashrate;

      res = await axios.get(
        "https://api.coingecko.com/api/v3/coins/the-open-network"
      );
      const exchange_krw = res.data.market_data.current_price.krw;

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        msg.message_id,
        null,
        this.template({
          balance,
          estimated,
          wallet_address: walletData.wallet_address,
          exchange_krw,
        }),
        {
          parse_mode: "HTML",
        }
      );
    } catch (err) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        msg.message_id,
        null,
        "에러가 발생하였습니다."
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

    await this._tonModel.create({
      user_id: ctx.from.id,
      wallet_address: walletAddress,
    });
    ctx.reply("지갑이 등록되었습니다.");
  }
}
