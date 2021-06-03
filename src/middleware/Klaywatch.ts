import { AppContext } from "../App";
import { middleware, command } from "../decorators";
import { prop, getModelForClass, ReturnModelType } from "@typegoose/typegoose";
import { KeyboardBuilder } from "../util";
import axios from "axios";

export interface TotalAmount {
  krw: string;
  usd: string;
}

export interface Amount {
  krw: string;
  usd: string;
}

export interface Price {
  krw: string;
  usd: string;
}

export interface List {
  name: string;
  assetName: string[];
  amount: Amount;
  volume: string[];
  price: Price[];
}

export interface Pool {
  message?: string;
  totalAmount: TotalAmount;
  list: List[];
}

export interface Staking {
  message?: string;
  totalAmount: TotalAmount;
  list: List[];
}

export interface Asset {
  message?: string;
  totalAmount: TotalAmount;
  list: List[];
}

export interface WalletInfo {
  totalAmount: TotalAmount;
  pool: Pool;
  staking: Staking;
  asset: Asset;
  reason?: string;
}

class Wallet {
  @prop({ required: true, unique: true })
  user_id!: number;
  @prop({ unique: true })
  address: string;
}

@middleware()
export default class Klaywatch {
  private _walletModel: ReturnModelType<typeof Wallet>;

  constructor() {
    this._walletModel = getModelForClass(Wallet);
  }

  async getWalletInfo(address: string): Promise<WalletInfo> {
    const res = await axios.get<WalletInfo>(
      `https://klaywatch.com/api/v1/balance?address=${address}`
    );
    if (res.data.reason !== undefined) throw Error(res.data.reason);
    return res.data;
  }

  makeText(walletInfo: WalletInfo) {
    const viewKRW = (krw: string) =>
      Number.parseInt(krw)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "원";
    const viewNum = (num: string) => Number.parseFloat(num).toFixed(2);
    let poolText = "";
    for (const pool of walletInfo.pool.list) {
      poolText += `  ✔️${pool.name}\n`;
      poolText +=
        `    🪙${pool.assetName[0]}: ${viewNum(pool.volume[0])}\n` +
        `    🪙${pool.assetName[1]}: ${viewNum(pool.volume[1])}\n` +
        `    💰예치 자산: ${viewKRW(pool.amount.krw)}\n\n`;
    }
    return (
      `💰총 보유자산\n  ${viewKRW(walletInfo.totalAmount.krw)}\n\n` +
      `💰Pool 예치 자산\n  ${viewKRW(walletInfo.pool.totalAmount.krw)}\n\n` +
      `📚Pool 목록\n${poolText}`
    );
  }

  @command("klaywatch")
  async getPool(ctx: AppContext) {
    const msg = await ctx.reply("보유자산을 계산중입니다.");

    try {
      const wallet = await this._walletModel.findOne({ user_id: ctx.from.id });
      const walletInfo = await this.getWalletInfo(wallet.address);
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        msg.message_id,
        null,
        `👛주소: ${wallet.address}\n\n${this.makeText(walletInfo)}`
      );
    } catch (err) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        msg.message_id,
        null,
        `에러: ${err.message}`
      );
      console.log(err);
    }
  }

  @command("klaywatch_set")
  async setWallet(ctx: AppContext) {
    try {
      if (!ctx.state.command.args) return;
      await this._walletModel.updateOne(
        {
          user_id: ctx.from.id,
        },
        {
          $set: {
            address: ctx.state.command.args,
          },
        },
        { upsert: true }
      );
      await ctx.reply("저장하였습니다.", {
        reply_markup: new KeyboardBuilder()
          .addRow([["메시지 지우기", "delmsg"]])
          .build(),
      });
    } catch (err) {
      console.log(err);
    }
  }
}
