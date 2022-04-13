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

interface Pool {
  name: string;
  amountKRW: number;
  tokens: [TokenView, TokenView];
}

interface TokenView {
  tokenName: string;
  symbol: string;
  amount: number;
  decimals: number;
}

interface WalletInfo {
  pools: Pool[];
  tokens: TokenView[];
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
export default class Klaywatch {
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
      return (kslpAmount / totalSupply) * tokenAmount;
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
      tokens: [],
      totalAmountKRW: 0,
      totalPoolAmountKRW: 0,
    };
    const client = axios.create({
      baseURL: "https://api-cypress-v2.scope.klaytn.com/v2/",
      headers: {
        referer: "https://scope.klaytn.com/",
      },
    });
    const { data: myBalances } = await client.get<KlaytnBalances>(
      `/accounts/${address}/ftBalances`
    );

    // Normal Tokens
    const normalTokens: TokenView[] = Object.values(myBalances.tokens)
      .filter((token) => token.symbol !== "KSLP")
      .map((token) => ({
        tokenName: token.tokenName,
        symbol: token.symbol,
        amount: Number.parseInt(
          myBalances.result.find((r) => r.tokenAddress === token.tokenAddress)
            .amount
        ),
        decimals: token.decimals,
      }));
    const addressDataResponse = await client.get<TokenAddressInfo>(
      `/accounts/${address}`
    );
    const tokenAddrInfo = addressDataResponse.data.result;
    normalTokens.push({
      tokenName: "Klaytn",
      symbol: "KLAY",
      amount: Number.parseInt(tokenAddrInfo.balance),
      decimals: 18,
    });
    walletInfo.tokens = normalTokens.filter((token) => token.amount !== 0);

    // Pool Tokens
    const poolTokens = Object.values(myBalances.tokens).filter(
      (token) =>
        token.symbol === "KSLP" &&
        myBalances.result.find((r) => r.tokenAddress === token.tokenAddress)
          .amount !== "0"
    );

    for (const pt of poolTokens) {
      const { data: poolBalances } = await client.get<KlaytnBalances>(
        `/accounts/${pt.tokenAddress}/ftBalances`
      );
      const m = /KlaySwap LP (\S+)-(\S+)/.exec(pt.tokenName);
      const tokens: [Token, Token] = [
        Object.values(poolBalances.tokens).find(
          (token) => token.symbol === m[1]
        ),
        Object.values(poolBalances.tokens).find(
          (token) => token.symbol === m[2]
        ),
      ];
      const tokenViews: [TokenView, TokenView] = [
        {
          tokenName: "",
          symbol: m[1],
          amount: 0,
          decimals: 18,
        },
        {
          tokenName: "",
          symbol: m[2],
          amount: 0,
          decimals: 18,
        },
      ];

      const myKslp = getMyKSLPAmount(myBalances, pt.tokenAddress);
      if (tokenViews[0].symbol === "KLAY") {
        const {
          data: { result: tokenAddrInfo },
        } = await client.get<TokenAddressInfo>(`/accounts/${pt.tokenAddress}`);
        tokenViews[0].tokenName = "Klaytn";
        tokenViews[0].decimals = 18;
        tokenViews[0].amount = tokenCalc(
          myKslp,
          Number.parseInt(pt.totalSupply),
          Number.parseInt(tokenAddrInfo.balance)
        );
      } else {
        tokenViews[0].tokenName = tokens[0].tokenName;
        tokenViews[0].decimals = tokens[0].decimals;
        tokenViews[0].amount = tokenCalc(
          myKslp,
          Number.parseInt(pt.totalSupply),
          Number.parseInt(
            poolBalances.result.find(
              (el) =>
                poolBalances.tokens[el.tokenAddress].symbol === tokens[0].symbol
            ).amount
          )
        );
      }

      tokenViews[1].tokenName = tokens[1].tokenName;
      tokenViews[1].decimals = tokens[1].decimals;
      tokenViews[1].amount = tokenCalc(
        myKslp,
        Number.parseInt(pt.totalSupply),
        Number.parseInt(
          poolBalances.result.find(
            (el) =>
              poolBalances.tokens[el.tokenAddress].symbol === tokens[1].symbol
          ).amount
        )
      );

      walletInfo.pools.push({
        name: tokenViews[0].symbol + "-" + tokenViews[1].symbol,
        amountKRW: 0,
        tokens: tokenViews,
      });
    }

    return walletInfo;
  }

  static getTokenNum(token: TokenView) {
    return (
      Math.floor(token.amount * Math.pow(10, -token.decimals) * 1e6) / 1e6
    ).toFixed(6);
  }

  makeTokenListMessage(walletInfo: WalletInfo) {
    const tokens = walletInfo.tokens.filter(
      (token) => Klaywatch.getTokenNum(token) !== "0.000000"
    );
    let tokenText = "";
    for (const token of tokens) {
      tokenText += `  ✔️${token.tokenName}\n`;
      tokenText += `    🥇${token.symbol}: ${Klaywatch.getTokenNum(token)}\n`;
      if (token !== tokens[tokens.length - 1]) tokenText += "\n";
    }
    if (tokenText === "") tokenText = "보유중인 토큰이 없습니다.\n";
    return tokenText;
  }

  makePoolListMessage(walletInfo: WalletInfo) {
    let poolText = "";
    for (const pool of walletInfo.pools) {
      poolText += `  ✔️${pool.name}\n`;
      poolText +=
        `    🥇${pool.tokens[0].symbol}: ${Klaywatch.getTokenNum(
          pool.tokens[0]
        )}\n` +
        `    🥇${pool.tokens[1].symbol}: ${Klaywatch.getTokenNum(
          pool.tokens[1]
        )}\n\n`;
    }
    return poolText;
  }

  @command("klaywatch")
  async getPool(ctx: AppContext) {
    const msg = await ctx.reply("보유자산을 계산중입니다.");
    try {
      let address: string;
      if (ctx.command.args) address = ctx.command.args;
      else {
        const wallet = await this._walletModel.findOne({
          user_id: ctx.from.id,
        });
        if (!wallet)
          throw Error(
            "지갑을 설정하지 않았습니다.\nklaywatch_set 명령어로 지갑을 설정해주세요."
          );
        address = wallet.address;
      }

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        msg.message_id,
        null,
        `👛주소: <code>${address}</code>\n\n` +
          "📚Token 목록\n계산중입니다.\n\n" +
          "📚Pool 목록\n계산중입니다.",
        { parse_mode: "HTML" }
      );

      const walletInfo = await this.getWalletInfo(address);
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        msg.message_id,
        null,
        `👛주소: <code>${address}</code>\n\n` +
          `📚Token 목록\n${this.makeTokenListMessage(walletInfo)}\n\n` +
          `📚Pool 목록\n${this.makePoolListMessage(walletInfo)}`,
        { parse_mode: "HTML" }
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
      if (!ctx.command.args) return;
      await this._walletModel.updateOne(
        {
          user_id: ctx.from.id,
        },
        {
          $set: {
            address: ctx.command.args,
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
