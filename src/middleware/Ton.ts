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

@middleware()
export default class Ton {
  private _tonModel: ReturnModelType<typeof TonModel>;

  private _fromNano(src: BN | number | string) {
    return ethUnit.fromWei(src, "gwei") as string;
  }

  constructor() {
    this._tonModel = getModelForClass(TonModel);
  }

  @command("ton")
  async get_balance(ctx: AppContext) {
    const walletData = await this._tonModel.findOne({ user_id: ctx.from.id });
    if (!walletData) {
      ctx.reply(
        "지갑이 등록되어 있지 않습니다. /ton_set 명령어를 사용하여 등록해주세요."
      );
      return;
    }

    const res = await axios.get(
      `https://server1.whalestonpool.com/wallet/${walletData.wallet_address}`
    );
    ctx.reply(
      `Your pool balance is: <b>${this._fromNano(res.data.balance)} TON</b>`,
      {
        parse_mode: "HTML",
      }
    );
  }

  @command("ton_set")
  async setWallet(ctx: AppContext) {
    const walletAddress = ctx.command.splitArgs[0];
    await this._tonModel.create({
      user_id: ctx.from.id,
      wallet_address: walletAddress,
    });
    ctx.reply("지갑이 등록되었습니다.");
  }
}
