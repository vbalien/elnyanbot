import axios from "axios";
import { fromNano } from "ton";
import { TonPoolProvider } from "../pool-provider";

export default {
  name: "Ton Coin Pool",
  async balance(walletAddress: string): Promise<number> {
    const res = await axios.get(
      `https://toncoinpool.io/api/v1/public/miners/${walletAddress}`
    );
    const balance: number = res.data.balance;
    return Number.parseFloat(fromNano(balance));
  },

  async dailyProfitPerGH(): Promise<number> | null {
    const res = await axios.get("https://toncoinpool.io/api/v1/public/network");
    const profitPerGB: string = res.data.networkProfitability;
    return Number.parseFloat(fromNano(profitPerGB));
  },

  stat(walletAddress: string) {
    return `https://toncoinpool.io/miners/${walletAddress}`
  },
} as TonPoolProvider;
