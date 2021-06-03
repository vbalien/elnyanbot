import { AppContext } from "../App";
import { middleware, command } from "../decorators";
import { prop, getModelForClass, ReturnModelType } from "@typegoose/typegoose";
import { KeyboardBuilder } from "../util";
import axios from "axios";

interface TokenAddressInfo {
  success: boolean;
  code: number;
  health: number;
  result: {
    address: string;
    balance: string;
    type: number;
    creator: string;
    creationTxHash: string;
    verificationFlag: boolean;
    transferCount: number;
    nftTransferCount: number;
    txCount: number;
    eventCount: number;
    internalTxCount: number;
    tokenName: string;
    symbol: string;
    tokenType: number;
  };
}
interface Token {
  createdAt: number;
  tokenAddress: string;
  tokenName: string;
  symbol: string;
  tokenType: number;
  parentAddress: string;
  totalSupply: string;
  totalTransfers: number;
  decimals: number;
  image: null | string;
  verified: boolean;
}
interface KlaytnBalances {
  success: boolean;
  code: number;
  result: {
    createdAt: number;
    updatedAt: number;
    address: string;
    tokenAddress: string;
    amount: string;
  }[];
  tokens: {
    [keys: string]: Token;
  };
}

interface Coin {
  name: string;
  amount: number;
}

interface Pool {
  name: string;
  amountKRW: number;
  coins: [Coin, Coin];
}

interface WalletInfo {
  pools: Pool[];
  totalAmountKRW: number;
  totalPoolAmountKRW: number;
}

class Wallet {
  @prop({ required: true, unique: true })
  user_id!: number;
  @prop({ unique: true })
  address: string;
}

@middleware()
export default class Klaywatch2 {
  private _walletModel: ReturnModelType<typeof Wallet>;

  constructor() {
    this._walletModel = getModelForClass(Wallet);
  }

  async getWalletInfo(address: string): Promise<WalletInfo> {
    const tokenCalc = (
      kslpAmount: number,
      totalSupply: number,
      tokenAmount: number
    ) => {
      return (kslpAmount / totalSupply) * tokenAmount * 1e-18;
    };
    const getMyKSLPAmount = (
      myBalances: KlaytnBalances,
      tokenAddress: string
    ) =>
      Number.parseInt(
        myBalances.result.find((el) => el.tokenAddress === tokenAddress).amount
      );
    const walletInfo: WalletInfo = {
      pools: [],
      totalAmountKRW: 0,
      totalPoolAmountKRW: 0,
    };
    const client = axios.create({
      baseURL: "https://api-cypress.scope.klaytn.com/v1/",
    });
    const { data: myBalances } = await client.get<KlaytnBalances>(
      `/accounts/${address}/balances`
    );

    const poolTokens = Object.values(myBalances.tokens).filter(
      (token) =>
        token.symbol === "KSLP" &&
        myBalances.result.find((r) => r.tokenAddress === token.tokenAddress)
          .amount !== "0"
    );

    for (const pt of poolTokens) {
      const { data: poolBalances } = await client.get<KlaytnBalances>(
        `/accounts/${pt.tokenAddress}/balances`
      );
      const m = /KlaySwap LP (\S+)-(\S+)/.exec(pt.tokenName);
      const coins: [Coin, Coin] = [
        {
          name: m[1],
          amount: 0,
        },
        {
          name: m[2],
          amount: 0,
        },
      ];

      const myKslp = getMyKSLPAmount(myBalances, pt.tokenAddress);
      if (coins[0].name === "KLAY") {
        const {
          data: { result: tokenAddrInfo },
        } = await client.get<TokenAddressInfo>(`/accounts/${pt.tokenAddress}`);
        coins[0].amount = tokenCalc(
          myKslp,
          Number.parseInt(pt.totalSupply),
          Number.parseInt(tokenAddrInfo.balance)
        );
      } else {
        coins[0].amount = tokenCalc(
          myKslp,
          Number.parseInt(pt.totalSupply),
          Number.parseInt(
            poolBalances.result.find(
              (el) =>
                poolBalances.tokens[el.tokenAddress].symbol === coins[0].name
            ).amount
          )
        );
      }
      coins[1].amount = tokenCalc(
        myKslp,
        Number.parseInt(pt.totalSupply),
        Number.parseInt(
          poolBalances.result.find(
            (el) =>
              poolBalances.tokens[el.tokenAddress].symbol === coins[1].name
          ).amount
        )
      );

      if (coins[0].name === "KUSDT") coins[0].amount *= 1e12;
      if (coins[1].name === "KUSDT") coins[1].amount *= 1e12;

      walletInfo.pools.push({
        name: coins[0].name + "-" + coins[1].name,
        amountKRW: 0,
        coins,
      });
    }

    return walletInfo;
  }

  makeText(walletInfo: WalletInfo) {
    const viewNum = (num: number) => num.toFixed(5);
    let poolText = "";
    for (const pool of walletInfo.pools) {
      poolText += `  ✔️${pool.name}\n`;
      poolText +=
        `    🥇${pool.coins[0].name}: ${viewNum(pool.coins[0].amount)}\n` +
        `    🥇${pool.coins[1].name}: ${viewNum(pool.coins[1].amount)}\n\n`;
    }
    return `📚Pool 목록\n${poolText}`;
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
